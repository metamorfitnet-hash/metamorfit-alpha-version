export async function verifyHmacSignature(
	signature: string,
	timestamp: string,
	bodyText: string,
	secret: string
): Promise<boolean> {
	if (!signature || !timestamp || !secret) return false;

	const now = Date.now();
	const reqTime = parseInt(timestamp, 10);
	
	// Ensure timestamp is within the last 5 minutes (300,000 ms)
	if (isNaN(reqTime) || Math.abs(now - reqTime) > 300000) {
		return false;
	}

	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);

	const message = `${timestamp}.${bodyText}`;
	const signatureBuffer = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(message)
	);

	const signatureArray = Array.from(new Uint8Array(signatureBuffer));
	const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return signature === expectedSignature;
}
