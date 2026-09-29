'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { GuruWaliLayout } from '@/components/layouts';
import { getInitials, formatDateShort } from '@/lib/data';
import { getStudentsByGuruWali, getSessionsByGuruWali } from '@/lib/db';
import { Student, MentoringSession } from '@/lib/types';

export default function SiswaPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'perlu_perhatian' | 'aktif' | 'stabil'>('semua');

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'guru_wali')) {
      if (user?.role === 'admin') router.push('/admin');
      else if (user?.role === 'orang_tua') router.push('/portal-orang-tua');
      else router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'guru_wali') return;
    const loadData = async () => {
      try {
        setIsDbLoading(true);
        const [studs, sess] = await Promise.all([
          getStudentsByGuruWali(user.id),
          getSessionsByGuruWali(user.id),
        ]);
        setStudents(studs);
        setSessions(sess);
      } catch {
        // ignore load error
      } finally {
        setIsDbLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Siswa yang diampu guru wali yang login
  const myStudents = useMemo(() => {
    if (!user) return [];
    return students.filter(s => s.guru_wali_id === user.id);
  }, [user, students]);

  const filteredStudents = useMemo(() => {
    return myStudents.filter(s => {
      const matchSearch =
        s.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.nisn.includes(search);
      const matchStatus =
        statusFilter === 'semua' ? true : s.status_pendampingan === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [myStudents, search, statusFilter]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <div className="w-8 h-8 border-3 border-[#0051d5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatusBadge = (status: Student['status_pendampingan']) => {
    switch (status) {
      case 'perlu_perhatian':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ffdad6] text-[#ba1a1a]">
            <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
            Perlu Perhatian
          </span>
        );
      case 'aktif':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#89f5e7]/40 text-[#0c9488]">
            <span className="w-2 h-2 rounded-full bg-[#0c9488]" />
            Perkembangan Aktif
          </span>
        );
      case 'stabil':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eceef0] text-[#45464d]">
            <span className="w-2 h-2 rounded-full bg-[#76777d]" />
            Stabil
          </span>
        );
    }
  };

  return (
    <GuruWaliLayout user={user}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0051d5]">
                Daftar Perwalian
              </span>
              <h1 className="text-xl font-bold text-[#191c1e]">
                Siswa Binaan
              </h1>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#dbe1ff] text-[#003ea8] text-xs font-bold">
              {myStudents.length} Siswa
            </span>
          </div>
          <p className="text-xs text-[#45464d]">
            Pantau perkembangan dan riwayat bimbingan perwalian secara individual.
          </p>

          {/* Search Box */}
          <div className="relative mt-2">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#76777d]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama siswa atau NISGM..."
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f2f4f6] text-sm text-[#191c1e] placeholder-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#191c1e]"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2">
            <button
              onClick={() => setStatusFilter('semua')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'semua'
                  ? 'bg-[#191c1e] text-white shadow-sm'
                  : 'bg-[#f2f4f6] text-[#45464d] hover:bg-[#e6e8ea]'
              }`}
            >
              Semua ({myStudents.length})
            </button>
            <button
              onClick={() => setStatusFilter('perlu_perhatian')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'perlu_perhatian'
                  ? 'bg-[#ba1a1a] text-white shadow-sm'
                  : 'bg-[#f2f4f6] text-[#ba1a1a] hover:bg-[#ffdad6]'
              }`}
            >
              Perlu Perhatian ({myStudents.filter(s => s.status_pendampingan === 'perlu_perhatian').length})
            </button>
            <button
              onClick={() => setStatusFilter('aktif')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'aktif'
                  ? 'bg-[#0c9488] text-white shadow-sm'
                  : 'bg-[#f2f4f6] text-[#0c9488] hover:bg-[#89f5e7]/30'
              }`}
            >
              Aktif ({myStudents.filter(s => s.status_pendampingan === 'aktif').length})
            </button>
            <button
              onClick={() => setStatusFilter('stabil')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'stabil'
                  ? 'bg-[#45464d] text-white shadow-sm'
                  : 'bg-[#f2f4f6] text-[#45464d] hover:bg-[#e6e8ea]'
              }`}
            >
              Stabil ({myStudents.filter(s => s.status_pendampingan === 'stabil').length})
            </button>
          </div>
        </div>

        {/* Student Cards List */}
        <div className="space-y-3">
          {isDbLoading ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-[#0051d5] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#76777d] mt-2 font-medium">Memuat data siswa...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-4xl text-[#76777d]">person_search</span>
              <div>
                <p className="text-sm font-bold text-[#191c1e]">
                  {myStudents.length === 0 ? 'Belum Ada Siswa Binaan' : 'Tidak Ada Siswa yang Cocok'}
                </p>
                <p className="text-xs text-[#45464d] mt-1 max-w-sm">
                  {myStudents.length === 0
                    ? 'Daftar siswa binaan Anda masih kosong. Tambahkan siswa binaan Anda untuk mulai mencatat pendampingan.'
                    : 'Coba kata kunci pencarian atau filter status yang lain.'}
                </p>
              </div>
              {myStudents.length === 0 && (
                <Link
                  href="/dashboard/siswa-binaan"
                  className="mt-2 px-4 py-2 bg-[#0051d5] text-white text-xs font-semibold rounded-xl hover:bg-[#003ea8] transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>+ Tambah Siswa Binaan</span>
                </Link>
              )}
            </div>
          ) : (
            filteredStudents.map(student => {
              const studentSessions = sessions.filter(s => s.siswa_id === student.id);
              const lastSession = studentSessions[0];
              const initials = getInitials(student.nama);

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-[#dbe1ff] text-[#003ea8] flex items-center justify-center font-bold text-base flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/dashboard/siswa/${student.id}`}
                          className="font-bold text-[#191c1e] text-base hover:text-[#0051d5] transition-colors truncate"
                        >
                          {student.nama}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-[#45464d] mt-0.5">
                          <span>NISGM: {student.nisn}</span>
                          <span className="w-1 h-1 rounded-full bg-[#c6c6cd]" />
                          <span className="px-2 py-0.5 rounded bg-[#dbe1ff] text-[#003ea8] font-bold text-[11px]">
                            Kelas {student.kelas}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(student.status_pendampingan)}
                    </div>
                  </div>

                  {/* Sesi info */}
                  <div className="bg-[#f7f9fb] rounded-xl p-3 flex items-center justify-between text-xs text-[#45464d]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#0051d5]">history_edu</span>
                      <span>Total: <strong className="text-[#191c1e]">{studentSessions.length} Sesi</strong></span>
                    </div>
                    {lastSession ? (
                      <span className="truncate">
                        Terakhir: <strong className="text-[#191c1e]">{formatDateShort(lastSession.tanggal)}</strong>
                      </span>
                    ) : (
                      <span className="text-[#ba1a1a] font-medium">Belum ada sesi</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Link
                      href={`/dashboard/siswa/${student.id}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span>Lihat Riwayat</span>
                    </Link>
                    <Link
                      href={`/dashboard/catat?siswa=${student.id}`}
                      className="py-2 px-4 rounded-xl bg-[#191c1e] hover:bg-[#131b2e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Catat Sesi</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </GuruWaliLayout>
  );
}
