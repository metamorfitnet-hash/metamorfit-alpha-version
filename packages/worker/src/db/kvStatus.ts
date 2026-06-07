export async function initializeJobStatus(env: any, jobId: string, userData: any) {
	if (env.JOB_STATUS) {
		await env.JOB_STATUS.put(`job:${jobId}`, JSON.stringify({
			jobId,
			status: "pending",
			userData: {
				email: userData.email || "",
				name: userData.fullName || userData.name || "",
				bodyStats: userData.identity || userData.bodyStats || {}
			},
			results: {
				macros: null,
				aiInsight: null
			},
			delivery: {
				r2Key: null,
				downloadUrl: null
			},
			errors: [],
			createdAt: Date.now()
		}), { expirationTtl: 86400 });
	}
}

export async function setJobDownloadUrl(env: any, jobId: string, r2Key: string) {
	if (!env.JOB_STATUS) return;
	try {
		const existingStr = await env.JOB_STATUS.get(`job:${jobId}`);
		const existing = existingStr ? JSON.parse(existingStr) : {};
		// Store the worker-relative URL that the frontend can poll and use
		const downloadUrl = `/api/download/${jobId}`;
		await env.JOB_STATUS.put(`job:${jobId}`, JSON.stringify({ 
			...existing, 
			delivery: {
				...existing.delivery,
				r2Key,
				downloadUrl
			}
		}), { expirationTtl: 86400 });
	} catch (e) {
		console.error("Failed to set download URL on job status", e);
	}
}

export async function updateJobStatus(env: any, jobId: string, updates: any) {
	if (!env.JOB_STATUS) return;
	try {
		const existingStr = await env.JOB_STATUS.get(`job:${jobId}`);
		const existing = existingStr ? JSON.parse(existingStr) : {};
		
		// Deep merge for specific objects if needed, but for now we'll do top-level or structured merge
		const merged = { ...existing };
		if (updates.status) merged.status = updates.status;
		if (updates.results) merged.results = { ...merged.results, ...updates.results };
		if (updates.delivery) merged.delivery = { ...merged.delivery, ...updates.delivery };
		if (updates.error) {
			merged.errors = merged.errors || [];
			merged.errors.push(updates.error);
		}
		// Allow flat updates to migrate seamlessly
		if (updates.stage) merged.stage = updates.stage;
		
		await env.JOB_STATUS.put(`job:${jobId}`, JSON.stringify(merged), { expirationTtl: 86400 });
	} catch (e) {
		console.error("Failed to update job status", e);
	}
}

export async function getJobStatus(env: any, jobId: string) {
	if (!env.JOB_STATUS) return null;
	return await env.JOB_STATUS.get(`job:${jobId}`);
}
