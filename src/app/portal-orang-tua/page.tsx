'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { formatDate, getInitials } from '@/lib/data';
import { getAllStudents, getSessionsByStudent, getAllUsers } from '@/lib/db';
import { MentoringAreaId, Student, MentoringSession, User } from '@/lib/types';

export default function PortalOrangTuaPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [parentNote, setParentNote] = useState('');
  const [savedNote, setSavedNote] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    const load = async () => {
      try {
        setIsDbLoading(true);
        const [studs, allU] = await Promise.all([
          getAllStudents(),
          getAllUsers(),
        ]);
        if (ignore) return;
        setStudents(studs);
        setUsers(allU);

        const myChild = studs.find(s => s.orang_tua_id === user.id) || studs[0];
        if (myChild) {
          const sess = await getSessionsByStudent(myChild.id);
          if (!ignore) {
            setSessions(sess);
          }
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

  // Siswa binaan untuk orang tua
  const child = useMemo(() => {
    if (!user) return null;
    if (user.role === 'orang_tua') {
      return students.find(s => s.orang_tua_id === user.id) || students[0] || null;
    }
    return students[0] || null;
  }, [user, students]);

  const guruWali = useMemo(() => {
    if (!child) return null;
    return users.find(u => u.id === child.guru_wali_id);
  }, [child, users]);

  const childSessions: MentoringSession[] = sessions;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (isLoading || isDbLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <div className="w-8 h-8 border-3 border-[#0051d5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-sm w-full flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#dbe1ff] text-[#003ea8] flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">family_restroom</span>
          </div>
          <h2 className="text-base font-bold text-[#191c1e]">Akun Belum Tertaut dengan Siswa</h2>
          <p className="text-xs text-[#45464d] leading-relaxed">
            Akun orang tua Bapak/Ibu (<strong>{user.nama}</strong>) belum terhubung dengan data siswa perwalian.
          </p>
          <div className="p-3 bg-[#f2f4f6] rounded-xl text-left text-[11px] text-[#45464d] w-full">
            <p className="font-semibold text-[#191c1e] mb-1">Panduan Tindak Lanjut:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Hubungi Guru Wali atau Admin Sekolah.</li>
              <li>Sampaikan NISGM siswa untuk penautan akun orang tua.</li>
            </ol>
          </div>
          <button
            onClick={logout}
            className="w-full mt-2 py-2.5 rounded-xl bg-[#eceef0] text-[#191c1e] text-xs font-semibold hover:bg-[#e0e3e5] transition-colors"
          >
            Keluar dari Akun
          </button>
        </div>
      </div>
    );
  }

  const initials = getInitials(child.nama);

  const getAreaBadge = (areaId: MentoringAreaId) => {
    switch (areaId) {
      case 'akademik':
        return { bg: 'bg-[#dbe1ff]', text: 'text-[#003ea8]', label: 'Akademik' };
      case 'karakter':
        return { bg: 'bg-[#89f5e7]/40', text: 'text-[#0c9488]', label: 'Karakter & Adab' };
      case 'kompetensi':
        return { bg: 'bg-[#e0e3e5]', text: 'text-[#3f465c]', label: 'Kompetensi' };
      case 'kolaborasi':
        return { bg: 'bg-[#eceef0]', text: 'text-[#565e74]', label: 'Kolaborasi' };
    }
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
      <div className="flex flex-col min-h-screen bg-[#f7f9fb]">
        {/* Floating Toast */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2d3133] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-[#89f5e7] text-[20px]">check_circle</span>
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#131b2e] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-[16px]">school</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#45464d] truncate">SMP Global Madani</span>
                <span className="text-sm font-bold text-[#191c1e] truncate leading-tight">
                  Portal Orang Tua
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#eceef0] hover:bg-[#e0e3e5] text-xs font-semibold text-[#191c1e] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pt-20 pb-12 max-w-2xl mx-auto w-full px-4 space-y-4">
          {/* KOP SURAT RESMI CETAK / PDF */}
          <div className="hidden print:block print-header text-center pb-3 mb-4 border-b-2 border-black">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">Yayasan Pendidikan Global Madani</h3>
            <h1 className="text-base font-black uppercase text-black">SMP Global Madani Bandar Lampung</h1>
            <p className="text-[10px] text-gray-700">Jl. Prof. Dr. Soemantri Brojonegoro No. 1, Gedong Meneng, Rajabasa, Bandar Lampung</p>
            <p className="text-[10px] text-gray-700">Telp: (0721) 787888 • Laman: https://smp.globalmadani.sch.id</p>
            <div className="mt-2 pt-2 border-t border-black text-xs font-bold uppercase">
              Laporan Hasil Pendampingan Guru Wali Untuk Orang Tua
            </div>
          </div>

          {/* Welcome Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-full bg-[#dbe1ff] text-[#003ea8] flex items-center justify-center font-bold text-lg shadow-xs flex-shrink-0">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#0051d5] font-bold uppercase tracking-wider">
                    Siswa Binaan
                  </span>
                  <h1 className="text-lg font-bold text-[#191c1e] truncate">{child.nama}</h1>
                  <p className="text-xs text-[#45464d] flex items-center gap-1.5 mt-0.5">
                    <span>NISGM: {child.nisn}</span>
                    <span>•</span>
                    <span className="bg-[#eceef0] px-1.5 py-0.2 rounded font-semibold text-[11px] text-[#191c1e]">
                      {child.kelas}
                    </span>
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#89f5e7]/40 text-[#0c9488] flex-shrink-0">
                Aktif
              </span>
            </div>

            {/* Info Wali Kelas */}
            <div className="bg-[#f7f9fb] rounded-xl p-3 flex items-center justify-between text-xs border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0051d5] text-[18px]">school</span>
                <div>
                  <p className="text-[10px] text-[#45464d]">Guru Wali Pengampu:</p>
                  <p className="font-bold text-[#191c1e]">{guruWali?.nama || 'Mr. Ahmad Fauzi, S.Pd.'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  window.print();
                  showToast('Menyiapkan lembar riwayat cetak/PDF...');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#191c1e] text-white text-xs font-semibold hover:bg-[#131b2e] transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>

          {/* Sapaan Kemitraan */}
          <div className="bg-[#dbe1ff]/30 rounded-2xl p-4 border border-[#0051d5]/20 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#0051d5] text-[22px] flex-shrink-0 mt-0.5">
              handshake
            </span>
            <div className="text-xs text-[#191c1e] leading-relaxed">
              <strong>Kemitraan Sekolah &amp; Keluarga:</strong> Informasi ini mencatat perkembangan pembinaan akademik, karakter, serta keterampilan ananda secara berkala oleh Guru Wali. Mari bersama mendukung kemajuan ananda.
            </div>
          </div>

          {/* Ringkasan Capaian */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <span className="text-[11px] text-[#45464d]">Total Sesi Bimbingan</span>
              <p className="text-xl font-bold text-[#191c1e] mt-1">{childSessions.length} Sesi</p>
              <p className="text-[10px] text-[#0c9488] font-semibold mt-0.5">Semester Ganjil 2024/2025</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <span className="text-[11px] text-[#45464d]">Evaluasi Terdekat</span>
              <p className="text-sm font-bold text-[#0051d5] mt-1">31 Oktober 2024</p>
              <p className="text-[10px] text-[#45464d] mt-0.5">Pendampingan Belajar Mandiri</p>
            </div>
          </div>

          {/* Konfirmasi & Catatan Kemitraan Orang Tua */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3 no-print">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0c9488] text-[20px]">
                  checklist
                </span>
                <h3 className="text-xs font-bold text-[#191c1e]">Konfirmasi Pendampingan di Rumah</h3>
              </div>
              {isConfirmed ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#89f5e7]/40 text-[#0c9488] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">check</span>
                  Telah Dikonfirmasi
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eceef0] text-[#76777d]">
                  Menunggu Respon
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#45464d] leading-relaxed">
              Bapak/Ibu dapat memberikan konfirmasi serta catatan ringkas mengenai pendampingan belajar ananda di rumah untuk Guru Wali.
            </p>

            {savedNote && (
              <div className="bg-[#f7f9fb] p-3 rounded-xl border border-slate-100 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0051d5] block">
                  Catatan Terkirim:
                </span>
                <p className="text-[#191c1e] italic mt-0.5">&quot;{savedNote}&quot;</p>
              </div>
            )}

            {!savedNote && (
              <div className="space-y-2">
                <textarea
                  value={parentNote}
                  onChange={e => setParentNote(e.target.value)}
                  placeholder="Tuliskan catatan pendampingan ananda di rumah (opsional)..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-[#f7f9fb] border border-slate-200 text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 resize-none"
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmed(true);
                  if (parentNote) setSavedNote(parentNote);
                  showToast('Terima kasih, respon kemitraan Anda telah tersimpan!');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isConfirmed
                    ? 'bg-[#89f5e7]/40 text-[#0c9488]'
                    : 'bg-[#191c1e] text-white hover:bg-[#131b2e]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isConfirmed ? 'check_circle' : 'done_all'}
                </span>
                <span>{isConfirmed ? 'Respon Telah Tersampaikan' : 'Konfirmasi Telah Membaca'}</span>
              </button>
            </div>
          </div>

          {/* Histori Catatan Pendampingan */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[#191c1e]">Riwayat Pendampingan Ananda</h2>

            <div className="space-y-3">
              {childSessions.map(session => {
                const badge = getAreaBadge(session.area_id);
                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        {session.metode && (
                          <span className="text-[10px] text-[#45464d] flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                            <span className="material-symbols-outlined text-[12px] text-[#0051d5]">meeting_room</span>
                            {session.metode}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#45464d] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">event</span>
                        {formatDate(session.tanggal)}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-[#191c1e] leading-snug">
                      {session.kegiatan_tambahan || session.kegiatan[0]}
                    </h3>

                    {/* Temuan Guru Wali */}
                    <div className="bg-[#f7f9fb] p-3 rounded-xl border border-slate-100 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#45464d] block">
                        Catatan Guru Wali:
                      </span>
                      <p className="text-[#191c1e] italic mt-1 leading-relaxed">
                        &quot;{session.temuan}&quot;
                      </p>
                    </div>

                    {/* Rencana Tindak Lanjut */}
                    {session.tindak_lanjut && session.tindak_lanjut.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase text-[#45464d]">
                          Rekomendasi / Kesepakatan:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {session.tindak_lanjut.map((tl, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-[#f2f4f6] text-[11px] font-medium text-[#191c1e] flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[13px] text-[#0c9488]">task_alt</span>
                              {tl}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TANDA TANGAN RESMI CETAK / PDF */}
          <div className="hidden print:flex justify-between items-end mt-12 pt-6 text-xs text-black">
            <div className="text-center">
              <p>Mengetahui,</p>
              <p className="font-semibold">Guru Wali Pembina</p>
              <div className="h-16" />
              <p className="font-bold underline">{guruWali?.nama || 'Mr. Ahmad Fauzi, S.Pd.'}</p>
              <p className="text-[10px]">NIP. 19850914 201001 1 012</p>
            </div>
            <div className="text-center">
              <p>Bandar Lampung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-semibold">Orang Tua / Wali Siswa</p>
              <div className="h-16" />
              <p className="font-bold underline">{user.nama}</p>
              <p className="text-[10px]">Wali Siswa dari {child.nama}</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
