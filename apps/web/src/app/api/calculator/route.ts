import { NextRequest, NextResponse } from "next/server";

// ── Phase 5.2: Vercel Edge Runtime ────────────────────────────────────────────
// Proxies macro-calculation requests to the Cloudflare Worker's /estimate-macros
// endpoint. Running on the Edge eliminates cold starts and keeps the WORKER_URL
// server-side (never exposed to the browser).
export const runtime = "edge";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_A_URL || "https://metamorfit-worker-beta.metamorfitnet.workers.dev";

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();


    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error(`[Edge/calculator] Failed to parse request JSON:`, e);
      return NextResponse.json({ success: false, error: "Invalid JSON from frontend" }, { status: 400 });
    }

    // Determine which endpoint to call based on the payload
    const isMealEstimation = !!body.description || !!body.meal;
    // Map 'meal' to 'description' if that's what the frontend sends
    const requestPayload = isMealEstimation ? { description: body.description || body.meal, locale: body.locale || 'en' } : body;
    const endpoint = isMealEstimation ? "/api/estimate-macros" : "/api/calculate";



    if (!WORKER_URL) {
      console.error(`[Edge/calculator] CRITICAL ERROR: WORKER_URL environment variable is missing!`);
      return NextResponse.json(
        { success: false, error: "Server misconfiguration: WORKER_URL is undefined" },
        { status: 500 }
      );
    }

    const fetchUrl = `${WORKER_URL}${endpoint}`;


    let workerResponse;
    try {
      workerResponse = await fetch(fetchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
    } catch (fetchErr: any) {
      console.error(`[Edge/calculator] CRITICAL FETCH ERROR to Worker:`, fetchErr);
      return NextResponse.json(
        { success: false, error: `Failed to connect to worker: ${fetchErr.message}` },
        { status: 502 }
      );
    }



    // Read the text first so we can log it if parsing fails
    const responseText = await workerResponse.text();


    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr: any) {
      console.error(`[Edge/calculator] Failed to parse worker response as JSON. Error:`, parseErr.message);
      return NextResponse.json(
        { success: false, error: "Worker returned invalid JSON", raw: responseText },
        { status: 502 }
      );
    }

    if (!workerResponse.ok) {
      console.error(`[Edge/calculator] Worker returned an error state:`, data);
      return NextResponse.json(
        { success: false, error: data?.error || "Calculator error" },
        { status: workerResponse.status }
      );
    }


    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("[Edge/calculator] Unhandled Exception:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
