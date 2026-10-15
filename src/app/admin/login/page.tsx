'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { apiInstance } from '@/src/lib/axios';
import { validateSecurity, isValidEmail } from '@/src/utils/validation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Cek jika sudah login, lempar ke dashboard
  useEffect(() => {
    if (localStorage.getItem('admin_token')) {
      router.push('/admin');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Keamanan XSS & SQLi
    if (!isValidEmail(email)) {
      setError("Format email tidak valid.");
      return;
    }
    if (!validateSecurity(password) || !validateSecurity(email)) {
      setError("Kredensial mengandung karakter yang tidak diizinkan.");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiInstance.post('/api/admin/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('admin_token', response.data.token);
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login gagal. Periksa kembali kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">
            TWENTYONE<span className="text-brand-accent">.</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest font-bold">Admin Workspace</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-zinc-200/60 shadow-xs">
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-900 tracking-wider uppercase mb-2">Email Admin</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition text-sm"
                  placeholder="emailkamu@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-900 tracking-wider uppercase mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] mt-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
