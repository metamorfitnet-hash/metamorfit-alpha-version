import { Buffer } from "node:buffer";
import { withRetry } from "./utils/retry";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${env.MM_WORKER_SECRET}`) {
      return new Response("Unauthorized Internal Handshake", { status: 401 });
    }

    const { userId, results } = await request.json();

    try {
      // 1. Daily Cap Check
      const today = new Date().toISOString().split('T')[0];
      const capKey = `email_count:${today}`;
      const DAILY_LIMIT = 250;
      
      const currentCount = parseInt(await env.MM_LEDGER.get(capKey) || "0");
      if (currentCount >= DAILY_LIMIT) {
        const entry = JSON.parse(await env.MM_LEDGER.get(userId));
        entry.status = "cap_reached";
        await env.MM_LEDGER.put(userId, JSON.stringify(entry));
        return new Response("Cap Reached", { status: 200 });
      }

      // 2. Generate PDF via Gotenberg
      const htmlContent = `
        <html>
          <body style="font-family: sans-serif; background: #121212; color: white; padding: 40px;">
            <h1 style="color: #D4AF37;">Metabolic Blueprint</h1>
            <p>User ID: ${userId}</p>
            <h2>Daily Target: ${Math.round(results.results?.metrics?.targetCalories || results.data?.tdee?.target_kcal || results.data?.calories || 2000)} kcal</h2>
            
            <div style="margin-top: 20px;">
              <h3 style="color: #D4AF37;">Metabolic Strategy</h3>
              ${(results.results?.aiInsight || results.data?.meal_plan_logic || "Adherence to these targets will drive physiological adaptations.")
                  .split('\n\n')
                  .map((p: string) => `<p style="margin-bottom: 12px; line-height: 1.6;">${p}</p>`)
                  .join('')}
            </div>

            <div style="margin-top: 20px;">
              <h3 style="color: #D4AF37;">Personalization Notes</h3>
              ${(results.personalizationCards?.map((c:any) => c.description) || results.data?.personalization_notes || [])
                  .map((note: string) => `
                <div style="border: 1px solid rgba(255,255,255,0.1); padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                  <p style="margin: 0; font-size: 12px; opacity: 0.8;">${note}</p>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `;

      const formData = new FormData();
      const htmlFile = new File([htmlContent], "index.html", { type: "text/html" });
      formData.append("files", htmlFile);

      const gotenbergHeaders: Record<string, string> = {};
      if (env.GOTENBERG_SECRET) {
        gotenbergHeaders["Authorization"] = `Basic ${btoa(`gotenberg:${env.GOTENBERG_SECRET}`)}`;
      }

      const startTime = Date.now();
      const gotenbergRes = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          const res = await fetch(`${env.GOTENBERG_URL}/forms/chromium/convert/html`, {
            method: "POST",
            headers: gotenbergHeaders,
            body: formData,
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Gotenberg failed (${res.status}): ${errBody}`);
          }
          return res;
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      }, 3, 4000);
      
      const duration = (Date.now() - startTime) / 1000;
      if (duration > 8) console.warn(`[LATENCY] Gotenberg: ${duration}s`);

      const pdfBlob = await gotenbergRes.blob();
      const pdfArrayBuffer = await pdfBlob.arrayBuffer();

      // 3. Save to R2 Storage and generate permanent URL
      let pdfUrl = null;
      if (env.PDF_STORAGE) {
        await env.PDF_STORAGE.put(userId, pdfArrayBuffer, {
          httpMetadata: { contentType: "application/pdf" }
        });
        pdfUrl = `https://metamorfit-worker-alpha.metamorfitnet.workers.dev/api/download/${userId}`;
      }

      // 4. Email Delivery via Brevo
      const emailAddress = results.data.email || results.data.emailAddress;
      if (emailAddress) {
        if (!env.BREVO_API_KEY) {
          throw new Error("BREVO_API_KEY is not defined in the environment.");
        }

        const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": env.BREVO_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sender: { 
              name: "Metamorfit Alpha", 
              email: env.BREVO_SENDER_EMAIL || "contact@metamorfit.pro" 
            },
            to: [{ email: emailAddress }],
            subject: "Your Metabolic Blueprint is Ready",
            textContent: `Your personalized metabolic blueprint is attached.\n\nYou can also download it here: ${pdfUrl || "Not available"}`,
            attachment: [{
              content: Buffer.from(pdfArrayBuffer).toString("base64"),
              name: "Metabolic_Blueprint.pdf"
            }]
          })
        });
        
        if (!emailRes.ok) {
          const errorText = await emailRes.text();
          throw new Error(`Brevo API failed (${emailRes.status}): ${errorText}`);
        }
      }

      // 5. Final Success Update
      const entry = JSON.parse(await env.MM_LEDGER.get(userId));
      entry.status = "delivered";
      entry.emailSentAt = new Date().toISOString();
      if (pdfUrl) {
        entry.results = entry.results || {};
        entry.results.pdfUrl = pdfUrl;
      }
      await env.MM_LEDGER.put(userId, JSON.stringify(entry));
      await env.MM_LEDGER.put(capKey, (currentCount + 1).toString());

      return new Response("OK", { status: 200 });
    } catch (err: any) {
      return new Response(err.message, { status: 500 });
    }
  }
};
