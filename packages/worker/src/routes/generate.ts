import * as Sentry from '@sentry/cloudflare';
import { PdfRequestSchema, DeliveryPayload } from '../schema/pdfRequest';
import { verifyHmacSignature } from '../utils/auth';
import { initializeJobStatus, updateJobStatus, getJobStatus } from '../db/kvStatus';
import { insertUserPlan, updateUserPlanStatus, updateUserPlanMetrics, updateUserPlanError } from '../db/database';
import { getAiExplanation, ExplanationInput } from '../explanation';
import { renderMetamorfitPdf } from '../renderer';
import { uploadPdfToR2 } from '../services/r2Service';
import { createSystemeContact } from '../services/crmService';
import { sendPlanEmail } from '../services/emailService';

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
	const jobId = (rawPayload as any).userId || crypto.randomUUID();
	const { email, fullName } = payload;
	const locale = payload.locale || 'en';

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
			// Bypass macro calculation if frontend already provided the profile.
			// This prevents localhost fallback crashes in production when the service binding fails.
			if (payload.metabolicProfile && payload.metabolicProfile.targetKcal) {
				Sentry.addBreadcrumb({ category: 'pipeline', message: 'Using provided Macro calculation', level: 'info' });
				await updateJobStatus(env, jobId, { 
					status: 'calculated', 
					results: { macros: payload.metabolicProfile } 
				});
			} else {
				currentErrorCode = 'MACRO_CALC_FAIL';
				Sentry.addBreadcrumb({ category: 'pipeline', message: 'Starting Macro calculation', level: 'info' });
				
				let macroData;
				try {
					const macroReq = new Request("https://metamorfit-worker/api/calculate", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload)
					});
					const macroRes = await env.MACRO_ENGINE.fetch(macroReq);
					if (!macroRes.ok) throw new Error(`Macro engine returned ${macroRes.status}`);
					macroData = await macroRes.json();
				} catch (e) {
					console.log("MACRO_ENGINE binding failed, falling back to production API", e);
					const macroUrl = env.MACRO_ENGINE_URL || "https://metamorfit.online";
					const macroRes = await fetch(`${macroUrl}/api/calculate`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload)
					});
					if (!macroRes.ok) throw new Error(`Fallback Macro engine returned ${macroRes.status}`);
					macroData = await macroRes.json();
				}
				
				// Map macro results
				payload.metabolicProfile = macroData;
				
				await updateJobStatus(env, jobId, { 
					status: 'calculated', 
					results: { macros: macroData } 
				});
			}

			// B. AI Generation
			currentErrorCode = 'AI_GEN_FAIL';
			Sentry.addBreadcrumb({ category: 'pipeline', message: 'Starting AI explanation generation', level: 'info' });
			
			// Explicitly fetch macro results from KV Ledger per spec
			const ledgerRaw = await env.MM_LEDGER.get(jobId);
			const ledgerState = ledgerRaw ? JSON.parse(ledgerRaw) : {};
			const macrosFromLedger = ledgerState.results?.metrics?.macros || payload.metabolicProfile;

			// Resilient backend fallback: hydrate payload.identity using ledgerState
			payload.identity = payload.identity || {};
			if (ledgerState.data) {
				const data = ledgerState.data;
				const metrics = ledgerState.results?.metrics || {};

				payload.identity.name = payload.identity.name || payload.fullName || data.persona || "MetaMorfit";
				payload.identity.age = payload.identity.age || Number(data.age) || undefined;
				
				// Weight conversion / resolution
				let weightKg = payload.identity.weightKg || Number(metrics.weightKg);
				if (!weightKg && data.weightValue) {
					weightKg = data.weightUnit === 'lbs' 
						? Number(data.weightValue) * 0.453592 
						: Number(data.weightValue);
				}
				payload.identity.weightKg = weightKg ? Math.round(weightKg) : undefined;

				// Height conversion / resolution
				let heightCm = payload.identity.heightCm || Number(metrics.heightCm);
				if (!heightCm && data.heightValue) {
					heightCm = data.heightUnit === 'ft' 
						? Number(data.heightValue) * 2.54 
						: Number(data.heightValue);
				}
				payload.identity.heightCm = heightCm ? Math.round(heightCm) : undefined;

				payload.identity.bodyFatPct = payload.identity.bodyFatPct || Number(data.bodyFatPercent) || undefined;
				
				// Goal resolution - translate default/empty to a professional goal
				let goal = payload.identity.goal || data.goal;
				if (!goal || goal.toUpperCase() === 'DEFAULT') {
					goal = 'Metabolic Optimization';
				} else if (goal.toLowerCase() === 'cut') {
					goal = 'Fat Loss';
				} else if (goal.toLowerCase() === 'bulk') {
					goal = 'Muscle Gain';
				} else if (goal.toLowerCase() === 'maintain') {
					goal = 'Maintenance';
				} else if (goal.toLowerCase() === 'recomp') {
					goal = 'Recomposition';
				}
				payload.identity.goal = goal;

				// Somatotype resolution - translate default/empty to a professional body type
				let bodyType = payload.identity.bodyType || data.somatotype || data.persona;
				if (!bodyType || bodyType.toUpperCase() === 'DEFAULT') {
					bodyType = 'Mesomorph';
				}
				payload.identity.bodyType = bodyType;
			}

			// Clean fallback values in case ledgerState didn't populate them
			payload.identity.name = payload.identity.name || payload.fullName || "MetaMorfit";
			if (!payload.identity.goal || payload.identity.goal.toUpperCase() === 'DEFAULT') {
				payload.identity.goal = 'Metabolic Optimization';
			}
			if (!payload.identity.bodyType || payload.identity.bodyType.toUpperCase() === 'DEFAULT') {
				payload.identity.bodyType = 'Mesomorph';
			}
			
			const aiStart = Date.now();
			const aiResult = await getAiExplanation(env, {
				locale: payload.locale || ledgerState.data?.locale || 'en',
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
			const pdfStream = await renderMetamorfitPdf(payload, env);
			const r2Key = await uploadPdfToR2(env, jobId, pdfStream);
			
			// Worker-relative URL for the frontend / API consumers
			const downloadUrl = `https://metamorfit-worker-alpha.metamorfitnet.workers.dev/api/download/${jobId}`;

			await updateJobStatus(env, jobId, { 
				status: 'pdf_stored', 
				delivery: { r2Key, downloadUrl } 
			});
			try { await updateUserPlanStatus(env, jobId, 'emailing', r2Key); } catch(e){}

			// D. Email Delivery (using R2 hosted link)
			currentErrorCode = 'EMAIL_SEND_FAIL';
			Sentry.addBreadcrumb({ category: 'pipeline', message: `Starting Brevo email delivery to ${email}`, level: 'info' });
			await sendPlanEmail(env, email, fullName, downloadUrl, jobId, locale);
			
			await updateJobStatus(env, jobId, { status: 'delivered' });
			Sentry.addBreadcrumb({ category: 'pipeline', message: 'Email delivered successfully via Brevo', level: 'info' });

			// === CRITICAL: Update MM_LEDGER immediately after email delivery ===
			// This MUST happen before any non-critical sync (CRM, Supabase, D1)
			// so the frontend Thank You page unblocks and displays the PDF link.
			try {
				const ledgerRawFinish = await env.MM_LEDGER.get(jobId);
				const ledgerStateFinish = ledgerRawFinish ? JSON.parse(ledgerRawFinish) : { userId: jobId };
				ledgerStateFinish.status = 'delivered';
				ledgerStateFinish.results = ledgerStateFinish.results || {};
				ledgerStateFinish.results.pdfUrl = downloadUrl;
				ledgerStateFinish.updatedAt = new Date().toISOString();
				await env.MM_LEDGER.put(jobId, JSON.stringify(ledgerStateFinish), { expirationTtl: 259200 });
				console.log(`[Job ${jobId}] MM_LEDGER updated to 'delivered' with pdfUrl`);
			} catch (ledgerErr: any) {
				console.error(`[Job ${jobId}] CRITICAL: MM_LEDGER update failed:`, ledgerErr.message);
				Sentry.captureException(ledgerErr);
			}

			// === NON-CRITICAL SYNC (Best-effort, failures here do NOT block the user) ===
			try {
				// 1. CRM Sync (Systeme.io) - Founder tracking
				Sentry.addBreadcrumb({ category: 'pipeline', message: 'Starting CRM sync (Systeme.io)', level: 'info' });
				await createSystemeContact(env, { email, fullName, tags: ["lead", "plan-delivered", ...(payload.tags || [])] });

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
						},
						body: JSON.stringify({ email, full_name: fullName, plan_data: payload.metabolicProfile })
					});
				}

				// 3. Cloudflare D1 - Log technical metrics
				Sentry.addBreadcrumb({ category: 'pipeline', message: 'Logging to D1', level: 'info' });
				const totalProcessingTime = Date.now() - (ledgerState.createdAt || Date.now());
				await updateUserPlanMetrics(env, jobId, totalProcessingTime);
				await updateUserPlanStatus(env, jobId, 'complete');
			} catch (syncErr: any) {
				// Non-critical sync failures are logged but do NOT affect user delivery
				console.error(`[Job ${jobId}] Non-critical sync failed (CRM/Supabase/D1):`, syncErr.message);
				Sentry.withScope((scope) => {
					scope.setTag('errorCode', 'SYNC_FAIL_NONCRITICAL');
					scope.setLevel('warning');
					Sentry.captureException(syncErr);
				});
			}
		} catch (err: any) {
			console.error(`[Job ${jobId}] Failed at ${currentErrorCode}:`, err.message);
			await updateJobStatus(env, jobId, { status: 'failed', error: err.message });
			try { await updateUserPlanError(env, jobId, err.message, currentErrorCode); } catch(e){}

			// CRITICAL: Also update MM_LEDGER on failure so the frontend unblocks
			// instead of polling forever on 'in_progress'
			try {
				const ledgerRawFail = await env.MM_LEDGER.get(jobId);
				const ledgerStateFail = ledgerRawFail ? JSON.parse(ledgerRawFail) : { userId: jobId };
				ledgerStateFail.status = 'failed';
				ledgerStateFail.error = `${currentErrorCode}: ${err.message}`;
				ledgerStateFail.updatedAt = new Date().toISOString();
				await env.MM_LEDGER.put(jobId, JSON.stringify(ledgerStateFail), { expirationTtl: 259200 });
				console.log(`[Job ${jobId}] MM_LEDGER updated to 'failed'`);
			} catch (ledgerFailErr: any) {
				console.error(`[Job ${jobId}] Could not update MM_LEDGER on failure:`, ledgerFailErr.message);
			}

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

	return new Response(JSON.stringify({ jobId }), { status: 202, headers: corsHeaders });
}
