import * as Sentry from '@sentry/cloudflare';

/**
 * Initializes Sentry for the Cloudflare Worker environment.
 * Returns a wrapped version of the handler object with automatic
 * error capture, performance tracing, and request context.
 *
 * Usage: export default withSentry(env => sentryConfig(env), handler)
 */
export function getSentryConfig(env: any): Sentry.CloudflareOptions {
	return {
		dsn: env.SENTRY_DSN || '',
		environment: 'beta',
		release: 'metamorfit-worker-beta@1.0.0',
		// Sample 100% of errors; reduce tracesSampleRate in production
		tracesSampleRate: 1.0,
		// Only initialize if DSN is set — allows graceful degradation without Sentry
		enabled: !!env.SENTRY_DSN,
	};
}

/**
 * Captures an exception to Sentry with contextual tags for D1 cross-referencing.
 * Call this inside catch blocks in background tasks where Sentry's auto-capture
 * cannot reach (ctx.waitUntil is outside the main request scope).
 */
export function captureWorkerException(
	error: Error | unknown,
	tags: { jobId?: string; userEmail?: string; stage?: string },
	extra?: Record<string, unknown>
) {
	Sentry.withScope((scope) => {
		// Tags are indexed and searchable in Sentry — perfect for D1 cross-referencing
		if (tags.jobId) scope.setTag('job_id', tags.jobId);
		if (tags.userEmail) scope.setTag('user_email', tags.userEmail);
		if (tags.stage) scope.setTag('pipeline_stage', tags.stage);

		// Extra context for debugging (not indexed)
		if (extra) scope.setExtras(extra);

		Sentry.captureException(error);
	});
}
