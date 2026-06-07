export async function register() {
  // Temporarily disabled to resolve prerendering issues during build with React 19
  /*
  if (process.env.NODE_ENV !== "production") {
    console.log("Skipping Sentry instrumentation in non-production mode.");
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
  */
}
