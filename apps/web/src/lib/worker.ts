/**
 * Calls the Next.js /api/send-pdf Edge route (which internally signs and
 * forwards to the Cloudflare Worker). This removes the need for the browser
 * to know the WORKER_URL or HMAC_SECRET.
 *
 * Returns the jobId for status polling.
 */
export async function callWorkerForPdf(payload: any): Promise<string> {
  const response = await fetch('/api/send-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  if (!data.jobId) {
    throw new Error('Worker did not return a jobId');
  }

  return data.jobId;
}

/**
 * Polls the job status via the Next.js rewrite → Cloudflare Worker.
 * Returns the full status object.
 */
export async function pollJobStatus(jobId: string): Promise<{
  status: string;
  stage?: string;
  downloadUrl?: string;
  error?: string;
  completedAt?: number;
}> {
  const response = await fetch(`/api/status/${jobId}`);
  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`);
  }
  return response.json();
}
