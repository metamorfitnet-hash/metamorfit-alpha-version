import { getPdfFromR2 } from '../services/r2Service';

export async function handleDownload(request: Request, env: any, url: URL, corsHeaders: any) {
	const jobId = url.pathname.replace("/api/download/", "").split("/")[0];
	if (!jobId) {
		return new Response(JSON.stringify({ error: "Missing jobId" }), { status: 400, headers: corsHeaders });
	}

	const pdfObject = await getPdfFromR2(env, jobId);

	if (!pdfObject) {
		return new Response(JSON.stringify({ error: "PDF not found" }), { status: 404, headers: corsHeaders });
	}

	return new Response(pdfObject.body, {
		status: 200,
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="metamorfit-plan-${jobId}.pdf"`,
			"Cache-Control": "private, max-age=3600",
			"Access-Control-Allow-Origin": "*",
		},
	});
}
