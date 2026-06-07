import * as Sentry from '@sentry/cloudflare';
import { PdfRequestSchema, DeliveryPayload } from '../schema/pdfRequest';
import { verifyHmacSignature } from '../utils/auth';
import { initializeJobStatus, updateJobStatus, getJobStatus } from '../db/kvStatus';
import { insertUserPlan, updateUserPlanStatus, updateUserPlanMetrics, updateUserPlanError } from '../db/database';
import { getAiExplanation, ExplanationInput } from '../services/aiService';
import { renderMetamorfitPdf } from '../renderer';
import { uploadPdfToR2 } from '../services/r2Service';
import { createSystemeContact } from '../services/crmService';
import { sendPlanEmail } from '../services/emailService';
import { calculateMacros } from '../utils/calculator';

export async function handleGenerate(request: Request, env: any, ctx: any, corsHeaders: any) {
	const bodyText = await request.text();
	const signature = request.headers.get("x-signature") || "";
	const timestamp = request.headers.get("x-timestamp") || "";

	// Uncomment to enforce HMAC signature (depends on frontend sending it)
	// const isValidSignature = await verifyHmacSignature(signature, timestamp, bodyText, env.HMAC_SECRET);
	// if (!isValidSignature) {
	// 	return new Response(JSON.stringify({ error: "Unauthorized - Invalid Signature" }), { status: 401, headers: corsHeaders });
	// }

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

	// 1. Initial State - KV Ledger
	await initializeJobStatus(env, jobId, payload);
	
	// Legacy DB insert just in case
	try {
		await insertUserPlan(env, crypto.randomUUID(), email, jobId);
	} catch(e) {}

	// 2. Background Execution
	ctx.waitUntil((async () => {
		let currentErrorCode = 'UNKNOWN_ERR';

		Sentry.setTag('jobId', jobId);
		Sentry.setTag('userEmail', email);
		Sentry.setUser({ email });

		try {
			// A. Macro Engine Execution
			currentErrorCode = 'MACRO_CALC_FAIL';
			Sentry.addBreadcrumb({ category: 'pipeline', message: 'Starting Macro calculation', level: 'info' });
			
			let macroData;
			try {
				// Use local calculation utility since we merged the workers
				const calcInput = {
					age: payload.identity?.age || 30,
					sex: (payload.identity?.sex as any) || 'male',
					weightKg: payload.identity?.weightKg || 70,
					heightCm: payload.identity?.heightCm || 170,
					activityLevel: (payload.identity?.activityLevel as any) || 'moderate',
					goal: (payload.identity?.goal as any) || 'maintenance',
					bodyType: (payload.identity?.bodyType as any)
				};
				macroData = calculateMacros(calcInput as any);
			} catch (e: any) {
				console.error("Local calculation failed", e);
				throw new Error(`Macro calculation failed: ${e.message}`);
			}
			
			// Map macro results
			payload.metabolicProfile = macroData;
			
			await updateJobStatus(env, jobId, { 
				status: 'calculated', 
				results: { macros: macroData } 
			});

			// B. AI Generation
			currentErrorCode = 'AI_GEN_FAIL';
			Sentry.addBreadcrumb({ category: 'pipeline', message: 'Starting AI explanation generation', level: 'info' });
			
			// Explicitly fetch macro results from KV Ledger per spec
			const ledgerRaw = await getJobStatus(env, jobId);
			const ledgerState = ledgerRaw ? JSON.parse(ledgerRaw) : {};
			const macrosFromLedger = ledgerState.results?.macros || payload.metabolicProfile;
			
			const aiStart = Date.now();
			const aiResult = await getAiExplanation(env, {
				identity: payload.identity || {},
				metabolicProfile: macrosFromLedger,
				personalizationScore: payload.personalizationScore || 100
			} as ExplanationInput);
			payload.explanation = aiResult.explanation;
			const aiLatency = Date.now() - aiStart;
			
			await updateJobStatus(env, jobId, { 
				status: 'ai_complete', 
				results: { aiInsight: aiResult.explanation } 
			});
			try { await updateUserPlanMetrics(env, jobId, aiLatency); } catch(e){}

			// C. PDF Generation & Streaming to R2
			currentErrorCode = 'PDF_GEN_FAIL';
			Sentry.addBreadcrumb({ category: 'pipeline', message: 'Starting PDF generation via Gotenberg', level: 'info' });
			const pdfStream = await renderMetamorfitPdf(payload as any, env);
			const r2Key = await uploadPdfToR2(env, jobId, pdfStream);
			
			// Worker-relative URL for the frontend / API consumers
			const downloadUrl = `https://beta.metamorfit.pro/api/download/${jobId}`;

			await updateJobStatus(env, jobId, { 
				status: 'pdf_stored', 
				delivery: { r2Key: r2Key || undefined, downloadUrl } 
			});
			try { await updateUserPlanStatus(env, jobId, 'emailing', r2Key || undefined); } catch(e){}

			// D. Email Delivery (using R2 hosted link)
			currentErrorCode = 'EMAIL_SEND_FAIL';
			Sentry.addBreadcrumb({ category: 'pipeline', message: `Starting Brevo email delivery to ${email}`, level: 'info' });
			await sendPlanEmail(env, email, fullName, downloadUrl, jobId);
			
			await updateJobStatus(env, jobId, { status: 'delivered' });
			Sentry.addBreadcrumb({ category: 'pipeline', message: 'Email delivered successfully via Brevo', level: 'info' });

			// === FINAL HAND-OFF (Double-Commit) ===
			currentErrorCode = 'FINAL_DELIVERY_SYNC_FAIL';
			try {
				// 1. CRM Sync (Systeme.io) - Founder tracking
				Sentry.addBreadcrumb({ category: 'pipeline', message: 'Starting CRM sync (Systeme.io)', level: 'info' });
				await createSystemeContact(env, { email, fullName, tags: ["lead", "plan-delivered", ...(payload.tags || [])].map(String) });

				// 2. Supabase - Update/Create user profile with final plan data
				if (env.SUPABASE_URL && env.SUPABASE_KEY) {
					Sentry.addBreadcrumb({ category: 'pipeline', message: 'Syncing to Supabase', level: 'info' });
					await fetch(`${env.SUPABASE_URL}/rest/v1/user_profiles`, {
						method: 'POST',
						headers: {
							'apikey': env.SUPABASE_KEY,
							'Authorization': `Bearer ${env.SUPABASE_KEY}`,
							'Content-Type': 'application/json',
							'Prefer': 'resolution=merge-duplicates'
						} as any,
						body: JSON.stringify({ email, full_name: fullName, plan_data: payload.metabolicProfile })
					});
				}

				// 3. Cloudflare D1 - Log technical metrics
				Sentry.addBreadcrumb({ category: 'pipeline', message: 'Logging to D1', level: 'info' });
				const totalProcessingTime = Date.now() - (ledgerState.createdAt || Date.now());
				await updateUserPlanMetrics(env, jobId, totalProcessingTime);
				await updateUserPlanStatus(env, jobId, 'complete');

				// 4. Final Status to KV Ledger (TTL 24 hours handled internally by updateJobStatus)
				await updateJobStatus(env, jobId, { status: 'delivered' });
			} catch (syncErr: any) {
				console.error(`[Job ${jobId}] Final Sync failed:`, syncErr.message);
				await updateJobStatus(env, jobId, { status: 'failed', error: `Final Sync Failed: ${syncErr.message}` });
				Sentry.withScope((scope) => {
					scope.setTag('errorCode', 'FINAL_DELIVERY_SYNC_FAIL');
					scope.setLevel('error');
					Sentry.captureException(syncErr);
				});
				throw syncErr; // trigger outer catch to capture full pipeline failure if needed
			}
		} catch (err: any) {
			console.error(`[Job ${jobId}] Failed at ${currentErrorCode}:`, err.message);
			await updateJobStatus(env, jobId, { status: 'failed', error: err.message });
			try { await updateUserPlanError(env, jobId, err.message, currentErrorCode); } catch(e){}

			Sentry.withScope((scope) => {
				scope.setTag('errorCode', currentErrorCode);
				scope.setLevel('error');
				scope.setContext('pipeline_state', {
					jobId,
					email,
					failedAt: currentErrorCode,
					errorMessage: err.message,
				} as any);
				Sentry.captureException(err);
			});
		}
	})());

	return new Response(JSON.stringify({ jobId }), { status: 202, headers: corsHeaders });
}
