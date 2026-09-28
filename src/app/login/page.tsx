'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getDashboardPath } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getUserById } from '@/lib/db';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email.trim(), password);
    if (success) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await getUserById(session.user.id);
          if (profile) {
            router.replace(getDashboardPath(profile.role));
            return;
          }
        }
      } catch {
        // fallback
      }
      router.replace('/dashboard');
    } else {
      setError('Email atau kata sandi tidak valid. Hubungi pihak sekolah jika kendala berlanjut.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center px-4 py-10">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#0051d5]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#0c9488]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col gap-6">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#131b2e] flex items-center justify-center shadow-lg shadow-[#131b2e]/20">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#191c1e] tracking-tight">SMP Global Madani</h1>
            <p className="text-sm text-[#45464d] mt-0.5">Portal Pendampingan Guru Wali</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dbe1ff] text-[#003ea8] text-xs font-semibold">
            <span className="material-symbols-outlined text-[12px]">verified</span>
            TA 2026/2027 • Semester Ganjil
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.05)] p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#191c1e]">Masuk ke Portal</h2>
            <p className="text-xs text-[#45464d] mt-0.5">Gunakan akun yang diberikan oleh sekolah</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#45464d]" htmlFor="email">
                Email Institusi / Terdaftar
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px]">
                  alternate_email
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@globalsmpmadani.sch.id"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#c6c6cd] bg-white text-sm text-[#191c1e] placeholder:text-[#76777d]/60 focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 transition-all"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#45464d]" htmlFor="password">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px]">
                  lock
                </span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Kata sandi"
                  className="w-full h-11 pl-10 pr-10 rounded-lg border border-[#c6c6cd] bg-white text-sm text-[#191c1e] placeholder:text-[#76777d]/60 focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#191c1e] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] rounded-lg px-3 py-2.5 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-[#131b2e] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1e293b] active:scale-[0.98] transition-all disabled:opacity-60 shadow-sm mt-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Masuk ke Portal
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-white/80 border border-[#e0e3e5] rounded-xl p-3 text-center">
          <p className="text-xs text-[#45464d] leading-relaxed">
            Belum memiliki akses atau lupa kata sandi? Silakan hubungi <strong>Admin Sekolah / Kesiswaan</strong>.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#76777d]">
          © 2026 SMP Global Madani. Data siswa dilindungi & dienkripsi.
        </p>
      </div>

      {/* Material Icons */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
    </div>
  );
}
