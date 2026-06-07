export async function handleEstimate(request: Request, env: any, corsHeaders: any) {
	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}
	
	try {
		// Delegate to the specialized Macro Engine service
		const engineResponse = await env.MACRO_ENGINE.fetch(request.clone());
		const result = await engineResponse.json();
		
		return new Response(JSON.stringify(result), { 
			status: engineResponse.status, 
			headers: corsHeaders 
		});
	} catch (err: any) {
		return new Response(JSON.stringify({ error: `Macro Engine unreachable: ${err.message}` }), { 
			status: 500, 
			headers: corsHeaders 
		});
	}
}
