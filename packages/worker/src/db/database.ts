export async function insertUserPlan(env: any, id: string, email: string, jobId: string) {
	if (env.METAMORFIT_DB) {
		try {
			await env.METAMORFIT_DB.prepare(
				"INSERT INTO user_plans (id, user_email, job_id, status, created_at) VALUES (?, ?, ?, ?, ?)"
			).bind(id, email, jobId, "pending", Date.now()).run();
		} catch (e) {
			console.error("[Worker] D1 Insert Failed:", e);
		}
	}
}

export async function updateUserPlanStatus(env: any, jobId: string, status: string, pdfUrl?: string) {
	if (env.METAMORFIT_DB) {
		try {
			if (pdfUrl) {
				await env.METAMORFIT_DB.prepare("UPDATE user_plans SET status = ?, pdf_url = ? WHERE job_id = ?")
					.bind(status, pdfUrl, jobId).run();
			} else {
				await env.METAMORFIT_DB.prepare("UPDATE user_plans SET status = ? WHERE job_id = ?")
					.bind(status, jobId).run();
			}
		} catch (e) {
			console.error("[Worker] D1 Update Failed:", e);
		}
	}
}

export async function updateUserPlanMetrics(env: any, jobId: string, aiLatencyMs: number) {
	if (env.METAMORFIT_DB) {
		try {
			await env.METAMORFIT_DB.prepare("UPDATE user_plans SET ai_latency_ms = ? WHERE job_id = ?")
				.bind(aiLatencyMs, jobId).run();
		} catch (e) {
			console.error("[Worker] D1 Metrics Update Failed:", e);
		}
	}
}

export async function updateUserPlanError(env: any, jobId: string, errorMessage: string, errorCode: string = 'UNKNOWN_ERR') {
	if (env.METAMORFIT_DB) {
		try {
			await env.METAMORFIT_DB.prepare("UPDATE user_plans SET status = 'failed', error_message = ?, error_code = ? WHERE job_id = ?")
				.bind(errorMessage, errorCode, jobId).run();
		} catch (e) {
			console.error("[Worker] D1 Error Log Failed:", e);
		}
	}
}
