import { NextRequest, NextResponse } from "next/server";
import { generateHmacSignature } from "@/lib/cryptoUtils";

// ── Phase 5.2: Vercel Edge Runtime ────────────────────────────────────────────
// Switches this route from a Node.js Lambda to a globally distributed edge
// function. Benefits: ~0ms cold starts, lower latency, no 10s timeout.
// Compatible because we use only Web Crypto API (no Node.js-only modules).
export const runtime = "edge";

const WORKER_URL = process.env.WORKER_URL || "";
const HMAC_SECRET = process.env.HMAC_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    // 1. Read and validate the incoming body
    const payload = await req.json();

    if (!payload.email || !payload.fullName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: email, fullName" },
        { status: 400 }
      );
    }

    // 2. Sign the request with HMAC before forwarding to the Worker
    const bodyText = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = await generateHmacSignature(timestamp, bodyText, HMAC_SECRET);

    // 3. Forward to the Cloudflare Worker with a generous timeout
    // Edge functions do not have a 10s Vercel limit — they stream the response.
    const workerResponse = await fetch(`${WORKER_URL}/api/send-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signature,
        "x-timestamp": timestamp,
      },
      body: bodyText,
    });

    // 4. Relay the worker's JSON response back to the client
    const data = await workerResponse.json();

    if (!workerResponse.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || "Worker returned an error" },
        { status: workerResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("[Edge/send-pdf] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Allow preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
