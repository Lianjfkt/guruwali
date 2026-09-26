'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getDashboardPath } from '@/lib/auth-context';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(getDashboardPath(user.role));
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#0051d5] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#45464d]">Memuat...</span>
      </div>
    </div>
  );
}
