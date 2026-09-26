'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getStoredStudents, getSessionsByStudentId, USERS, getMentoringArea, formatDate, formatDateShort, getInitials } from '@/lib/data';
import { MentoringAreaId, MentoringSession, Student } from '@/lib/types';

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;

  const { user } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [activeAreaFilter, setActiveAreaFilter] = useState<'semua' | MentoringAreaId>('semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setStudents(getStoredStudents());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const student = useMemo(() => {
    return students.find(s => s.id === studentId);
  }, [students, studentId]);

  const guruWali = useMemo(() => {
    if (!student) return null;
    return USERS.find(u => u.id === student.guru_wali_id);
  }, [student]);

  const parent = useMemo(() => {
    if (!student) return null;
    return USERS.find(u => u.id === student.orang_tua_id);
  }, [student]);

  const studentSessions = useMemo(() => {
    return getSessionsByStudentId(studentId);
  }, [studentId]);

  const filteredSessions = useMemo(() => {
    if (activeAreaFilter === 'semua') return studentSessions;
    return studentSessions.filter(s => s.area_id === activeAreaFilter);
  }, [studentSessions, activeAreaFilter]);

  // Hitung jumlah per area
  const countsByArea = useMemo(() => {
    const c: Record<string, number> = {
      akademik: 0,
      karakter: 0,
      kompetensi: 0,
      kolaborasi: 0,
    };
    studentSessions.forEach(s => {
      c[s.area_id] = (c[s.area_id] || 0) + 1;
    });
    return c;
  }, [studentSessions]);

  const pendingFollowUps = useMemo(() => {
    return studentSessions.filter(s => s.target_evaluasi && new Date(s.target_evaluasi) >= new Date()).length;
  }, [studentSessions]);

  if (!student) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-6 flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl text-[#76777d]">person_off</span>
        <h2 className="text-lg font-bold text-[#191c1e]">Data Siswa Tidak Ditemukan</h2>
        <Link href="/dashboard/siswa" className="text-sm text-[#0051d5] font-semibold hover:underline">
          Kembali ke Daftar Siswa
        </Link>
      </div>
    );
  }

  const initials = getInitials(student.nama);
  const lastSession = studentSessions[0];

  const getAreaBadge = (areaId: MentoringAreaId) => {
    switch (areaId) {
      case 'akademik':
        return {
          bg: 'bg-[#dbe1ff]',
          text: 'text-[#003ea8]',
          dot: 'bg-[#0051d5]',
          label: 'Akademik',
          icon: 'school',
        };
      case 'karakter':
        return {
          bg: 'bg-[#89f5e7]/40',
          text: 'text-[#0c9488]',
          dot: 'bg-[#0c9488]',
          label: 'Karakter & Adab',
          icon: 'emoji_objects',
        };
      case 'kompetensi':
        return {
          bg: 'bg-[#e0e3e5]',
          text: 'text-[#3f465c]',
          dot: 'bg-[#3f465c]',
          label: 'Kompetensi',
          icon: 'psychology',
        };
      case 'kolaborasi':
        return {
          bg: 'bg-[#eceef0]',
          text: 'text-[#565e74]',
          dot: 'bg-[#565e74]',
          label: 'Kolaborasi Mapel',
          icon: 'handshake',
        };
    }
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
      <div className="flex flex-col min-h-screen bg-[#f7f9fb]">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2d3133] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-[#89f5e7] text-[20px]">check_circle</span>
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <header className="fixed top-0 inset-x-0 z-50 bg-[#f7f9fb]/90 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center text-[#191c1e] hover:text-[#0051d5] rounded-xl hover:bg-[#eceef0] transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="w-8 h-8 rounded-lg bg-[#131b2e] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-[16px]">school</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#45464d] truncate">SMP Global Madani</span>
                <h1 className="text-sm font-bold text-[#191c1e] truncate leading-tight">Detail Siswa</h1>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#131b2e] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-[16px]">person</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pt-16 pb-12 max-w-2xl mx-auto w-full px-4 space-y-4">
          {/* KOP SURAT RESMI CETAK / PDF */}
          <div className="hidden print:block print-header text-center pb-3 mb-4 border-b-2 border-black">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">Yayasan Pendidikan Global Madani</h3>
            <h1 className="text-base font-black uppercase text-black">SMP Global Madani Bandar Lampung</h1>
            <p className="text-[10px] text-gray-700">Jl. Prof. Dr. Soemantri Brojonegoro No. 1, Gedong Meneng, Rajabasa, Bandar Lampung</p>
            <p className="text-[10px] text-gray-700">Telp: (0721) 787888 • Laman: https://smp.globalmadani.sch.id</p>
            <div className="mt-2 pt-2 border-t border-black text-xs font-bold uppercase">
              Lembar Catatan Riwayat Pendampingan &amp; Bimbingan Siswa
            </div>
          </div>

          {/* Profil Siswa Card */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-[#dbe1ff] text-[#003ea8] flex items-center justify-center font-bold text-lg shadow-sm">
                    {initials}
                  </div>
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#0c9488] rounded-full ring-2 ring-white"
                    title="Aktif di Sekolah"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-lg font-bold text-[#191c1e] truncate">{student.nama}</h2>
                  <p className="text-xs text-[#45464d] flex items-center gap-1.5 mt-0.5">
                    <span className="font-medium text-[#191c1e]">NISGM: {student.nisn}</span>
                    <span className="w-1 h-1 rounded-full bg-[#c6c6cd]" />
                    <span className="bg-[#eceef0] px-2 py-0.5 rounded text-[#191c1e] font-semibold text-[11px]">
                      {student.kelas}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                {student.status_pendampingan === 'perlu_perhatian' ? (
                  <span className="inline-flex items-center gap-1.5 bg-[#ffdad6] text-[#ba1a1a] px-2.5 py-1 rounded-full text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
                    Perlu Perhatian
                  </span>
                ) : student.status_pendampingan === 'aktif' ? (
                  <span className="inline-flex items-center gap-1.5 bg-[#89f5e7]/40 text-[#0c9488] px-2.5 py-1 rounded-full text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#0c9488] animate-pulse" />
                    Perkembangan Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-[#eceef0] text-[#45464d] px-2.5 py-1 rounded-full text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#76777d]" />
                    Stabil
                  </span>
                )}
              </div>
            </div>

            {/* Metadata Pengampu & Orang Tua */}
            <div className="bg-[#f7f9fb] rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#45464d]">
                  <span className="material-symbols-outlined text-[16px] text-[#0051d5]">school</span>
                  <span>Guru Wali:</span>
                </div>
                <span className="font-semibold text-[#191c1e]">{guruWali?.nama || 'Mr. Ahmad Fauzi, S.Pd.'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#45464d]">
                  <span className="material-symbols-outlined text-[16px] text-[#76777d]">family_restroom</span>
                  <span>Orang Tua:</span>
                </div>
                <span className="font-semibold text-[#191c1e]">{parent?.nama || 'Bpk. Bambang Irawan (Ayah)'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-12 gap-2 pt-1">
              <Link
                href={`/dashboard/catat?siswa=${student.id}`}
                className="col-span-8 bg-[#191c1e] hover:bg-[#131b2e] text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Catat Sesi Baru</span>
              </Link>
              <button
                onClick={() => {
                  window.print();
                  showToast('Menyiapkan dokumen riwayat pendampingan cetak/PDF...');
                }}
                className="col-span-4 bg-[#e6e8ea] hover:bg-[#d8dadc] text-[#191c1e] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors active:scale-[0.98]"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-[#0051d5]">download</span>
                <span>PDF</span>
              </button>
            </div>
          </section>

          {/* Ringkasan Statistik Siswa */}
          <section className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#45464d]">Total Sesi</span>
                <span className="material-symbols-outlined text-[16px] text-[#0051d5]">history_edu</span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-bold text-[#191c1e]">
                  {studentSessions.length} <span className="text-xs font-normal text-[#45464d]">Sesi</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#45464d] truncate">Sesi Terakhir</span>
                <span className="material-symbols-outlined text-[16px] text-[#0c9488]">event</span>
              </div>
              <div className="mt-2 min-w-0">
                <p className="text-xs font-bold text-[#191c1e] truncate">
                  {lastSession ? formatDateShort(lastSession.tanggal) : '-'}
                </p>
                <span className="text-[10px] text-[#0051d5] font-semibold block capitalize truncate">
                  {lastSession ? lastSession.area_id : 'Belum Ada'}
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#45464d] truncate">Tindak Lanjut</span>
                <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">assignment_late</span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-bold text-[#ba1a1a]">
                  {pendingFollowUps} <span className="text-xs font-normal text-[#45464d]">Agenda</span>
                </p>
              </div>
            </div>
          </section>

          {/* Filter Garis Waktu */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#191c1e]">Garis Waktu Pendampingan</h3>
              <span className="text-[11px] text-[#45464d]">T.A. 2024/2025</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setActiveAreaFilter('semua')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeAreaFilter === 'semua'
                    ? 'bg-[#191c1e] text-white shadow-sm'
                    : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
                }`}
              >
                Semua Area ({studentSessions.length})
              </button>
              <button
                onClick={() => setActiveAreaFilter('akademik')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeAreaFilter === 'akademik'
                    ? 'bg-[#0051d5] text-white shadow-sm'
                    : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
                }`}
              >
                Akademik ({countsByArea.akademik || 0})
              </button>
              <button
                onClick={() => setActiveAreaFilter('karakter')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeAreaFilter === 'karakter'
                    ? 'bg-[#0c9488] text-white shadow-sm'
                    : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
                }`}
              >
                Karakter ({countsByArea.karakter || 0})
              </button>
              <button
                onClick={() => setActiveAreaFilter('kompetensi')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeAreaFilter === 'kompetensi'
                    ? 'bg-[#3f465c] text-white shadow-sm'
                    : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
                }`}
              >
                Kompetensi ({countsByArea.kompetensi || 0})
              </button>
              <button
                onClick={() => setActiveAreaFilter('kolaborasi')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeAreaFilter === 'kolaborasi'
                    ? 'bg-[#565e74] text-white shadow-sm'
                    : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
                }`}
              >
                Kolaborasi ({countsByArea.kolaborasi || 0})
              </button>
            </div>
          </section>

          {/* Vertical Timeline */}
          <section className="relative pl-6 space-y-4 mb-6">
            {/* Continuous Vertical Backbone Line */}
            <div className="absolute left-2.5 top-3 bottom-4 w-0.5 bg-[#e0e3e5] rounded-full" />

            {filteredSessions.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center border border-slate-100 shadow-sm ml-2">
                <span className="material-symbols-outlined text-3xl text-[#76777d]">event_busy</span>
                <p className="text-xs font-semibold text-[#191c1e] mt-1">Belum ada catatan pada filter ini</p>
              </div>
            ) : (
              filteredSessions.map(session => {
                const badge = getAreaBadge(session.area_id);
                return (
                  <div key={session.id} className="relative flex flex-col gap-2">
                    {/* Colored Category Timeline Dot */}
                    <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200">
                      <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                    </div>

                    {/* Card Sesi Content */}
                    <article className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 transition-transform">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs text-[#45464d] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              {formatDate(session.tanggal)}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#191c1e] leading-snug mt-1">
                            {session.kegiatan_tambahan || session.kegiatan[0]}
                          </h4>
                        </div>
                      </div>

                      {/* Kegiatan Checklist Items */}
                      <div className="bg-[#f7f9fb] rounded-xl p-3 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#45464d]">
                          Kegiatan yang Dilaksanakan:
                        </span>
                        <ul className="space-y-1">
                          {session.kegiatan.map((k, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-xs text-[#191c1e]">
                              <span className="material-symbols-outlined text-[15px] text-[#0051d5] flex-shrink-0 mt-0.5">
                                check_circle
                              </span>
                              <span>{k}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Temuan & Observasi Guru Wali */}
                      <div className="border-l-3 border-[#0051d5] pl-3 py-1 bg-slate-50/50 rounded-r-lg">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#45464d] block">
                          Temuan &amp; Observasi:
                        </span>
                        <p className="text-xs text-[#191c1e] mt-0.5 leading-relaxed italic">
                          &quot;{session.temuan}&quot;
                        </p>
                      </div>

                      {/* Tindak Lanjut & Target */}
                      {session.tindak_lanjut && session.tindak_lanjut.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#45464d]">Rencana Tindak Lanjut:</span>
                            {session.target_evaluasi && (
                              <span className="text-[#0051d5] font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">event_repeat</span>
                                Eval: {formatDateShort(session.target_evaluasi)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {session.tindak_lanjut.map((tl, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f2f4f6] text-[#191c1e] text-[11px] font-medium"
                              >
                                <span className="material-symbols-outlined text-[13px] text-[#0c9488]">task_alt</span>
                                {tl}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer catatan */}
                      <div className="flex items-center justify-between text-[10px] text-[#76777d] pt-1">
                        <span>Dicatat oleh: <strong>{session.dicatat_oleh_nama}</strong></span>
                        <span className="flex items-center gap-1 text-[#0051d5]">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Resmi
                        </span>
                      </div>
                    </article>
                  </div>
                );
              })
            )}
          </section>

          {/* TANDA TANGAN CETAK / PDF */}
          <div className="hidden print:flex justify-between items-end mt-12 pt-6 text-xs text-black">
            <div className="text-center">
              <p>Mengetahui,</p>
              <p className="font-semibold">Kepala SMP Global Madani</p>
              <div className="h-16" />
              <p className="font-bold underline">H. Sapto Wibowo, S.Pd., M.Si.</p>
              <p className="text-[10px]">NIP. 19780512 200501 1 008</p>
            </div>
            <div className="text-center">
              <p>Bandar Lampung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-semibold">Guru Wali Kelas {student.kelas}</p>
              <div className="h-16" />
              <p className="font-bold underline">{guruWali?.nama || 'Mr. Ahmad Fauzi, S.Pd.'}</p>
              <p className="text-[10px]">NIP. 19850914 201001 1 012</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
