/**
 * Robust retry wrapper with exponential backoff and jitter.
 */
export async function withRetry<T>(
	fn: () => Promise<T>, 
	maxAttempts: number = 3,
	baseDelayMs: number = 1000
): Promise<T> {
	let lastError: any;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (err: any) {
			lastError = err;
			
			if (attempt === maxAttempts) {
				console.error(`[Retry] Max attempts (${maxAttempts}) reached. Final error:`, err.message);
				throw err;
			}

			// Exponential backoff: baseDelay * 2^(attempt-1)
			// e.g. 1s, 2s, 4s for baseDelay=1000
			const backoff = baseDelayMs * Math.pow(2, attempt - 1);
			
			// Add jitter (randomness) to avoid thundering herd problem
			const jitter = Math.random() * 200; 
			const sleepTime = backoff + jitter;

			console.warn(`[Retry] Attempt ${attempt} failed: ${err.message}. Retrying in ${Math.round(sleepTime)}ms...`);
			
			await new Promise(r => setTimeout(r, sleepTime));
		}
	}
	
	throw lastError || new Error('Max retries exceeded');
}
