"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestPipelinePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: "test@metamorfit.pro",
          fullName: "Test User",
          age: 30,
          weight: 80,
          height: 180,
          gender: "male",
          activityLevel: "active",
          goal: "fat_loss"
        })
      });

      if (response.ok) {
        // Assume success, go to dashboard
        router.push('/dashboard');
      } else {
        alert("Failed to generate plan");
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Metamorfit Pipeline Debug</h1>
      <form onSubmit={handleGenerate} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Generating Pipeline..." : "Trigger Local E2E Flow"}
        </button>
      </form>
    </div>
  );
}
