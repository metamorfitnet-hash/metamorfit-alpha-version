import { renderEmail } from '../PersonalizedPlanEmail';
import { withRetry } from '../utils/retry';

export async function sendPlanEmail(env: any, email: string, fullName: string, downloadUrl: string, jobId: string) {
	const firstName = (fullName || "").split(" ")[0] || fullName;
	const htmlContent = await renderEmail(fullName, downloadUrl);

	return await withRetry(async () => {
		const response = await fetch("https://api.brevo.com/v3/smtp/email", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"api-key": env.BREVO_API_KEY
			},
			body: JSON.stringify({
				sender: { email: "contact@metamorfit.pro", name: "Metamorfit" },
				to: [{ email: email, ...(fullName ? { name: fullName } : {}) }],
				subject: `[Metamorfit Alpha Engine Output] Your Personalized Plan — ${firstName}`,
				htmlContent: htmlContent
			})
		});

		if (!response.ok) {
			const errorData = await response.text();
			throw new Error(`Brevo Error: ${response.status} - ${errorData}`);
		}
		
		return await response.json();
	}, 3, 1000);
}
