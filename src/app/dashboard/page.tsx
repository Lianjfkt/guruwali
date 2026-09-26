'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { GuruWaliLayout } from '@/components/layouts';
import {
  getStoredStudents, getStoredSessions, MENTORING_AREAS,
  getAreaDistribution, getRelativeTime, formatDateShort, getInitials
} from '@/lib/data';
import { Student, MentoringSession } from '@/lib/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'guru_wali') { router.replace('/admin'); return; }
    setSessions(getStoredSessions());
    setStudents(getStoredStudents());
  }, [user, router]);

  if (!user || user.role !== 'guru_wali') {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0051d5] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const myStudents = students.filter(s => s.guru_wali_id === user.id || s.kelas === user.kelas);
  const mySessions = sessions.filter(s => s.dicatat_oleh === user.id);
  const dist = getAreaDistribution(mySessions);
  const totalSesi = mySessions.length;
  const totalSiswa = myStudents.length;
  const terjangkau = new Set(mySessions.map(s => s.siswa_id)).size;
  const perluPerhatian = myStudents.filter(s => s.status_pendampingan === 'perlu_perhatian');
  const recentSessions = mySessions.slice(0, 3);

  const pct = totalSiswa > 0 ? Math.round((terjangkau / totalSiswa) * 100) : 0;

  const areaColors: Record<string, string> = {
    akademik: '#316bf3',
    kompetensi: '#3f465c',
    karakter: '#0c9488',
    kolaborasi: '#565e74',
  };
  const areaBadge: Record<string, { bg: string; text: string }> = {
    akademik: { bg: '#dbe1ff', text: '#003ea8' },
    kompetensi: { bg: '#dae2fd', text: '#131b2e' },
    karakter: { bg: '#89f5e7', text: '#00201d' },
    kolaborasi: { bg: '#e0e3e5', text: '#191c1e' },
  };

  return (
    <GuruWaliLayout user={user}>
      <div className="flex flex-col gap-4 px-4 py-4">

        {/* Welcome Card */}
        <section className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dbe1ff] text-[#003ea8] text-[11px] font-semibold">
              <span className="material-symbols-outlined text-[12px]">school</span>
              {user.kelas} • TA 2026/2027
            </div>
            <button onClick={logout} className="text-[10px] text-[#76777d] flex items-center gap-1 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-[14px]">logout</span>
              Keluar
            </button>
          </div>
          <h1 className="text-lg font-bold text-[#191c1e]">Assalamu'alaikum, {user.nama.replace('Mr. ', '').replace('Ms. ', '').split(',')[0]}</h1>
          <p className="text-xs text-[#45464d] mt-0.5 mb-3">Pantau perkembangan akhlak, capaian belajar, dan kesiapan siswa perwalian.</p>
          <Link
            href="/dashboard/catat"
            className="w-full h-11 rounded-xl bg-[#131b2e] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1e293b] active:scale-[0.99] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            + Catat Sesi Baru
          </Link>
          <Link
            href="/dashboard/siswa-binaan"
            className="w-full h-10 rounded-xl border border-[#e0e3e5] text-[#45464d] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#f2f4f6] active:scale-[0.99] transition-all mt-2"
          >
            <span className="material-symbols-outlined text-[16px] text-[#0051d5]">manage_accounts</span>
            Kelola Siswa Binaan
          </Link>
        </section>

        {/* Onboarding jika belum ada siswa binaan */}
        {myStudents.length === 0 && (
          <section className="bg-gradient-to-r from-[#dbe1ff]/60 to-[#89f5e7]/20 border border-[#0051d5]/20 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#0051d5]">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <h3 className="text-xs font-bold uppercase tracking-wider">Langkah Awal Perwalian</h3>
            </div>
            <p className="text-xs text-[#191c1e]">
              Belum ada siswa binaan yang terdaftar untuk kelas <strong>{user.kelas}</strong>. Daftarkan siswa binaan Anda terlebih dahulu untuk memulai pendampingan.
            </p>
            <div className="pt-1">
              <Link
                href="/dashboard/siswa-binaan"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#003ea8] transition-colors shadow-sm"
              >
                <span>+ Tambah Siswa Binaan Sekarang</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </section>
        )}

        {/* Quick Metrics */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#45464d]">Total Perwalian</span>
              <div className="w-7 h-7 rounded-lg bg-[#eceef0] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#0051d5] text-[16px]">groups</span>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#191c1e]">{totalSiswa}</div>
              <div className="text-[11px] text-[#45464d]">Siswa terdaftar</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#45464d]">Sesi Terlaksana</span>
              <div className="w-7 h-7 rounded-lg bg-[#eceef0] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#0c9488] text-[16px]">fact_check</span>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#191c1e]">{totalSesi}</div>
              <div className="text-[11px] text-[#45464d]">Pertemuan kumulatif</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="col-span-2 bg-white rounded-2xl p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#191c1e]">Capaian Pendampingan Bulan Ini</span>
              <span className="text-xs font-bold text-[#0c9488]">{terjangkau} / {totalSiswa} ({pct}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#eceef0] overflow-hidden">
              <div className="h-full bg-[#0c9488] rounded-full progress-animated" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[11px] text-[#45464d] mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-[#0c9488]">task_alt</span>
              Tersisa {totalSiswa - terjangkau} siswa untuk target pendampingan wajib.
            </p>
          </div>

          {/* Perlu Perhatian */}
          {perluPerhatian.length > 0 && (
            <div className="col-span-2 bg-[#ffdad6]/40 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#ffdad6] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">priority_high</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-[#191c1e]">{perluPerhatian.length} Siswa Butuh Tindak Lanjut</h4>
                  <p className="text-[11px] text-[#45464d] truncate">Prioritas pekan ini</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white text-[10px] font-semibold flex-shrink-0">Perhatian</span>
            </div>
          )}
        </section>

        {/* 4 Pilar Distribution */}
        <section className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#191c1e]">4 Pilar Pendampingan</h2>
              <span className="text-[11px] text-[#45464d]">Sebaran fokus perwalian semester ini</span>
            </div>
            <span className="text-[11px] text-[#45464d]">Total {totalSesi}</span>
          </div>

          {/* Segmented bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden bg-[#eceef0] gap-0.5 mb-3">
            {MENTORING_AREAS.map(area => {
              const count = dist[area.id] || 0;
              const pct = totalSesi > 0 ? (count / totalSesi) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={area.id}
                  className="h-full"
                  style={{ width: `${pct}%`, backgroundColor: areaColors[area.id] }}
                  title={`${area.nama_area}: ${count}`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {MENTORING_AREAS.map(area => (
              <div key={area.id} className="p-2 rounded-lg bg-[#f7f9fb] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: areaColors[area.id] }} />
                  <span className="text-[11px] text-[#191c1e] truncate">{area.nama_area.split(' ')[0]}</span>
                </div>
                <span className="text-[11px] font-bold text-[#191c1e]">{dist[area.id] || 0} sesi</span>
              </div>
            ))}
          </div>
        </section>

        {/* Perlu Tindak Lanjut - Student Cards */}
        {perluPerhatian.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">assignment_late</span>
                <h2 className="text-sm font-bold text-[#191c1e]">Perlu Tindak Lanjut</h2>
              </div>
              <span className="text-[11px] text-[#ba1a1a] font-medium">Prioritas Pekan Ini</span>
            </div>

            {perluPerhatian.map(siswa => {
              const lastSession = mySessions.filter(s => s.siswa_id === siswa.id)[0];
              return (
                <div key={siswa.id} className="bg-white rounded-2xl p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#dbe1ff] flex items-center justify-center font-bold text-sm text-[#003ea8] flex-shrink-0">
                        {getInitials(siswa.nama)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-[#191c1e] truncate">{siswa.nama}</span>
                        <span className="text-[11px] text-[#45464d]">NISGM: {siswa.nisn} • {siswa.kelas}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-semibold flex-shrink-0">
                      {lastSession ? getRelativeTime(lastSession.tanggal) : 'Belum ada sesi'}
                    </span>
                  </div>

                  {lastSession && (
                    <div className="p-2.5 rounded-lg bg-[#f2f4f6] mb-2">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#191c1e] mb-1">
                        <span className="material-symbols-outlined text-[14px] text-[#0051d5]">assignment</span>
                        Catatan Tindak Lanjut:
                      </div>
                      <p className="text-[11px] text-[#45464d]">{lastSession.temuan.slice(0, 100)}{lastSession.temuan.length > 100 ? '...' : ''}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/dashboard/siswa/${siswa.id}`} className="px-3 py-1.5 rounded-lg bg-[#eceef0] text-[#191c1e] text-[11px] font-medium hover:bg-[#e0e3e5] transition-colors">
                      Lihat Profil
                    </Link>
                    <Link href={`/dashboard/catat?siswa=${siswa.id}`} className="px-3 py-1.5 rounded-lg bg-[#131b2e] text-white text-[11px] font-medium flex items-center gap-1 hover:bg-[#1e293b] transition-colors">
                      <span className="material-symbols-outlined text-[13px]">edit_note</span>
                      Catat Sesi
                    </Link>
                  </div>
                </div>
              );
            })}

            <Link
              href="/dashboard/siswa"
              className="w-full py-2.5 rounded-xl bg-white text-[#191c1e] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#f2f4f6] transition-colors shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              Lihat Semua {myStudents.length} Siswa Perwalian
            </Link>
          </section>
        )}

        {/* Jurnal Terkini */}
        <section className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#0051d5]">history</span>
              <h2 className="text-sm font-bold text-[#191c1e]">Jurnal Aktivitas Terkini</h2>
            </div>
            <Link href="/dashboard/siswa" className="text-[11px] text-[#0051d5] font-semibold hover:underline">Semua Jurnal</Link>
          </div>

          <div className="relative pl-5 flex flex-col gap-4" style={{ borderLeft: 'none' }}>
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-[#eceef0] rounded-full" />
            {recentSessions.map(session => {
              const siswa = students.find(s => s.id === session.siswa_id);
              const area = MENTORING_AREAS.find(a => a.id === session.area_id);
              return (
                <div key={session.id} className="relative">
                  <div
                    className="absolute -left-5 top-1.5 w-3 h-3 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: areaColors[session.area_id] }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#45464d]">{getRelativeTime(session.tanggal)}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: areaBadge[session.area_id]?.bg, color: areaBadge[session.area_id]?.text }}
                      >
                        {area?.nama_area.split(' ')[0]}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-[#191c1e]">{siswa?.nama}</h3>
                    <p className="text-[11px] text-[#45464d] line-clamp-2">{session.temuan}</p>
                  </div>
                </div>
              );
            })}
            {recentSessions.length === 0 && (
              <p className="text-[11px] text-[#45464d] text-center py-4">Belum ada sesi dicatat.</p>
            )}
          </div>
        </section>
      </div>
    </GuruWaliLayout>
  );
}
