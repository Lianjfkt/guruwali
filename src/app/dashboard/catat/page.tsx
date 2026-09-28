'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { GuruWaliLayout } from '@/components/layouts';
import {
  MENTORING_AREAS,
  getMentoringArea,
  getInitials,
} from '@/lib/data';
import { getStudentsByGuruWali, addSession } from '@/lib/db';
import { MentoringAreaId, Student } from '@/lib/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

function CatatSesiContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get('siswa') || '';

  // ── Form State ──────────────────────────────────────────────────────────
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [waktu, setWaktu] = useState<string>('10:15');
  const [metode, setMetode] = useState<string>('Tatap Muka di Ruang Guru Wali / Pojok Konseling');
  const [selectedArea, setSelectedArea] = useState<MentoringAreaId>('akademik');
  const [selectedKegiatan, setSelectedKegiatan] = useState<string[]>([]);
  const [kegiatanTambahan, setKegiatanTambahan] = useState<string>('');
  const [temuan, setTemuan] = useState<string>('');
  const [selectedTindakLanjut, setSelectedTindakLanjut] = useState<string[]>([]);
  const [targetEvaluasi, setTargetEvaluasi] = useState<string>('');
  const [showStudentPicker, setShowStudentPicker] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // ── Load students from database ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const mine = await getStudentsByGuruWali(user.id);
        setAllStudents(mine);
      } catch {
        // ignore load error
      }
    };
    load();
  }, [user]);

  // ── Preset date helper ───────────────────────────────────────────────────
  const setTargetPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setTargetEvaluasi(d.toISOString().split('T')[0]);
  };

  const setTargetPresetEndOfMonth = () => {
    const d = new Date();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setTargetEvaluasi(end.toISOString().split('T')[0]);
  };

  // ── Sync initial student from URL ─────────────────────────────────────
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentIds([initialStudentId]);
    }
  }, [initialStudentId]);

  // ── Current area ──────────────────────────────────────────────────────
  const currentArea = useMemo(() => {
    return getMentoringArea(selectedArea) || MENTORING_AREAS[0];
  }, [selectedArea]);

  // ── When area changes, reset kegiatan / tindak lanjut ────────────────
  useEffect(() => {
    if (currentArea) {
      setSelectedKegiatan(currentArea.daftar_kegiatan.length > 0 ? [currentArea.daftar_kegiatan[0]] : []);
      setSelectedTindakLanjut(currentArea.opsi_tindak_lanjut.length > 0 ? [currentArea.opsi_tindak_lanjut[0]] : []);
    }
  }, [currentArea]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const toggleStudentId = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAllStudents = () => {
    if (selectedStudentIds.length === allStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(allStudents.map(s => s.id));
    }
  };

  const toggleKegiatan = (item: string) => {
    setSelectedKegiatan(prev =>
      prev.includes(item) ? prev.filter(k => k !== item) : [...prev, item]
    );
  };

  const toggleTindakLanjut = (item: string) => {
    setSelectedTindakLanjut(prev =>
      prev.includes(item) ? prev.filter(k => k !== item) : [...prev, item]
    );
  };

  const insertTag = (tag: string) => {
    setTemuan(prev => (prev ? `${prev} [${tag}]` : `[${tag}] `));
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      setFormError('Sesi login telah berakhir. Silakan muat ulang halaman.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setFormError('Pilih minimal satu siswa untuk sesi ini.');
      return;
    }
    if (!temuan.trim() || temuan.trim().length < 10) {
      setFormError('Mohon isi catatan temuan & observasi minimal 10 karakter secara objektif.');
      return;
    }
    if (selectedKegiatan.length === 0 && !kegiatanTambahan.trim()) {
      setFormError('Mohon pilih minimal satu bentuk kegiatan pendampingan.');
      return;
    }

    try {
      setIsSubmitting(true);
      await Promise.all(
        selectedStudentIds.map(siswaId =>
          addSession({
            siswa_id: siswaId,
            dicatat_oleh: user.id,
            dicatat_oleh_nama: user.nama,
            tanggal,
            area_id: selectedArea,
            kegiatan: selectedKegiatan.length > 0 ? selectedKegiatan : ['Pendampingan berkala'],
            kegiatan_tambahan: kegiatanTambahan || undefined,
            temuan: temuan.trim(),
            tindak_lanjut: selectedTindakLanjut,
            target_evaluasi: targetEvaluasi || undefined,
          })
        )
      );
      setShowSuccessModal(true);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan sesi pendampingan ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <div className="w-8 h-8 border-3 border-[#0051d5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allSelected = allStudents.length > 0 && selectedStudentIds.length === allStudents.length;
  const someSelected = selectedStudentIds.length > 0 && selectedStudentIds.length < allStudents.length;
  const selectedStudents = allStudents.filter(s => selectedStudentIds.includes(s.id));

  return (
    <GuruWaliLayout user={user}>
      <div className="p-4 space-y-4 max-w-xl mx-auto">

        {/* ─── Header Card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-[#0051d5]">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              history_edu
            </span>
            <span className="text-[11px] uppercase tracking-wider font-bold">Jurnal Perwalian Digital</span>
          </div>
          <h1 className="text-xl font-bold text-[#191c1e] tracking-tight">Catat Sesi Pendampingan</h1>
          <p className="text-xs text-[#45464d]">
            Isi data interaksi bimbingan siswa secara cepat, objektif, dan terstandar 4 pilar.
          </p>
          <div className="flex items-center gap-1.5 pt-2">
            <div className="h-1.5 w-6 rounded-full bg-[#0051d5]" />
            <div className="h-1.5 w-6 rounded-full bg-[#0051d5]" />
            <div className="h-1.5 w-6 rounded-full bg-[#0051d5]" />
            <div className="h-1.5 w-6 rounded-full bg-[#0051d5]" />
            <div className="h-1.5 w-6 rounded-full bg-[#0051d5]" />
            <span className="text-[11px] text-[#0051d5] font-semibold ml-1">Langkah 1 - 5</span>
          </div>
        </div>

        {/* ─── Student Picker Modal ─────────────────────────────────────── */}
        {showStudentPicker && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-bold text-[#191c1e] text-base">Pilih Siswa Bimbingan</h3>
                  <p className="text-[11px] text-[#45464d] mt-0.5">Bisa pilih lebih dari satu untuk sesi grup</p>
                </div>
                <button
                  onClick={() => setShowStudentPicker(false)}
                  className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#45464d]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Select All toggle */}
              <div className="px-4 py-2.5 border-b border-slate-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={toggleAllStudents}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all border text-xs font-bold ${
                    allSelected
                      ? 'bg-[#131b2e] text-white border-[#131b2e]'
                      : 'bg-[#f7f9fb] text-[#191c1e] border-transparent hover:bg-[#eceef0]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      allSelected ? 'bg-white border-white' : someSelected ? 'bg-[#0051d5] border-[#0051d5]' : 'border-[#c6c6cd]'
                    }`}>
                      {(allSelected || someSelected) && (
                        <span className={`material-symbols-outlined text-[12px] ${allSelected ? 'text-[#131b2e]' : 'text-white'}`}>
                          {allSelected ? 'check' : 'remove'}
                        </span>
                      )}
                    </div>
                    <span>Pilih Semua Siswa Binaan</span>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    allSelected ? 'bg-white/20 text-white' : 'bg-[#e0e3e5] text-[#45464d]'
                  }`}>
                    {allStudents.length} siswa
                  </span>
                </button>
              </div>

              {/* Student list */}
              <div className="space-y-1.5 overflow-y-auto flex-1 p-4">
                {allStudents.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm font-bold text-[#191c1e]">Belum ada siswa binaan</p>
                    <Link
                      href="/dashboard/siswa-binaan"
                      className="text-xs text-[#0051d5] font-semibold mt-1 inline-block"
                    >
                      + Tambah siswa binaan
                    </Link>
                  </div>
                )}
                {allStudents.map(s => {
                  const sInitials = getInitials(s.nama);
                  const isChecked = selectedStudentIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStudentId(s.id)}
                      className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all border ${
                        isChecked
                          ? 'bg-[#dbe1ff]/60 border-[#0051d5]'
                          : 'bg-[#f7f9fb] hover:bg-[#eceef0] border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#dbe1ff] text-[#003ea8] font-bold text-xs flex items-center justify-center">
                          {sInitials}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#191c1e]">{s.nama}</p>
                          <p className="text-[10px] text-[#45464d]">
                            NISGM: {s.nisn} • {s.kelas}
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isChecked ? 'bg-[#0051d5] border-[#0051d5]' : 'border-[#c6c6cd]'
                      }`}>
                        {isChecked && (
                          <span className="material-symbols-outlined text-white text-[12px]">check</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer confirm */}
              <div className="p-4 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowStudentPicker(false)}
                  className="w-full py-3 rounded-xl bg-[#191c1e] text-white text-sm font-bold hover:bg-[#131b2e] transition-colors"
                >
                  {selectedStudentIds.length > 0
                    ? `Konfirmasi ${selectedStudentIds.length} Siswa`
                    : 'Tutup'}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ─── LANGKAH 1: Identitas Siswa & Waktu ──────────────────────── */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#191c1e] text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <h2 className="text-sm font-bold text-[#191c1e]">Identitas Siswa &amp; Waktu</h2>
              </div>
              <span className="text-[11px] text-[#0051d5] bg-[#dbe1ff]/50 px-2 py-0.5 rounded-full font-semibold">
                Wajib Diisi
              </span>
            </div>

            {/* ── Student Selector ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#45464d]">Siswa Terpilih</label>
                {selectedStudentIds.length > 0 && (
                  <span className="text-[10px] font-bold text-[#0051d5] bg-[#dbe1ff]/60 px-2 py-0.5 rounded-full">
                    {selectedStudentIds.length} dipilih
                  </span>
                )}
              </div>

              {/* Selected pills */}
              {selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#f7f9fb] rounded-xl border border-slate-100">
                  {selectedStudents.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center gap-1 bg-[#dbe1ff] text-[#003ea8] rounded-full pl-1 pr-1.5 py-0.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#003ea8] text-white flex items-center justify-center text-[9px] font-bold">
                        {getInitials(s.nama)}
                      </div>
                      <span className="text-[11px] font-semibold">{s.nama.split(' ')[0]}</span>
                      <button
                        type="button"
                        onClick={() => toggleStudentId(s.id)}
                        className="w-4 h-4 rounded-full hover:bg-[#003ea8]/20 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[11px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Picker button */}
              <button
                type="button"
                onClick={() => setShowStudentPicker(true)}
                className="w-full p-3 rounded-xl bg-[#f7f9fb] flex items-center justify-between hover:bg-[#eceef0] transition-colors border border-slate-100"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#0051d5]">group_add</span>
                  <span className="text-xs text-[#45464d] font-medium">
                    {selectedStudentIds.length === 0
                      ? 'Pilih siswa untuk sesi ini...'
                      : 'Ubah pilihan siswa'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Quick: select all chip */}
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); toggleAllStudents(); }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors mr-1 ${
                      allSelected
                        ? 'bg-[#131b2e] text-white border-[#131b2e]'
                        : 'bg-white text-[#0051d5] border-[#0051d5]'
                    }`}
                  >
                    {allSelected ? '✓ Semua' : 'Pilih Semua'}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#45464d]">swap_horiz</span>
                </div>
              </button>

              {/* Manage students link */}
              <Link
                href="/dashboard/siswa-binaan"
                className="flex items-center gap-1.5 text-[11px] text-[#0051d5] font-semibold hover:underline"
              >
                <span className="material-symbols-outlined text-[13px]">manage_accounts</span>
                Kelola daftar siswa binaan
              </Link>
            </div>

            {/* Tanggal & Waktu Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#45464d] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#0051d5]">calendar_today</span>
                  Tanggal Sesi
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#45464d] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#0051d5]">schedule</span>
                  Waktu
                </label>
                <input
                  type="time"
                  value={waktu}
                  onChange={e => setWaktu(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                />
              </div>
            </div>

            {/* Metode & Tempat */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#45464d] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#0051d5]">meeting_room</span>
                Metode &amp; Tempat
              </label>
              <select
                value={metode}
                onChange={e => setMetode(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
              >
                <option value="Tatap Muka di Ruang Guru Wali / Pojok Konseling">
                  Tatap Muka di Ruang Guru Wali / Pojok Konseling
                </option>
                <option value="Tatap Muka di Ruang Kelas (Setelah KBM)">
                  Tatap Muka di Ruang Kelas (Setelah KBM)
                </option>
                <option value="Pendampingan di Asrama / Boarding">
                  Pendampingan di Asrama / Boarding
                </option>
                <option value="Daring / Telepon dengan Wali Siswa">
                  Daring / Telepon dengan Wali Siswa
                </option>
                <option value="Sesi Kelompok (Group Mentoring)">
                  Sesi Kelompok (Group Mentoring)
                </option>
              </select>
            </div>

            {/* Group session info banner */}
            {selectedStudentIds.length > 1 && (
              <div className="flex items-center gap-2 bg-[#dbe1ff]/50 rounded-xl p-3 border border-[#0051d5]/20">
                <span className="material-symbols-outlined text-[16px] text-[#0051d5] flex-shrink-0">group</span>
                <p className="text-[11px] text-[#003ea8] font-medium">
                  Sesi grup akan dicatat secara terpisah untuk <strong>{selectedStudentIds.length} siswa</strong> sekaligus.
                </p>
              </div>
            )}
          </section>

          {/* ─── LANGKAH 2: 4 Area Pendampingan Resmi ────────────────────── */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#191c1e] text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <h2 className="text-sm font-bold text-[#191c1e]">Pilih Pilar Area Bimbingan</h2>
              </div>
              <span className="text-[11px] text-[#45464d]">Pilih salah satu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Area 1: Akademik */}
              <div
                onClick={() => setSelectedArea('akademik')}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 border ${
                  selectedArea === 'akademik'
                    ? 'bg-[#dbe1ff]/40 border-[#0051d5] shadow-xs'
                    : 'bg-[#f7f9fb] border-transparent hover:bg-[#eceef0]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedArea === 'akademik' ? 'bg-[#0051d5] text-white' : 'bg-[#e0e3e5] text-[#45464d]'}`}>
                  <span className="material-symbols-outlined text-[18px]">school</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-xs ${selectedArea === 'akademik' ? 'text-[#0051d5]' : 'text-[#191c1e]'}`}>Akademik</p>
                  <p className="text-[10px] text-[#45464d] truncate">Proses belajar, nilai &amp; tugas</p>
                </div>
                <span className={`material-symbols-outlined text-[18px] ${selectedArea === 'akademik' ? 'text-[#0051d5]' : 'text-[#c6c6cd]'}`}>
                  {selectedArea === 'akademik' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>

              {/* Area 2: Kompetensi */}
              <div
                onClick={() => setSelectedArea('kompetensi')}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 border ${
                  selectedArea === 'kompetensi'
                    ? 'bg-[#eceef0] border-[#3f465c] shadow-xs'
                    : 'bg-[#f7f9fb] border-transparent hover:bg-[#eceef0]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedArea === 'kompetensi' ? 'bg-[#3f465c] text-white' : 'bg-[#e0e3e5] text-[#45464d]'}`}>
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-xs ${selectedArea === 'kompetensi' ? 'text-[#3f465c]' : 'text-[#191c1e]'}`}>Kompetensi</p>
                  <p className="text-[10px] text-[#45464d] truncate">Bakat, minat &amp; keaktifan</p>
                </div>
                <span className={`material-symbols-outlined text-[18px] ${selectedArea === 'kompetensi' ? 'text-[#3f465c]' : 'text-[#c6c6cd]'}`}>
                  {selectedArea === 'kompetensi' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>

              {/* Area 3: Karakter */}
              <div
                onClick={() => setSelectedArea('karakter')}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 border ${
                  selectedArea === 'karakter'
                    ? 'bg-[#89f5e7]/30 border-[#0c9488] shadow-xs'
                    : 'bg-[#f7f9fb] border-transparent hover:bg-[#eceef0]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedArea === 'karakter' ? 'bg-[#0c9488] text-white' : 'bg-[#e0e3e5] text-[#45464d]'}`}>
                  <span className="material-symbols-outlined text-[18px]">emoji_objects</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-xs ${selectedArea === 'karakter' ? 'text-[#0c9488]' : 'text-[#191c1e]'}`}>Karakter</p>
                  <p className="text-[10px] text-[#45464d] truncate">Adab, disiplin &amp; ibadah</p>
                </div>
                <span className={`material-symbols-outlined text-[18px] ${selectedArea === 'karakter' ? 'text-[#0c9488]' : 'text-[#c6c6cd]'}`}>
                  {selectedArea === 'karakter' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>

              {/* Area 4: Kolaborasi */}
              <div
                onClick={() => setSelectedArea('kolaborasi')}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 border ${
                  selectedArea === 'kolaborasi'
                    ? 'bg-[#f2f4f6] border-[#565e74] shadow-xs'
                    : 'bg-[#f7f9fb] border-transparent hover:bg-[#eceef0]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedArea === 'kolaborasi' ? 'bg-[#565e74] text-white' : 'bg-[#e0e3e5] text-[#45464d]'}`}>
                  <span className="material-symbols-outlined text-[18px]">handshake</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-xs ${selectedArea === 'kolaborasi' ? 'text-[#565e74]' : 'text-[#191c1e]'}`}>Kolaborasi</p>
                  <p className="text-[10px] text-[#45464d] truncate">Koordinasi lintas pengajar &amp; BK</p>
                </div>
                <span className={`material-symbols-outlined text-[18px] ${selectedArea === 'kolaborasi' ? 'text-[#565e74]' : 'text-[#c6c6cd]'}`}>
                  {selectedArea === 'kolaborasi' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
            </div>
          </section>

          {/* ─── LANGKAH 3: Bentuk Kegiatan ──────────────────────────────── */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#191c1e] text-white text-xs flex items-center justify-center font-bold">3</span>
                <h2 className="text-sm font-bold text-[#191c1e]">Bentuk Kegiatan Pendampingan</h2>
              </div>
              <span className="text-[11px] font-semibold text-[#0051d5] capitalize">{currentArea.nama_area}</span>
            </div>

            <div className="space-y-1.5">
              {currentArea.daftar_kegiatan.map((item, idx) => {
                const isChecked = selectedKegiatan.includes(item);
                return (
                  <label
                    key={idx}
                    onClick={() => toggleKegiatan(item)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isChecked
                        ? 'bg-[#dbe1ff]/30 border-[#0051d5]/40'
                        : 'bg-[#f7f9fb] border-slate-100 hover:bg-[#eceef0]'
                    }`}
                  >
                    <input type="checkbox" checked={isChecked} readOnly className="mt-0.5 w-4 h-4 rounded text-[#0051d5] accent-[#0051d5]" />
                    <span className="text-xs text-[#191c1e] font-medium leading-relaxed">{item}</span>
                  </label>
                );
              })}
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-[#45464d] flex items-center justify-between">
                <span>Keterangan Tambahan (Topik Spesifik)</span>
                <span className="text-[10px] text-[#76777d]">Opsional</span>
              </label>
              <div className="bg-[#f7f9fb] rounded-xl p-2.5 flex items-center gap-2 border border-slate-100">
                <span className="material-symbols-outlined text-[18px] text-[#76777d]">note_alt</span>
                <input
                  type="text"
                  value={kegiatanTambahan}
                  onChange={e => setKegiatanTambahan(e.target.value)}
                  placeholder="Misal: Pendampingan materi susulan IPA bab Gelombang..."
                  className="w-full bg-transparent text-xs text-[#191c1e] placeholder-[#76777d] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* ─── LANGKAH 4: Temuan & Observasi ───────────────────────────── */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#191c1e] text-white text-xs flex items-center justify-center font-bold">4</span>
                <h2 className="text-sm font-bold text-[#191c1e]">Temuan &amp; Observasi Guru Wali</h2>
              </div>
              <div className="flex items-center gap-1 text-[#0c9488] bg-[#89f5e7]/30 px-2 py-0.5 rounded-full text-[11px] font-bold">
                <span className="material-symbols-outlined text-[13px]">psychology_alt</span>
                Insight
              </div>
            </div>

            <div className="space-y-2">
              <div className="bg-[#f7f9fb] rounded-xl p-3 flex flex-col gap-1 border border-slate-100">
                <div className="flex items-center justify-between text-[#45464d] text-[11px]">
                  <span>Catatan Refleksi Objektif:</span>
                  <span className="text-[#0051d5] font-semibold">{temuan.length} karakter</span>
                </div>
                <textarea
                  value={temuan}
                  onChange={e => setTemuan(e.target.value)}
                  rows={4}
                  placeholder="Deskripsikan sikap siswa, kendala spesifik yang diutarakan, keterbukaan komunikasi, dan catatan kondisi emosional saat sesi berlangsung..."
                  className="w-full bg-transparent text-xs text-[#191c1e] leading-relaxed placeholder-[#76777d] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                <span className="text-[10px] font-medium text-[#76777d] whitespace-nowrap">Sisipkan cepat:</span>
                {['Motivasi tinggi', 'Butuh apresiasi', 'Tampak cemas', 'Perlu bimbingan mandiri'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTag(tag)}
                    className="px-2.5 py-1 rounded-full bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] text-[11px] font-medium transition-colors whitespace-nowrap"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ─── LANGKAH 5: Tindak Lanjut ────────────────────────────────── */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#191c1e] text-white text-xs flex items-center justify-center font-bold">5</span>
                <h2 className="text-sm font-bold text-[#191c1e]">Kesepakatan &amp; Tindak Lanjut</h2>
              </div>
              <span className="material-symbols-outlined text-[#0051d5] text-[20px]">assignment_turned_in</span>
            </div>

            <div className="space-y-1.5">
              {currentArea.opsi_tindak_lanjut.map((item, idx) => {
                const isChecked = selectedTindakLanjut.includes(item);
                return (
                  <label
                    key={idx}
                    onClick={() => toggleTindakLanjut(item)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isChecked
                        ? 'bg-[#dbe1ff]/30 border-[#0051d5]/40'
                        : 'bg-[#f7f9fb] border-slate-100 hover:bg-[#eceef0]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input type="checkbox" checked={isChecked} readOnly className="w-4 h-4 rounded text-[#0051d5] accent-[#0051d5]" />
                      <span className="text-xs text-[#191c1e] font-medium">{item}</span>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-[#0051d5]">task_alt</span>
                  </label>
                );
              })}
            </div>

            <div className="bg-[#f7f9fb] rounded-xl p-3 space-y-2 border border-slate-100">
              <label className="text-xs font-semibold text-[#45464d] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#0051d5]">event_repeat</span>
                  Target Evaluasi Ulang (Follow-up)
                </span>
                <span className="text-[10px] text-[#76777d]">Opsional</span>
              </label>
              <input
                type="date"
                value={targetEvaluasi}
                onChange={e => setTargetEvaluasi(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white text-xs font-medium text-[#191c1e] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
              />
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-[#76777d] whitespace-nowrap">Pilihan cepat:</span>
                <button type="button" onClick={() => setTargetPresetDays(7)} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-[#0051d5] hover:bg-[#dbe1ff]/30 transition-colors whitespace-nowrap">+1 Pekan</button>
                <button type="button" onClick={() => setTargetPresetDays(14)} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-[#0051d5] hover:bg-[#dbe1ff]/30 transition-colors whitespace-nowrap">+2 Pekan</button>
                <button type="button" onClick={setTargetPresetEndOfMonth} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-[#0051d5] hover:bg-[#dbe1ff]/30 transition-colors whitespace-nowrap">Akhir Bulan</button>
                {targetEvaluasi && (
                  <button type="button" onClick={() => setTargetEvaluasi('')} className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors whitespace-nowrap">Hapus</button>
                )}
              </div>
            </div>
          </section>

          {/* Form Error */}
          {formError && (
            <div className="p-3 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Submit & Cancel */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-[#191c1e] hover:bg-[#131b2e] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
              <span>
                {selectedStudentIds.length > 1
                  ? `Simpan Sesi untuk ${selectedStudentIds.length} Siswa`
                  : 'Simpan Catatan Sesi'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full py-3 px-6 rounded-xl bg-[#e6e8ea] hover:bg-[#d8dadc] text-[#191c1e] text-xs font-semibold transition-colors"
            >
              Batal
            </button>
          </div>
        </form>

        {/* ─── Success Modal ────────────────────────────────────────────── */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#89f5e7]/30 text-[#0c9488] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191c1e]">Sesi Berhasil Dicatat!</h3>
                <p className="text-xs text-[#45464d] mt-1">
                  {selectedStudentIds.length > 1
                    ? <>Catatan pendampingan <strong>{selectedStudentIds.length} siswa</strong> pilar <strong>{currentArea.nama_area}</strong> telah tersimpan ke jurnal digital.</>
                    : <>Catatan pendampingan pilar <strong>{currentArea.nama_area}</strong> telah tersimpan ke dalam buku jurnal digital.</>
                  }
                </p>
                {selectedStudentIds.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1 justify-center">
                    {selectedStudents.map(s => (
                      <span key={s.id} className="text-[10px] bg-[#dbe1ff] text-[#003ea8] px-2 py-0.5 rounded-full font-semibold">
                        {s.nama.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {selectedStudentIds.length === 1 && (
                  <button
                    onClick={() => router.push(`/dashboard/siswa/${selectedStudentIds[0]}`)}
                    className="w-full py-3 rounded-xl bg-[#191c1e] text-white text-xs font-bold hover:bg-[#131b2e] transition-colors"
                  >
                    Lihat Riwayat Siswa
                  </button>
                )}
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-2.5 rounded-xl bg-[#f2f4f6] text-[#45464d] text-xs font-semibold hover:bg-[#e6e8ea] transition-colors"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GuruWaliLayout>
  );
}

export default function CatatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
          <div className="w-8 h-8 border-3 border-[#0051d5] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CatatSesiContent />
    </Suspense>
  );
}
