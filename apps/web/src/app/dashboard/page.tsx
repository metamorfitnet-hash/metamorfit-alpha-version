"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function getSession() {
      // Mock session for testing
      const mockUser = { id: 'test-user-123', email: 'test@metamorfit.pro' };
      setUser(mockUser);
      fetchPlans(mockUser.id);
    }
    getSession();
  }, [router]);

  const fetchPlans = async (userId: string) => {
    try {
      // Fetch via our secure proxy (already handles HMAC)
      // Wait, I need a proxy for this too!
      const res = await fetch(`/api/user/plans?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-indigo-600">Loading your plans...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-2">My Metabolic Plans</h1>
          <p className="text-gray-500">Welcome back, {user?.email}</p>
        </header>

        {plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.job_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${plan.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {plan.status}
                    </span>
                    <span className="text-gray-400 text-xs">{new Date(plan.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Metabolic Blueprint</h3>
                  <p className="text-gray-500 text-sm mb-6">Unique ID: {plan.job_id.slice(0, 8)}...</p>
                </div>

                {plan.status === 'complete' ? (
                  <a 
                    href={`/api/download/${plan.job_id}`}
                    target="_blank"
                    className="w-full py-3 bg-indigo-600 text-white text-center rounded-xl font-bold hover:bg-indigo-700 transition-all"
                  >
                    Download PDF
                  </a>
                ) : (
                  <button disabled className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl font-bold cursor-not-allowed">
                    Processing...
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl shadow-sm border-2 border-dashed border-gray-200 text-center">
            <div className="text-5xl mb-4">🧬</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No plans found</h2>
            <p className="text-gray-500 mb-8 text-sm">Once you generate your first metabolic blueprint, it will appear here.</p>
            <button onClick={() => router.push('/')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
              Generate Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
