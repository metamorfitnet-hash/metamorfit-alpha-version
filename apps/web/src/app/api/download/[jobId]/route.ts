import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    // Proxy the request to the Cloudflare Worker which holds the R2 binding
    const workerUrl = process.env.WORKER_URL;
    
    const response = await fetch(`${workerUrl}/api/download/${jobId}`, {
      method: 'GET',
      headers: {
        // Pass any necessary headers here if needed
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch PDF from storage' }, { status: response.status });
    }

    // Stream the PDF response to the client
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', 'attachment; filename="Metamorfit_Plan.pdf"');

    return new NextResponse(response.body, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error('Proxy Error fetching PDF:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
