import { verifyHmacSignature } from '../utils/auth';
import { getAdminStats } from '../db/analytics';

export async function handleStats(request: Request, env: any, corsHeaders: any) {
	const signature = request.headers.get("x-signature") || "";
	const timestamp = request.headers.get("x-timestamp") || "";
	
	// GET requests for stats have no body
	const isValid = await verifyHmacSignature(signature, timestamp, "", env.HMAC_SECRET);
	
	if (!isValid) {
		return new Response(JSON.stringify({ error: "Unauthorized Admin" }), { status: 401, headers: corsHeaders });
	}

	const stats = await getAdminStats(env);
	return new Response(JSON.stringify({ success: true, stats }), { status: 200, headers: corsHeaders });
}
