import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { generateHmacSignature } from '@/lib/cryptoUtils';

export const runtime = 'edge';

/**
 * Phase 3.3: Link Existing Plans to Authenticated User
 * This route is called after a user signs in. It finds all plans
 * associated with their email in D1 and updates them with their 
 * Supabase Auth ID.
 */
export async function POST(req: Request) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  if (!userEmail) {
    return NextResponse.json({ error: 'User email not found' }, { status: 400 });
  }

  // Forward the sync request to the Cloudflare Worker
  const WORKER_URL = process.env.WORKER_URL;
  const HMAC_SECRET = process.env.HMAC_SECRET;

  const timestamp = Date.now().toString();
  const body = JSON.stringify({ userId, userEmail });
  
  // Reuse our secure signing logic
  const signature = await generateHmacSignature(timestamp, body, HMAC_SECRET || '');

  const workerRes = await fetch(`${WORKER_URL}/api/auth/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
      'x-timestamp': timestamp,
    },
    body,
  });

  if (!workerRes.ok) {
    const errorData = await workerRes.json();
    return NextResponse.json(errorData, { status: workerRes.status });
  }

  return NextResponse.json({ success: true, message: 'Identity synced successfully' });
}
