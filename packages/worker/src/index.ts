import * as Sentry from "@sentry/cloudflare";
import { handleHealth } from "./routes/health";
import { handleStats } from "./routes/stats";
import { handleSync } from "./routes/sync";
import { handleGallery } from "./routes/gallery";
import { handleSendPdf } from "./routes/sendPdf";
import { handleStatus } from "./routes/status";
import { handleDownload } from "./routes/download";
import { handleEstimate } from "./routes/estimate";
import { handleWebhook } from "./routes/webhook";
import { handleGenerate } from "./routes/generate";
import { handleLedger } from "./routes/ledger";

export interface Env {
	METAMORFIT_DB: D1Database;
	JOB_STATUS: KVNamespace;
	MEAL_CACHE: KVNamespace;
	PDF_STORAGE: R2Bucket;
	AI: any;
	MACRO_ENGINE: Fetcher;
	HMAC_SECRET: string;
	BREVO_API_KEY: string;
	SYSTEME_API_KEY: string;
	SUPABASE_URL?: string;
	SUPABASE_KEY?: string;
	MM_LEDGER: KVNamespace;
	MM_UI_SECRET: string;
	MM_WORKER_SECRET: string;
}

export interface LedgerEntry {
	userId: string;
	status: 'in_progress' | 'complete' | 'delivered' | 'cap_reached';
	currentStep: number;
	data: Record<string, any>;
	personalizationCards: any[];
	createdAt: string;
	updatedAt: string;
	results?: any;
}

const corsHeaders = {
	"Access-Control-Allow-Origin": "https://metamorfit.online",
	"Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization, x-signature, x-timestamp",
	"Access-Control-Max-Age": "86400",
};

export default Sentry.withSentry(
	(env: Env) => ({
		dsn: (env as any).SENTRY_DSN,
		tracesSampleRate: 1.0,
	}),
	{
		async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
			const allowedOrigins = ['https://metamorfit.online', 'https://www.metamorfit.online', 'http://localhost:3000'];
			const origin = request.headers.get('Origin');
			const isVercelPreview = origin && origin.endsWith('.vercel.app');
			const corsOrigin = (origin && (allowedOrigins.includes(origin) || isVercelPreview)) ? origin : 'https://metamorfit.online';

			const corsHeaders = {
				"Access-Control-Allow-Origin": corsOrigin,
				"Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization, x-signature, x-timestamp",
				"Access-Control-Max-Age": "86400",
			};

			if (request.method === "OPTIONS") {
				return new Response(null, { 
					status: 200,
					headers: corsHeaders 
				});
			}

			const url = new URL(request.url);
			const pathname = url.pathname.replace(/\/$/, '') || '/';

			try {
				let response: Response;

				// ── 1. INFRASTRUCTURE & ADMIN ───────────────────────────────────────────
				if (pathname === '/api/debug/health') response = await handleHealth(request, env, corsHeaders);
				else if (pathname === '/api/admin/stats') response = await handleStats(request, env, corsHeaders);

				// ── 2. IDENTITY & SYNC ──────────────────────────────────────────────────
				else if (pathname === '/api/user/plans') response = await handleGallery(request, env, url, corsHeaders);
				else if (pathname.startsWith('/api/ledger')) response = await handleLedger(request, env, ctx, corsHeaders);

				// ── 3. CORE PDF PIPELINE ────────────────────────────────────────────────
				else if (pathname === "/api/generate" || pathname === "/generate") {
					response = await handleGenerate(request, env, ctx, corsHeaders);
				}
				else if (pathname === "/api/send-pdf" || pathname === "/pdf" || pathname === "/lead") {
					response = await handleSendPdf(request, env, ctx, corsHeaders);
				}
				else if (pathname.startsWith("/api/status/")) response = await handleStatus(request, env, url, corsHeaders);
				else if (pathname.startsWith("/api/download/")) response = await handleDownload(request, env, url, corsHeaders);

				// ── 4. UTILITIES ────────────────────────────────────────────────────────
				else if (pathname === "/api/estimate-macros" || pathname === "/api/estimate" || pathname === "/api/calculate") {
					response = await handleEstimate(request, env, corsHeaders);
				}
				else if (pathname === "/api/webhooks/mailer") response = await handleWebhook(request, env, corsHeaders);
				else {
					response = new Response(JSON.stringify({ error: "Not Found", path: pathname }), { status: 404, headers: corsHeaders });
				}

				// Ensure CORS headers are present on every response
				const newHeaders = new Headers(response.headers);
				Object.entries(corsHeaders).forEach(([key, value]) => {
					newHeaders.set(key, value);
				});

				return new Response(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers: newHeaders
				});

			} catch (err: any) {
				console.error(`[Global Error] ${pathname}:`, err.message);
				Sentry.captureException(err);
				
				const errorHeaders = new Headers(corsHeaders);
				errorHeaders.set("Content-Type", "application/json");

				return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), { 
					status: 500, 
					headers: errorHeaders 
				});
			}
		},
	}
);
