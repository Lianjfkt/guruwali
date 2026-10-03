'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AdminLayout } from '@/components/layouts';
import * as XLSX from 'xlsx';
import { getAreaDistribution } from '@/lib/data';
import { getAllStudents, getAllSessions, getAllGuruWali, getClassSummaries, getGuruWaliSummaries } from '@/lib/db';
import { ClassSummary, GuruWaliSummary, Student, MentoringSession, User } from '@/lib/types';

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [selectedLevel, setSelectedLevel] = useState<'all' | '7' | '8' | '9'>('all');
  const [monitorTab, setMonitorTab] = useState<'guru_wali' | 'rombel'>('guru_wali');
  const [showExportModal, setShowExportModal] = useState(false);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [guruSummaries, setGuruSummaries] = useState<GuruWaliSummary[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      if (user?.role === 'guru_wali') router.push('/dashboard');
      else if (user?.role === 'orang_tua') router.push('/portal-orang-tua');
      else router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let ignore = false;
    const load = async () => {
      try {
        setIsDbLoading(true);
        const [cls, gw, studs, sess, tchs] = await Promise.all([
          getClassSummaries(),
          getGuruWaliSummaries(),
          getAllStudents(),
          getAllSessions(),
          getAllGuruWali(),
        ]);
        if (!ignore) {
          setClasses(cls);
          setGuruSummaries(gw);
          setStudents(studs);
          setSessions(sess);
          setTeachers(tchs);
        }
      } catch {
        // ignore load error
      } finally {
        if (!ignore) {
          setIsDbLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [user]);

  const currentYear = new Date().getFullYear();
  const semesterLabel = `Semester Ganjil ${currentYear}/${currentYear + 1}`;
  const currentMonth = new Date().toLocaleDateString('id-ID', { month: 'long' });

  const filteredClasses = useMemo(() => {
    if (selectedLevel === 'all') return classes;
    return classes.filter(c => c.kelas.startsWith(selectedLevel));
  }, [selectedLevel, classes]);

  const stats = useMemo(() => {
    const totalSiswa = filteredClasses.reduce((acc, c) => acc + c.total_siswa, 0);
    const totalTerjangkau = filteredClasses.reduce((acc, c) => acc + c.siswa_terjangkau, 0);
    const totalSesi = filteredClasses.reduce((acc, c) => acc + c.total_sesi, 0);
    const totalGuru = teachers.length;
    const coveragePct = totalSiswa > 0 ? Math.round((totalTerjangkau / totalSiswa) * 100) : 0;

    const activeGuruCount = teachers.filter(t => sessions.some(s => s.dicatat_oleh === t.id)).length;
    const teacherCompliancePct = teachers.length > 0 ? Math.round((activeGuruCount / teachers.length) * 100) : 0;

    return { totalSiswa, totalTerjangkau, totalSesi, totalGuru, coveragePct, activeGuruCount, teacherCompliancePct };
  }, [filteredClasses, teachers, sessions]);

  const urgentStudents = useMemo(() => {
    return students.filter(s => s.status_pendampingan === 'perlu_perhatian');
  }, [students]);

  const areaDist = useMemo(() => {
    return getAreaDistribution(sessions);
  }, [sessions]);

  const handleExportXLSX = () => {
    try {
      const rows = sessions.map(s => {
        const siswa = students.find(st => st.id === s.siswa_id);
        return {
          'Tanggal': s.tanggal,
          'Nama Siswa': siswa?.nama || '-',
          'Kelas': siswa?.kelas || '-',
          'NISGM': siswa?.nisn || '-',
          'Metode & Tempat': s.metode || '-',
          'Area Pendampingan': s.area_id.toUpperCase(),
          'Dicatat Oleh': s.dicatat_oleh_nama,
          'Temuan & Observasi': s.temuan,
          'Kegiatan / Topik': s.kegiatan.join('; ') + (s.kegiatan_tambahan && !s.kegiatan.includes(s.kegiatan_tambahan) ? ` (${s.kegiatan_tambahan})` : ''),
          'Rencana Tindak Lanjut': s.tindak_lanjut.join('; '),
          'Target Evaluasi': s.target_evaluasi || '-',
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Jurnal Pendampingan');
      XLSX.writeFile(wb, `jurnal-pendampingan-${new Date().toISOString().split('T')[0]}.xlsx`);
      setShowExportModal(false);
    } catch {
      alert('Gagal mengekspor berkas Excel. Silakan coba lagi.');
    }
  };

  if (isLoading || isDbLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <div className="w-8 h-8 border-3 border-[#0051d5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="flex flex-col w-full">
        {/* Period & Scope Subheader */}
        <div className="px-4 py-2.5 bg-[#f2f4f6] flex items-center justify-between border-b border-slate-200/60">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-[#0051d5] text-[18px] flex-shrink-0">
              calendar_today
            </span>
            <span className="text-xs font-semibold text-[#191c1e] truncate">
              {semesterLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#0c9488] animate-pulse" />
            <span className="text-[11px] text-[#45464d] font-semibold">Bulan Berjalan ({currentMonth})</span>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-4 space-y-4">
          {/* Executive Greeting & Action Trigger */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0051d5]">
                  Monitoring &amp; Evaluasi
                </span>
                <h1 className="text-xl font-bold text-[#191c1e] tracking-tight">
                  Rekapitulasi Sekolah
                </h1>
                <p className="text-xs text-[#45464d] mt-0.5">
                  Ketercapaian pembinaan siswa lintas rombel (Kelas 7–9)
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#191c1e] hover:bg-[#131b2e] text-white text-xs font-semibold transition-all shadow-sm flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Ekspor</span>
              </button>
            </div>

            {/* Urgent Priority Banner */}
            {urgentStudents.length > 0 ? (
              <div className="w-full bg-[#ffdad6] text-[#ba1a1a] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">
                      notification_important
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold leading-tight truncate">
                      {urgentStudents.length} Siswa Butuh Atensi Khusus
                    </span>
                    <span className="text-[10px] text-[#93000a] truncate">
                      Perlu remidiasi atau tindak lanjut bimbingan konseling
                    </span>
                  </div>
                </div>
                <a
                  href="#atensi-khusus"
                  className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-[#ba1a1a] shadow-xs hover:bg-slate-50 transition-colors flex-shrink-0"
                >
                  Tinjau
                </a>
              </div>
            ) : (
              <div className="w-full bg-[#89f5e7]/30 text-[#00201d] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[#0c9488] text-[20px]">
                      verified
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold leading-tight truncate">
                      Status Pendampingan Kondusif
                    </span>
                    <span className="text-[10px] text-[#00201d]/70 truncate">
                      {students.length > 0
                        ? 'Semua siswa terpantau stabil dan belum ada eskalasi khusus.'
                        : 'Sistem siap digunakan. Daftarkan siswa baru untuk memulai.'}
                    </span>
                  </div>
                </div>
                <Link
                  href="/admin/siswa"
                  className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-[#0c9488] shadow-xs hover:bg-slate-50 transition-colors flex-shrink-0"
                >
                  Data Siswa
                </Link>
              </div>
            )}
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLevel === 'all'
                  ? 'bg-[#191c1e] text-white shadow-sm'
                  : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
              }`}
            >
              Semua Tingkat (6 Rombel)
            </button>
            <button
              onClick={() => setSelectedLevel('7')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLevel === '7'
                  ? 'bg-[#0051d5] text-white shadow-sm'
                  : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
              }`}
            >
              Kelas 7
            </button>
            <button
              onClick={() => setSelectedLevel('8')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLevel === '8'
                  ? 'bg-[#0051d5] text-white shadow-sm'
                  : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
              }`}
            >
              Kelas 8
            </button>
            <button
              onClick={() => setSelectedLevel('9')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLevel === '9'
                  ? 'bg-[#0051d5] text-white shadow-sm'
                  : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
              }`}
            >
              Kelas 9
            </button>
          </div>

          {/* Primary Metric Grid (2x2) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Total Siswa */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#45464d]">Total Siswa</span>
                <div className="w-7 h-7 rounded-lg bg-[#eceef0] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-[#191c1e]">groups</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold text-[#191c1e]">{stats.totalSiswa}</div>
                <div className="text-[10px] text-[#45464d] mt-0.5">{filteredClasses.length} Rombel Terpilih</div>
              </div>
            </div>

            {/* Card 2: Sesi Jurnal */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#45464d]">Sesi Jurnal</span>
                <div className="w-7 h-7 rounded-lg bg-[#dbe1ff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-[#003ea8]">forum</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-[#191c1e]">{stats.totalSesi}</span>
                  <span className="text-[11px] text-[#0051d5] font-semibold">Tercatat</span>
                </div>
                <div className="text-[10px] text-[#45464d] mt-0.5">Total interaksi bimbingan</div>
              </div>
            </div>

            {/* Card 3: Kepatuhan Guru */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#45464d]">Kepatuhan Guru</span>
                <div className="w-7 h-7 rounded-lg bg-[#89f5e7]/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-[#0c9488]">verified</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold text-[#191c1e]">{stats.activeGuruCount} / {teachers.length || stats.totalGuru} Guru</div>
                <div className="text-[10px] text-[#0c9488] font-bold mt-0.5">{stats.teacherCompliancePct}% Aktif Mengisi</div>
              </div>
            </div>

            {/* Card 4: Tercakup Target */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#45464d]">Tercakup</span>
                <div className="w-7 h-7 rounded-lg bg-[#dbe1ff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-[#0051d5]">donut_large</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold text-[#191c1e]">{stats.coveragePct}%</span>
                  <span className="text-[10px] text-[#45464d]">{stats.totalTerjangkau}/{stats.totalSiswa}</span>
                </div>
                <div className="w-full bg-[#eceef0] rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div className="bg-[#0051d5] h-full rounded-full transition-all duration-500" style={{ width: `${stats.coveragePct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Breakdown: 4 Pillars of Mentoring */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0051d5] text-[20px]">pie_chart</span>
                <span className="text-xs font-bold text-[#191c1e]">Distribusi 4 Pilar Pendampingan</span>
              </div>
              <span className="text-[11px] text-[#45464d]">Total {sessions.length} Sesi</span>
            </div>

            {/* Stacked Progress Bar */}
            {sessions.length > 0 ? (
              <>
                <div className="w-full flex h-3 rounded-full overflow-hidden gap-0.5 bg-[#eceef0]">
                  <div className="bg-[#0051d5] h-full" style={{ width: `${Math.round(((areaDist.akademik || 0) / sessions.length) * 100)}%` }} />
                  <div className="bg-[#0c9488] h-full" style={{ width: `${Math.round(((areaDist.karakter || 0) / sessions.length) * 100)}%` }} />
                  <div className="bg-[#3f465c] h-full" style={{ width: `${Math.round(((areaDist.kompetensi || 0) / sessions.length) * 100)}%` }} />
                  <div className="bg-[#565e74] h-full" style={{ width: `${Math.round(((areaDist.kolaborasi || 0) / sessions.length) * 100)}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f7f9fb] border border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0051d5] flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[#191c1e] text-[11px] truncate">Akademik</span>
                      <span className="text-[10px] text-[#45464d]">{areaDist.akademik || 0} sesi ({Math.round(((areaDist.akademik || 0) / sessions.length) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f7f9fb] border border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0c9488] flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[#191c1e] text-[11px] truncate">Karakter &amp; Adab</span>
                      <span className="text-[10px] text-[#45464d]">{areaDist.karakter || 0} sesi ({Math.round(((areaDist.karakter || 0) / sessions.length) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f7f9fb] border border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3f465c] flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[#191c1e] text-[11px] truncate">Kompetensi</span>
                      <span className="text-[10px] text-[#45464d]">{areaDist.kompetensi || 0} sesi ({Math.round(((areaDist.kompetensi || 0) / sessions.length) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f7f9fb] border border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#565e74] flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[#191c1e] text-[11px] truncate">Kolaborasi Mapel</span>
                      <span className="text-[10px] text-[#45464d]">{areaDist.kolaborasi || 0} sesi ({Math.round(((areaDist.kolaborasi || 0) / sessions.length) * 100)}%)</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-[#f7f9fb] text-center text-xs text-[#76777d]">
                Belum ada data sesi pendampingan tercatat untuk visualisasi 4 pilar.
              </div>
            )}
          </div>

          {/* Dual-Tab Monitoring: Per Guru Wali & Per Rombel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#eceef0]">
                <button
                  type="button"
                  onClick={() => setMonitorTab('guru_wali')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    monitorTab === 'guru_wali'
                      ? 'bg-white text-[#0051d5] shadow-xs'
                      : 'text-[#45464d] hover:text-[#191c1e]'
                  }`}
                >
                  Per Guru Wali ({guruSummaries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMonitorTab('rombel')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    monitorTab === 'rombel'
                      ? 'bg-white text-[#0051d5] shadow-xs'
                      : 'text-[#45464d] hover:text-[#191c1e]'
                  }`}
                >
                  Per Rombel / Kelas ({filteredClasses.length})
                </button>
              </div>
            </div>

            {monitorTab === 'guru_wali' ? (
              <div className="space-y-2.5">
                {guruSummaries.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center text-xs text-[#76777d]">
                    Belum ada guru wali terdaftar.
                  </div>
                ) : (
                  guruSummaries.map(gw => {
                    const percent = gw.total_siswa > 0 ? Math.round((gw.siswa_terjangkau / gw.total_siswa) * 100) : 0;
                    return (
                      <div
                        key={gw.guru_wali_id}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#191c1e]">{gw.guru_wali_nama}</span>
                              {gw.total_siswa === 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eceef0] text-[#76777d]">
                                  Belum Ada Siswa
                                </span>
                              ) : gw.status === 'tuntas' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#89f5e7]/40 text-[#0c9488]">
                                  Tuntas 100%
                                </span>
                              ) : gw.status === 'berjalan' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbe1ff] text-[#003ea8]">
                                  Berjalan
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a]">
                                  Perlu Perhatian
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <span className="text-[11px] text-[#45464d]">{gw.email}</span>
                              {gw.daftar_kelas.length > 0 && (
                                <>
                                  <span className="text-[10px] text-[#c6c6cd]">•</span>
                                  <span className="text-[10px] text-[#76777d]">Kelas Binaan:</span>
                                  {gw.daftar_kelas.map(k => (
                                    <span key={k} className="px-1.5 py-0.2 rounded bg-[#eceef0] text-[#191c1e] font-semibold text-[10px]">
                                      {k}
                                    </span>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-bold text-[#191c1e]">{gw.total_sesi} Sesi</span>
                            <p className="text-[10px] text-[#45464d]">{gw.siswa_terjangkau}/{gw.total_siswa} Siswa</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-[#45464d]">
                            <span>Cakupan Siswa Binaan:</span>
                            <span className="font-bold text-[#191c1e]">{percent}%</span>
                          </div>
                          <div className="w-full bg-[#eceef0] rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                percent === 100
                                  ? 'bg-[#0c9488]'
                                  : percent > 75
                                  ? 'bg-[#0051d5]'
                                  : 'bg-[#ba1a1a]'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredClasses.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center text-xs text-[#76777d]">
                    Tidak ada kelas untuk filter ini.
                  </div>
                ) : (
                  filteredClasses.map(cls => {
                    const percent = cls.total_siswa > 0 ? Math.round((cls.siswa_terjangkau / cls.total_siswa) * 100) : 0;
                    return (
                      <div
                        key={cls.kelas}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#191c1e]">Kelas {cls.kelas}</span>
                              {cls.total_siswa === 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eceef0] text-[#76777d]">
                                  Belum Ada Siswa
                                </span>
                              ) : cls.status === 'tuntas' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#89f5e7]/40 text-[#0c9488]">
                                  Tuntas 100%
                                </span>
                              ) : cls.status === 'berjalan' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbe1ff] text-[#003ea8]">
                                  Berjalan
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a]">
                                  Perlu Perhatian
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#45464d] mt-0.5">
                              Total siswa terdaftar: <strong>{cls.total_siswa} Siswa</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-[#191c1e]">{cls.total_sesi} Sesi</span>
                            <p className="text-[10px] text-[#45464d]">{cls.siswa_terjangkau}/{cls.total_siswa} Siswa</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-[#45464d]">
                            <span>Cakupan Siswa di Rombel:</span>
                            <span className="font-bold text-[#191c1e]">{percent}%</span>
                          </div>
                          <div className="w-full bg-[#eceef0] rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                percent === 100
                                  ? 'bg-[#0c9488]'
                                  : percent > 75
                                  ? 'bg-[#0051d5]'
                                  : 'bg-[#ba1a1a]'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Atensi Khusus Section */}
          <div id="atensi-khusus" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">
                  warning
                </span>
                <h3 className="text-sm font-bold text-[#191c1e]">Daftar Siswa Butuh Atensi Khusus</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold">
                {urgentStudents.length} Siswa
              </span>
            </div>

            {urgentStudents.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#f7f9fb] border border-slate-100 flex flex-col items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[28px] text-[#0c9488]">verified</span>
                <p className="text-xs font-bold text-[#191c1e]">Tidak ada siswa butuh atensi khusus</p>
                <p className="text-[11px] text-[#45464d]">Semua siswa binaan terpantau dalam kondisi belajar dan karakter yang baik.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {urgentStudents.map(s => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-[#f7f9fb] border border-slate-100 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#191c1e]">{s.nama}</p>
                      <p className="text-[10px] text-[#45464d]">
                        NISGM: {s.nisn} • {s.kelas}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/siswa/${s.id}`}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#0051d5] hover:bg-[#dbe1ff]/30 transition-colors"
                    >
                      Lihat Jurnal
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Ekspor Data */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#191c1e]">Ekspor Laporan Pendampingan</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-8 h-8 rounded-full bg-[#eceef0] flex items-center justify-center text-[#45464d]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <p className="text-xs text-[#45464d]">
                Pilih format berkas untuk mengunduh rekapitulasi data bimbingan seluruh rombel.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    window.print();
                    setShowExportModal(false);
                  }}
                  className="w-full p-3 rounded-xl bg-[#f7f9fb] hover:bg-[#dbe1ff]/30 border border-slate-200 flex items-center gap-3 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">picture_as_pdf</span>
                  <div>
                    <p className="text-xs font-bold text-[#191c1e]">Dokumen PDF Resmi</p>
                    <p className="text-[10px] text-[#45464d]">Format siap cetak untuk arsip sekolah &amp; yayasan</p>
                  </div>
                </button>

                <button
                  onClick={handleExportXLSX}
                  className="w-full p-3 rounded-xl bg-[#f7f9fb] hover:bg-[#89f5e7]/30 border border-slate-200 flex items-center gap-3 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[#0c9488] text-[24px]">table_view</span>
                  <div>
                    <p className="text-xs font-bold text-[#191c1e]">Lembar Kerja Excel (.xlsx)</p>
                    <p className="text-[10px] text-[#45464d]">Data mentah sesi &amp; metrik untuk analisis lanjutan</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
