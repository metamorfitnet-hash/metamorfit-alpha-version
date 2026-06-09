import type { NextConfig } from "next";

const ALPHA_WORKER_URL = "https://metamorfit-worker-alpha.metamorfitnet.workers.dev";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_WORKER_URL: ALPHA_WORKER_URL,
    WORKER_URL: ALPHA_WORKER_URL,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/onboarding-v2',
        permanent: false,
      },
    ];
  },
  // ── Phase 5.1: Production Security Headers ───────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all pages and routes
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing attacks
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevent clickjacking via iframe embedding
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Control referrer information sent with requests
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Restrict browser feature access
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Enforce HTTPS for 2 years (only active on HTTPS — safe for Vercel)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Stricter headers for all API routes — no caching, no indexing
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex",
          },
          // Tight CSP for the API surface — only JSON responses, no scripts
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },

  // ── Phase 5.1 + 5.2: API Rewrites ───────────────────────────────────────────
  // /worker/:path* → Cloudflare Worker (keeps WORKER_URL server-side, never
  //   exposed to the browser). Use this for any direct Worker calls that don't
  //   need HMAC signing (e.g. health checks, public status reads).
  //
  // /api/status/:jobId → Worker's KV-backed job status endpoint (GET, no auth)
  // /api/download/:jobId → Worker's R2 PDF download endpoint (GET, no auth)
  async rewrites() {
    const WORKER_URL = process.env.WORKER_URL || ALPHA_WORKER_URL;
    return [
      // Generic catch-all proxy for any Worker path
      // Example: /worker/api/status/abc → ${WORKER_URL}/api/status/abc
      {
        source: "/worker/:path*",
        destination: `${WORKER_URL}/:path*`,
      },
      // Convenience alias: /api/status/:jobId → Worker status without HMAC
      {
        source: "/api/status/:jobId",
        destination: `${WORKER_URL}/api/status/:jobId`,
      },
      // Convenience alias: /api/download/:jobId → R2 PDF stream
      {
        source: "/api/download/:jobId",
        destination: `${WORKER_URL}/api/download/:jobId`,
      },
      // Generate (handled by proxy rewrite for now as no physical route exists)
      {
        source: "/api/generate",
        destination: `${WORKER_URL}/api/generate`,
      },
    ];
  },
};

export default nextConfig;
