// ============================================================
// R2 Storage Service — PDF Persistence Layer
// Handles upload and retrieval of generated PDFs from Cloudflare R2
// ============================================================

const PDF_KEY_PREFIX = "pdfs/";

/**
 * Uploads a PDF stream to R2 and returns the storage key.
 * Key format: pdfs/{jobId}.pdf
 */
export async function uploadPdfToR2(env: any, jobId: string, pdfStream: ReadableStream): Promise<string | null> {
	if (!env.PDF_STORAGE) {
		console.warn("[R2] PDF_STORAGE bucket not bound — skipping R2 upload.");
		return null;
	}

	const key = `${PDF_KEY_PREFIX}${jobId}.pdf`;

	try {
		await env.PDF_STORAGE.put(key, pdfStream, {
			httpMetadata: {
				contentType: "application/pdf",
			},
			customMetadata: {
				jobId,
				uploadedAt: new Date().toISOString(),
			},
		});

		console.log(`[R2] PDF uploaded successfully: ${key}`);
		return key;
	} catch (e: any) {
		console.error("[R2] Upload failed:", e.message);
		return null;
	}
}

/**
 * Retrieves a PDF from R2 by jobId.
 * Returns the R2 object or null if not found.
 */
export async function getPdfFromR2(env: any, jobId: string): Promise<R2ObjectBody | null> {
	if (!env.PDF_STORAGE) {
		console.warn("[R2] PDF_STORAGE bucket not bound.");
		return null;
	}

	try {
		// Try prefixed key first (old pipeline: pdfs/{jobId}.pdf)
		const prefixedKey = `${PDF_KEY_PREFIX}${jobId}.pdf`;
		const prefixed = await env.PDF_STORAGE.get(prefixedKey);
		if (prefixed) return prefixed;

		// Fallback to bare userId key (new orchestrator pipeline)
		const bare = await env.PDF_STORAGE.get(jobId);
		if (bare) return bare;

		console.warn(`[R2] PDF not found for jobId=${jobId} (tried prefixed and bare keys)`);
		return null;
	} catch (e: any) {
		console.error("[R2] Retrieval failed:", e.message);
		return null;
	}
}

/**
 * Checks if a PDF exists for a given jobId.
 */
export async function pdfExistsInR2(env: any, jobId: string): Promise<boolean> {
	if (!env.PDF_STORAGE) return false;
	const key = `${PDF_KEY_PREFIX}${jobId}.pdf`;

	try {
		const head = await env.PDF_STORAGE.head(key);
		return head !== null;
	} catch {
		return false;
	}
}
