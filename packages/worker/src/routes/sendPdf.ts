import * as Sentry from '@sentry/cloudflare';
import { PdfRequestSchema, DeliveryPayload } from '../schema/pdfRequest';
import { verifyHmacSignature } from '../utils/auth';
import { initializeJobStatus, updateJobStatus } from '../db/kvStatus';
import { insertUserPlan, updateUserPlanStatus, updateUserPlanMetrics, updateUserPlanError } from '../db/database';
import { getAiExplanation, ExplanationInput } from '../explanation';
import { renderMetamorfitPdf } from '../renderer';
import { uploadPdfToR2 } from '../services/r2Service';
import { createSystemeContact } from '../services/crmService';
import { sendPlanEmail } from '../services/emailService';

export async function handleSendPdf(request: Request, env: any, ctx: any, corsHeaders: any) {
	const bodyText = await request.text();
	const signature = request.headers.get("x-signature") || "";
	const timestamp = request.headers.get("x-timestamp") || "";

	const isValidSignature = await verifyHmacSignature(signature, timestamp, bodyText, env.HMAC_SECRET);
	if (!isValidSignature) {
		return new Response(JSON.stringify({ error: "Unauthorized - Invalid Signature" }), { status: 401, headers: corsHeaders });
	}

	let rawPayload;
	try {
		rawPayload = JSON.parse(bodyText);
	} catch (e) {
		return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
	}

	const validation = PdfRequestSchema.safeParse(rawPayload);
	if (!validation.success) {
		return new Response(JSON.stringify({ error: "Validation failed", details: validation.error.format() }), { status: 400, headers: corsHeaders });
	}

	const payload = validation.data as DeliveryPayload;
	const jobId = crypto.randomUUID();
	const { email, fullName } = payload;

	// 1. Initial State
	await initializeJobStatus(env, jobId, payload);
	await insertUserPlan(env, crypto.randomUUID(), email, jobId);

	// 2. Background Execution
	ctx.waitUntil((async () => {
		let currentErrorCode = 'UNKNOWN_ERR';

		// Set Sentry context for all errors in this background task
		Sentry.setTag('jobId', jobId);
		Sentry.setTag('userEmail', email);
		Sentry.setUser({ email });

		try {
			// A. AI Generation
			if (!payload.explanation && payload.identity && payload.metabolicProfile) {
				currentErrorCode = 'AI_GEN_FAIL';
				Sentry.addBreadcrumb({ category: 'pipeline', message: 'Starting AI explanation generation', level: 'info' });
				const aiStart = Date.now();
				const aiResult = await getAiExplanation(env, {
					locale: payload.locale || 'en',
					identity: payload.identity,
					metabolicProfile: payload.metabolicProfile,
					personalizationScore: payload.personalization?.personalizationScore || 100
				} as ExplanationInput);
				payload.explanation = aiResult.explanation;
				const aiLatency = Date.now() - aiStart;
				await updateJobStatus(env, jobId, { explanation: aiResult.explanation });
				await updateUserPlanMetrics(env, jobId, aiLatency);
				Sentry.addBreadcrumb({ category: 'pipeline', message: `AI generation complete (${aiLatency}ms)`, level: 'info' });
			}

			// B. PDF Generation
			currentErrorCode = 'PDF_GEN_FAIL';
			Sentry.addBreadcrumb({ category: 'pipeline', message: 'Starting PDF generation via Gotenberg', level: 'info' });
			await updateJobStatus(env, jobId, { status: 'generating', stage: 'pdf' });
			const pdfStream = await renderMetamorfitPdf(payload, env);
			const r2Key = await uploadPdfToR2(env, jobId, pdfStream);
			await updateUserPlanStatus(env, jobId, 'emailing', r2Key);
			Sentry.addBreadcrumb({ category: 'pipeline', message: `PDF stream generated and uploaded to R2`, level: 'info' });

			const downloadUrl = `https://metamorfit.online/api/download/${jobId}`;

			// C. Email Delivery — runs BEFORE CRM so it always succeeds
			currentErrorCode = 'EMAIL_SEND_FAIL';
			Sentry.addBreadcrumb({ category: 'pipeline', message: `Starting Brevo email delivery to ${email}`, level: 'info' });
			await updateJobStatus(env, jobId, { status: 'generating', stage: 'email' });
			await sendPlanEmail(env, email, fullName, downloadUrl, jobId);
			Sentry.addBreadcrumb({ category: 'pipeline', message: 'Email delivered successfully via Brevo', level: 'info' });

			// D. CRM Sync — fire-and-forget, never blocks email delivery
			// A pre-existing contact, API rate limit, or any other CRM error
			// is fully isolated here so the user always receives their PDF.
			try {
				Sentry.addBreadcrumb({ category: 'pipeline', message: 'Starting CRM sync (Systeme.io)', level: 'info' });
				await updateJobStatus(env, jobId, { status: 'generating', stage: 'crm' });
				await createSystemeContact(env, { email, fullName, tags: payload.tags || [] });
				Sentry.addBreadcrumb({ category: 'pipeline', message: 'CRM sync complete', level: 'info' });
			} catch (crmErr: any) {
				console.error(`[Job ${jobId}] CRM sync failed (non-fatal):`, crmErr.message);
				// Capture CRM failures as warnings (non-fatal) — they don't block email delivery
				Sentry.withScope((scope) => {
					scope.setTag('errorCode', 'CRM_SYNC_ERR');
					scope.setLevel('warning');
					scope.setContext('crm_details', { email, fullName, error: crmErr.message });
					Sentry.captureException(crmErr);
				});
			}

			// E. Success
			await updateJobStatus(env, jobId, { status: 'complete', stage: 'done' });
			await updateUserPlanStatus(env, jobId, 'complete');
		} catch (err: any) {
			console.error(`[Job ${jobId}] Failed at ${currentErrorCode}:`, err.message);
			await updateJobStatus(env, jobId, { status: 'failed', error: err.message });
			await updateUserPlanError(env, jobId, err.message, currentErrorCode);

			// ── CRITICAL: Capture pipeline failures in Sentry ──────────────────
			// Without this, all errors inside waitUntil() are invisible to Sentry
			// because the outer Sentry.withSentry() wrapper only catches top-level
			// fetch handler exceptions, not background task failures.
			Sentry.withScope((scope) => {
				scope.setTag('errorCode', currentErrorCode);
				scope.setLevel('error');
				scope.setContext('pipeline_state', {
					jobId,
					email,
					failedAt: currentErrorCode,
					errorMessage: err.message,
				});
				Sentry.captureException(err);
			});
		}
	})());

	return new Response(JSON.stringify({ success: true, jobId }), { status: 202, headers: corsHeaders });
}
