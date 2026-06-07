import { getJobStatus } from '../db/kvStatus';

export async function handleStatus(request: Request, env: any, url: URL, corsHeaders: any) {
	const jobId = url.pathname.split("/").pop();
	if (!jobId) return new Response(JSON.stringify({ error: "Missing jobId" }), { status: 400, headers: corsHeaders });
	
	const jobStr = await getJobStatus(env, jobId);
	if (!jobStr) return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: corsHeaders });
	
	return new Response(jobStr, { status: 200, headers: corsHeaders });
}
