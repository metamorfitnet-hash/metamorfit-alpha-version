import { NextRequest, NextResponse } from "next/server";
import { generateHmacSignature } from "@/lib/cryptoUtils";

export const runtime = "edge";

const WORKER_URL = process.env.WORKER_URL || "";
const HMAC_SECRET = process.env.HMAC_SECRET || "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const timestamp = Date.now().toString();
    const bodyText = ""; 
    const signature = await generateHmacSignature(timestamp, bodyText, HMAC_SECRET);

    const workerResponse = await fetch(`${WORKER_URL}/api/user/plans?userId=${userId}`, {
      method: "GET",
      headers: {
        "x-signature": signature,
        "x-timestamp": timestamp,
      },
    });

    const data = await workerResponse.json();
    return NextResponse.json(data, { status: workerResponse.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
