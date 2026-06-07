import { verifyHmacSignature } from '../utils/auth';

export async function handleSync(request: Request, env: any, corsHeaders: any) {
	const bodyText = await request.text();
	const signature = request.headers.get("x-signature") || "";
	const timestamp = request.headers.get("x-timestamp") || "";
	
	const isValid = await verifyHmacSignature(signature, timestamp, bodyText, env.HMAC_SECRET);
	if (!isValid) return new Response(JSON.stringify({ error: "Unauthorized Sync" }), { status: 401, headers: corsHeaders });

	const { userId, userEmail } = JSON.parse(bodyText);
	if (!userId || !userEmail) return new Response(JSON.stringify({ error: "Missing identity data" }), { status: 400, headers: corsHeaders });

	await env.METAMORFIT_DB.prepare(
		"UPDATE user_plans SET supabase_id = ? WHERE user_email = ? AND supabase_id IS NULL"
	).bind(userId, userEmail).run();

	return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
}
