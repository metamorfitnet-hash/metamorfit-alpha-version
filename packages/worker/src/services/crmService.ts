import { withRetry } from "../utils/retry";

export type EmailPayload = { email: string; fullName: string; tags?: string[] }

/**
 * Applies a specific tag to a Systeme.io contact.
 */
async function applyTag(env: any, contactId: number, tagId: number) {
	return await withRetry(async () => {
		const response = await fetch(`https://api.systeme.io/api/contacts/${contactId}/tags`, {
			method: "POST",
			headers: { 
				"Content-Type": "application/json", 
				"X-API-Key": env.SYSTEME_API_KEY 
			},
			body: JSON.stringify({ tagId })
		});

		if (!response.ok) {
			// If it's a 4xx error (other than 429), it might be a permanent failure (e.g. tag doesn't exist)
			// For 429 or 5xx, we want to retry.
			if (response.status === 429 || response.status >= 500) {
				throw new Error(`Systeme.io Tag API Error: ${response.status}`);
			}
			console.error(`[CRM/Tag] Permanent failure for tag ${tagId}: ${response.status}`);
			return; // Don't throw for other 4xx errors to avoid breaking the whole flow
		}
		
		console.log(`[CRM/Tag] Tag ${tagId} applied successfully to contact ${contactId}`);
	}, 3, 1000);
}

/**
 * Creates or updates a contact in Systeme.io and applies associated tags.
 */
export async function createSystemeContact(env: any, { email, fullName, tags }: EmailPayload) {
	let firstName = "";
	let lastName = "";

	if (fullName && typeof fullName === "string") {
		const parts = fullName.trim().split(" ");
		firstName = parts[0] || "";
		lastName = parts.slice(1).join(" ") || "";
	}

	const finalTags = Array.isArray(tags) && tags.length > 0
		? tags.map(t => Number(t)).filter(n => !isNaN(n))
		: [1979795]; // Default tag if none provided

	const payload = {
		email,
		fields: [
			{ slug: "first_name", value: firstName },
			{ slug: "surname", value: lastName }
		]
	};

	console.log(`[CRM] Attempting to sync contact: ${email}`);

	// 1. Create/Update Contact with Retry
	// A 409 means the contact already exists — this is NOT an error.
	// We resolve their existing ID so we can still apply tags.
	const contactId = await withRetry(async () => {
		const response = await fetch("https://api.systeme.io/api/contacts", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-Key": env.SYSTEME_API_KEY
			},
			body: JSON.stringify(payload)
		});

		if (response.ok) {
			const data = await response.json() as { id: number };
			if (!data.id) throw new Error("Systeme.io response missing contact ID");
			return data.id;
		}

		// Transient errors — let withRetry handle them
		if (response.status === 429 || response.status >= 500) {
			throw new Error(`Systeme.io API Error: ${response.status}`);
		}

		// Contact already exists (409) — look them up by email
		if (response.status === 409) {
			console.log(`[CRM] Contact ${email} already exists. Fetching existing ID...`);
			const lookup = await fetch(
				`https://api.systeme.io/api/contacts?email=${encodeURIComponent(email)}`,
				{ headers: { "X-API-Key": env.SYSTEME_API_KEY } }
			);
			if (lookup.ok) {
				const lookupData = await lookup.json() as { items?: { id: number }[] };
				const existingId = lookupData.items?.[0]?.id;
				if (existingId) {
					console.log(`[CRM] Resolved existing contact ID: ${existingId}`);
					return existingId;
				}
			}
			// Couldn't resolve ID — log and return null to skip tag application
			console.warn(`[CRM] Could not resolve existing contact ID for ${email}. Skipping tags.`);
			return null;
		}

		// Any other 4xx — log and continue without throwing (non-fatal)
		const errorText = await response.text();
		console.error(`[CRM] Non-retryable error: ${response.status} - ${errorText}`);
		return null;
	}, 3, 1000);

	if (contactId === null) {
		console.warn(`[CRM] Skipping tag application — no contact ID available for ${email}.`);
		return;
	}

	console.log(`[CRM] Contact synced successfully. ID: ${contactId}. Applying ${finalTags.length} tags...`);

	// 2. Apply Tags in Parallel with individual retries
	const tagResults = await Promise.allSettled(
		finalTags.map(tagId => applyTag(env, contactId, tagId))
	);

	const failures = tagResults.filter(r => r.status === "rejected");
	if (failures.length > 0) {
		console.error(`[CRM] ${failures.length} tags failed to apply after retries.`);
		// We don't necessarily want to fail the whole background job if some tags failed, 
		// but we should log it.
	} else {
		console.log(`[CRM] All tags applied successfully.`);
	}
}
