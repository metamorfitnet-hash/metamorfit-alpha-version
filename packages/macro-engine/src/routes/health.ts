export async function handleHealth(request: Request, env: any, corsHeaders: any) {
	const health: any = { status: 'ok', timestamp: Date.now(), systems: {} };
	try {
		await env.JOB_STATUS.put('_health', 'ok', { expirationTtl: 60 });
		health.systems.kv = 'ok';
		await env.METAMORFIT_DB.prepare("SELECT 1").first();
		health.systems.d1 = 'ok';
		await env.PDF_STORAGE.list({ limit: 1 });
		health.systems.r2 = 'ok';
		return new Response(JSON.stringify(health), { status: 200, headers: corsHeaders });
	} catch (err: any) {
		health.status = 'error';
		health.error = err.message;
		return new Response(JSON.stringify(health), { status: 500, headers: corsHeaders });
	}
}
