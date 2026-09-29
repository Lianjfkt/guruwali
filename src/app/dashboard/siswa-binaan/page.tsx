'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { GuruWaliLayout } from '@/components/layouts';
import { getInitials } from '@/lib/data';
import { getStudentsByGuruWali, addStudent, deleteStudent } from '@/lib/db';
import { Student } from '@/lib/types';

const STATUS_LABELS: Record<string, string> = {
  stabil: 'Stabil',
  perlu_perhatian: 'Perlu Perhatian',
  aktif: 'Aktif',
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  stabil: { bg: '#dcfce7', text: '#15803d' },
  perlu_perhatian: { bg: '#fef9c3', text: '#a16207' },
  aktif: { bg: '#dbe1ff', text: '#003ea8' },
};

const EMPTY_FORM = {
  nama: '',
  nisn: '',
  status_pendampingan: 'stabil' as Student['status_pendampingan'],
};

export default function SiswaBinaanPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const reload = useCallback(async () => {
    if (!user) return;
    try {
      setIsDbLoading(true);
      const data = await getStudentsByGuruWali(user.id);
      setStudents(data);
    } catch {
      // ignore reload error
    } finally {
      setIsDbLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) { router.replace('/login'); return; }
    if (!isLoading && user?.role !== 'guru_wali') { router.replace('/admin'); return; }
    if (!user) return;

    let ignore = false;
    getStudentsByGuruWali(user.id)
      .then(data => {
        if (!ignore) {
          setStudents(data);
          setIsDbLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setIsDbLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [user, isLoading, router]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.nama.trim() || form.nama.trim().length < 3) {
      setFormError('Nama siswa minimal 3 karakter.');
      return;
    }
    if (!form.nisn.trim() || !/^\d{8,10}$/.test(form.nisn.trim())) {
      setFormError('NISGM harus berupa 8–10 digit angka.');
      return;
    }

    // Check duplicate NISGM
    if (students.some(s => s.nisn === form.nisn.trim())) {
      setFormError('NISGM sudah terdaftar dalam sistem.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newStudent = await addStudent({
        nama: form.nama.trim(),
        nisn: form.nisn.trim(),
        kelas: user?.kelas || '',
        guru_wali_id: user?.id || '',
        status_pendampingan: form.status_pendampingan,
      });

      setShowAddModal(false);
      setForm(EMPTY_FORM);
      await reload();
      setSuccessMsg(`Siswa "${newStudent.nama}" berhasil ditambahkan ke database.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan data siswa.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    try {
      await deleteStudent(studentId);
      setDeleteConfirmId(null);
      await reload();
      setSuccessMsg('Siswa berhasil dihapus dari database.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus siswa.';
      alert(message);
    }
  };

  const filtered = students.filter(s =>
    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nisn.includes(searchQuery)
  );

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <div className="w-8 h-8 border-3 border-[#0051d5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <GuruWaliLayout user={user}>
      <div className="p-4 space-y-4 max-w-xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#dbe1ff]/40 pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-[#89f5e7]/20 pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <Link href="/dashboard" className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#45464d] hover:bg-[#e6e8ea] transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </Link>
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#0051d5] bg-[#dbe1ff]/60 px-2.5 py-0.5 rounded-full">
              Manajemen Siswa
            </span>
          </div>
          <div className="mt-3 relative z-10">
            <h1 className="text-xl font-bold text-[#191c1e] tracking-tight">Siswa Binaan</h1>
            <p className="text-xs text-[#45464d] mt-0.5">
              Kelola daftar siswa perwalian kelas <strong>{user.kelas}</strong>. Tambah atau hapus siswa sesuai kebutuhan.
            </p>
          </div>
          {/* Stats chips */}
          <div className="flex items-center gap-2 mt-3 relative z-10">
            <div className="flex items-center gap-1.5 bg-[#f2f4f6] rounded-full px-3 py-1.5">
              <span className="material-symbols-outlined text-[14px] text-[#0051d5]">group</span>
              <span className="text-xs font-bold text-[#191c1e]">{students.length} siswa</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#fef9c3] rounded-full px-3 py-1.5">
              <span className="material-symbols-outlined text-[14px] text-[#a16207]">warning</span>
              <span className="text-xs font-bold text-[#a16207]">
                {students.filter(s => s.status_pendampingan === 'perlu_perhatian').length} perlu perhatian
              </span>
            </div>
          </div>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-[#dcfce7] text-[#15803d] text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[#76777d]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau NISGM..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white text-xs text-[#191c1e] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 shadow-sm"
            />
          </div>
          {/* Add Button */}
          <button
            onClick={() => { setShowAddModal(true); setForm(EMPTY_FORM); setFormError(''); }}
            className="h-10 px-4 rounded-xl bg-[#191c1e] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#131b2e] transition-colors shadow-sm flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Tambah
          </button>
        </div>

        {/* Student List */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#f2f4f6] flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[28px] text-[#76777d]">search_off</span>
              </div>
              <p className="text-sm font-bold text-[#191c1e]">
                {searchQuery ? 'Siswa tidak ditemukan' : 'Belum ada siswa binaan'}
              </p>
              <p className="text-xs text-[#45464d] mt-1">
                {searchQuery ? 'Coba kata kunci lain.' : 'Klik tombol "Tambah" untuk menambah siswa ke daftar.'}
              </p>
            </div>
          )}

          {filtered.map(s => {
            const initials = getInitials(s.nama);
            const statusColor = STATUS_COLORS[s.status_pendampingan] || STATUS_COLORS.stabil;
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#dbe1ff] text-[#003ea8] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  {/* Info */}
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[#191c1e] truncate">{s.nama}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[#45464d]">NISGM: {s.nisn}</span>
                      <span className="text-[10px] text-[#c6c6cd]">•</span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                      >
                        {STATUS_LABELS[s.status_pendampingan]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link
                    href={`/dashboard/siswa/${s.id}`}
                    className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#45464d] hover:bg-[#e6e8ea] transition-colors"
                    title="Lihat profil"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </Link>
                  <button
                    onClick={() => setDeleteConfirmId(s.id)}
                    className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] hover:bg-[#ffb4ab] transition-colors"
                    title="Hapus dari daftar"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info footer */}
        <div className="bg-[#f2f4f6] rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#76777d] flex-shrink-0 mt-0.5">info</span>
          <p className="text-[11px] text-[#45464d] leading-relaxed">
            Data siswa binaan terhubung langsung dengan pencatatan jurnal pendampingan 4 pilar kelas <strong>{user.kelas}</strong>.
          </p>
        </div>
      </div>

      {/* ── ADD STUDENT MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#191c1e] text-base">Tambah Siswa Binaan</h3>
                <p className="text-xs text-[#45464d] mt-0.5">Isi data siswa baru untuk kelas {user.kelas}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#45464d] hover:bg-[#e6e8ea] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#45464d] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#0051d5]">person</span>
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                  placeholder="Contoh: Muhammad Firdaus"
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f9fb] text-sm text-[#191c1e] border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 placeholder-[#76777d]"
                  autoFocus
                />
              </div>

              {/* NISGM */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#45464d] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#0051d5]">badge</span>
                  NISGM (8–10 digit)
                </label>
                <input
                  type="text"
                  value={form.nisn}
                  onChange={e => setForm(f => ({ ...f, nisn: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="Contoh: 0012345678"
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f9fb] text-sm text-[#191c1e] border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 placeholder-[#76777d]"
                  inputMode="numeric"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#45464d] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#0051d5]">flag</span>
                  Status Pendampingan Awal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['stabil', 'perlu_perhatian', 'aktif'] as Student['status_pendampingan'][]).map(st => {
                    const color = STATUS_COLORS[st];
                    const isActive = form.status_pendampingan === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, status_pendampingan: st }))}
                        className="py-2 px-2 rounded-xl text-[11px] font-semibold border transition-all"
                        style={{
                          backgroundColor: isActive ? color.bg : '#f7f9fb',
                          color: isActive ? color.text : '#45464d',
                          borderColor: isActive ? color.text + '40' : 'transparent',
                          boxShadow: isActive ? `0 0 0 1px ${color.text}30` : 'none',
                        }}
                      >
                        {STATUS_LABELS[st]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kelas (read-only from user) */}
              <div className="bg-[#f7f9fb] rounded-xl p-3 flex items-center gap-2 border border-slate-100">
                <span className="material-symbols-outlined text-[16px] text-[#76777d]">school</span>
                <div>
                  <p className="text-[10px] text-[#76777d]">Kelas Perwalian</p>
                  <p className="text-xs font-bold text-[#191c1e]">{user.kelas}</p>
                </div>
              </div>

              {/* Error */}
              {formError && (
                <div className="p-3 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#f2f4f6] text-[#191c1e] text-sm font-semibold hover:bg-[#e6e8ea] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 min-w-0 flex-grow py-3 rounded-xl bg-[#191c1e] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#131b2e] transition-colors shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                  Tambah Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM DIALOG ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px] text-[#ba1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>
                person_remove
              </span>
            </div>
            <div>
              <h3 className="font-bold text-[#191c1e] text-base">Hapus Siswa?</h3>
              <p className="text-xs text-[#45464d] mt-1">
                Siswa akan dihapus dari daftar binaan. Data sesi pendampingan yang sudah tercatat tidak akan terhapus.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#f2f4f6] text-[#191c1e] text-sm font-semibold hover:bg-[#e6e8ea] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-sm font-bold hover:bg-[#93000a] transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </GuruWaliLayout>
  );
}
