import { updateJobStatus } from '../db/kvStatus';
import { updateUserPlanStatus } from '../db/database';

export async function handleWebhook(request: Request, env: any, corsHeaders: any) {
	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}

	try {
		const payload: any = await request.json();
		const event = payload.event;
		const email = payload.email;
		const tags = payload.tags || [];
		const jobId = tags[0]; // We store jobId in the first tag

		console.log(`[Webhook] Received ${event} for ${email} (Job: ${jobId})`);

		if (!jobId) return new Response('No JobId found', { status: 200 });

		if (event === 'delivered') {
			await updateJobStatus(env, jobId, { status: 'complete', stage: 'done' });
			await updateUserPlanStatus(env, jobId, 'complete');
		} else if (event === 'error' || event === 'deferred' || event === 'soft_bounce' || event === 'hard_bounce') {
			await updateJobStatus(env, jobId, { status: 'failed', stage: 'email', error: `Email ${event}: ${payload.reason || 'unknown'}` });
			await updateUserPlanStatus(env, jobId, 'failed');
		}

		return new Response('OK', { status: 200 });
	} catch (err: any) {
		console.error('[Webhook Error]', err.message);
		return new Response('Internal Error', { status: 500 });
	}
}
