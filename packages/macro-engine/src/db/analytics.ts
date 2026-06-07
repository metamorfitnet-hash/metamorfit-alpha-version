export async function getAdminStats(env: any) {
  if (!env.METAMORFIT_DB) throw new Error("D1 Database not found");

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. Total Plans
  const totalRes = await env.METAMORFIT_DB.prepare(
    "SELECT COUNT(*) as total FROM user_plans"
  ).first();

  // 2. Daily Growth (Last 24h vs Prev 24h)
  const last24h = await env.METAMORFIT_DB.prepare(
    "SELECT COUNT(*) as count FROM user_plans WHERE created_at > ?"
  ).bind(now - dayMs).first();

  const prev24h = await env.METAMORFIT_DB.prepare(
    "SELECT COUNT(*) as count FROM user_plans WHERE created_at <= ? AND created_at > ?"
  ).bind(now - dayMs, now - (2 * dayMs)).first();

  // 3. Health Score (Success Rate)
  const healthRes = await env.METAMORFIT_DB.prepare(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
     FROM user_plans`
  ).first();

  // 4. Performance (Avg Latency)
  const perfRes = await env.METAMORFIT_DB.prepare(
    "SELECT AVG(ai_latency_ms) as avg_latency FROM user_plans WHERE ai_latency_ms IS NOT NULL"
  ).first();

  // 5. Recent Errors (Last 5 unique)
  const errors = await env.METAMORFIT_DB.prepare(
    "SELECT DISTINCT error_message, created_at FROM user_plans WHERE status = 'failed' AND error_message IS NOT NULL ORDER BY created_at DESC LIMIT 5"
  ).all();

  return {
    totalPlans: totalRes.total || 0,
    dailyGrowth: {
      current: last24h.count || 0,
      previous: prev24h.count || 0,
      percentage: prev24h.count > 0 ? ((last24h.count - prev24h.count) / prev24h.count) * 100 : 0
    },
    health: {
      total: healthRes.total || 0,
      success: healthRes.success || 0,
      failed: healthRes.failed || 0,
      rate: healthRes.total > 0 ? (healthRes.success / healthRes.total) * 100 : 100
    },
    performance: {
      avgLatencyMs: Math.round(perfRes.avg_latency || 0)
    },
    recentErrors: errors.results || []
  };
}
