import { verifyHmacSignature } from '../utils/auth';

export async function handleGallery(request: Request, env: any, url: URL, corsHeaders: any) {
	const signature = request.headers.get("x-signature") || "";
	const timestamp = request.headers.get("x-timestamp") || "";
	const userId = url.searchParams.get("userId");
	
	if (!userId) return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400, headers: corsHeaders });

	const isValid = await verifyHmacSignature(signature, timestamp, "", env.HMAC_SECRET);
	if (!isValid) return new Response(JSON.stringify({ error: "Unauthorized Gallery Access" }), { status: 401, headers: corsHeaders });

	const plans = await env.METAMORFIT_DB.prepare(
		"SELECT job_id, status, pdf_url, created_at FROM user_plans WHERE supabase_id = ? ORDER BY created_at DESC"
	).bind(userId).all();

	return new Response(JSON.stringify(plans.results), { status: 200, headers: corsHeaders });
}
