"use client";

import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this should be a proper auth session. 
    // For the beta, we'll use a simple client-side gate with a secret env var.
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthorized(true);
      fetchStats();
    } else {
      setError('Invalid admin password');
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Call our internal secure proxy instead of the worker directly.
      // This prevents HMAC_SECRET from leaking to the browser bundle.
      const res = await fetch('/api/admin/stats');

      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Admin Login</h1>
          <form onSubmit={checkPassword} className="space-y-4">
            <input 
              type="password" 
              placeholder="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
              Unlock Dashboard
            </button>
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-indigo-600">Loading Analytics...</div>;

  const isHealthy = stats?.health?.rate >= 90;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Metamorfit Beta Analytics</h1>
            <p className="text-gray-500">Real-time system performance and user growth</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${isHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <span className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            System Health: {isHealthy ? 'Operational' : 'Critical - Check Logs'}
          </div>
        </header>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Plans" value={stats?.totalPlans} sub={`+${stats?.dailyGrowth?.current} last 24h`} color="indigo" />
          <StatCard title="Success Rate" value={`${Math.round(stats?.health?.rate)}%`} sub={`${stats?.health?.failed} failures detected`} color={isHealthy ? 'green' : 'red'} />
          <StatCard title="Avg Latency" value={`${stats?.performance?.avgLatencyMs}ms`} sub="AI Generation Time" color="blue" />
          <StatCard title="Growth" value={`${Math.round(stats?.dailyGrowth?.percentage)}%` } sub="Compared to prev 24h" color="purple" />
        </div>

        {/* Error Logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Recent Critical Failures</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Error Message</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.recentErrors?.length > 0 ? stats.recentErrors.map((err: any, i: number) => (
                  <tr key={i} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-red-600 font-medium">{err.error_message}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 text-right">{new Date(err.created_at).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-400">No recent errors detected. Systems optimal.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button onClick={fetchStats} className="mt-8 text-sm text-indigo-600 font-bold hover:underline">Refresh Analytics</button>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, color }: any) {
  const colorMap: any = {
    indigo: 'border-indigo-600 text-indigo-600',
    green: 'border-green-600 text-green-600',
    red: 'border-red-600 text-red-600',
    blue: 'border-blue-600 text-blue-600',
    purple: 'border-purple-600 text-purple-600',
  };

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 ${colorMap[color] || 'border-gray-200'}`}>
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="text-3xl font-black text-gray-900 mb-1">{value}</div>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}
