import { NextRequest, NextResponse } from "next/server";
import { generateHmacSignature } from "@/lib/cryptoUtils";

export const runtime = "edge";

const WORKER_URL = process.env.WORKER_URL || "";
const HMAC_SECRET = process.env.HMAC_SECRET || "";

/**
 * Secure proxy for admin analytics. 
 * Prevents exposing HMAC_SECRET to the client-side browser.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Simple session/password check (should be replaced by real Auth later)
    // For now, we assume the middleware or the page already checked the password,
    // but we can add an extra header check here if needed.

    // 2. Sign and forward to Worker
    const timestamp = Date.now().toString();
    const bodyText = ""; // GET requests have empty body for our HMAC logic
    const signature = await generateHmacSignature(timestamp, bodyText, HMAC_SECRET);

    const workerResponse = await fetch(`${WORKER_URL}/api/admin/stats`, {
      method: "GET",
      headers: {
        "x-signature": signature,
        "x-timestamp": timestamp,
      },
    });

    const data = await workerResponse.json();

    if (!workerResponse.ok) {
      return NextResponse.json(data, { status: workerResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
