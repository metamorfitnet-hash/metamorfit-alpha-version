/**
 * Edge-compatible HMAC request signing utility.
 * Uses Web Crypto API exclusively — no Node.js crypto module.
 * Safe for Vercel Edge Runtime, Cloudflare Workers, and browsers.
 */
export async function generateHmacSignature(
  timestamp: string,
  bodyText: string,
  secret: string
): Promise<string> {
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

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
