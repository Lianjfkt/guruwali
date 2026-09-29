'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AdminLayout } from '@/components/layouts';
import { getInitials } from '@/lib/data';
import { getAllStudents, getAllSessions, getAllGuruWali, addStudent, updateStudent, deleteStudent } from '@/lib/db';
import { Student, MentoringSession, User } from '@/lib/types';

const KELAS_OPTIONS = [
  '7.1', '7.2', '7.3', '7.4',
  '8.1', '8.2', '8.3', '8.4',
  '9.1', '9.2', '9.3', '9.4',
];

export default function AdminSiswaPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [guruWaliList, setGuruWaliList] = useState<User[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add form state
  const [formNama, setFormNama] = useState('');
  const [formNisgm, setFormNisgm] = useState('');
  const [formKelas, setFormKelas] = useState('8.1');
  const [formGuruId, setFormGuruId] = useState('');
  const [formStatus, setFormStatus] = useState<Student['status_pendampingan']>('stabil');

  // Edit state
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editNisn, setEditNisn] = useState('');
  const [editKelas, setEditKelas] = useState('8.1');
  const [editGuruId, setEditGuruId] = useState('');
  const [editStatus, setEditStatus] = useState<Student['status_pendampingan']>('stabil');
  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reloadStudents = useCallback(async () => {
    try {
      setIsDbLoading(true);
      const [studs, sess, gurus] = await Promise.all([
        getAllStudents(),
        getAllSessions(),
        getAllGuruWali(),
      ]);
      setStudents(studs);
      setSessions(sess);
      setGuruWaliList(gurus);
      if (gurus.length > 0 && !formGuruId) {
        setFormGuruId(gurus[0].id);
      }
    } catch {
      // ignore reload error
    } finally {
      setIsDbLoading(false);
    }
  }, [formGuruId]);

  useEffect(() => {
    let ignore = false;
    Promise.all([getAllStudents(), getAllGuruWali()])
      .then(([studs, gurus]) => {
        if (!ignore) {
          setStudents(studs);
          setGuruWaliList(gurus);
          if (gurus.length > 0 && !formGuruId) {
            setFormGuruId(gurus[0].id);
          }
          setIsDbLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setIsDbLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [formGuruId]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchSearch =
        s.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.nisn.includes(search);
      const matchClass =
        classFilter === 'all' ? true : s.kelas.startsWith(classFilter);
      const matchStatus =
        statusFilter === 'all' ? true : s.status_pendampingan === statusFilter;
      return matchSearch && matchClass && matchStatus;
    });
  }, [students, search, classFilter, statusFilter]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formNama.trim() || formNama.trim().length < 3) {
      setFormError('Nama siswa minimal 3 karakter.');
      return;
    }
    if (!formNisgm.trim() || !/^\d{6,12}$/.test(formNisgm.trim())) {
      setFormError('NISGM harus berupa 6–12 digit angka.');
      return;
    }

    if (students.some(s => s.nisn === formNisgm.trim())) {
      setFormError('NISGM ini sudah terdaftar dalam sistem.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newStudent = await addStudent({
        nama: formNama.trim(),
        nisn: formNisgm.trim(),
        kelas: formKelas,
        guru_wali_id: formGuruId || (guruWaliList[0]?.id ?? ''),
        status_pendampingan: formStatus,
      });

      setShowAddModal(false);
      setFormNama('');
      setFormNisgm('');
      await reloadStudents();
      setSuccessMsg(`Siswa "${newStudent.nama}" berhasil ditambahkan.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menambahkan data siswa.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteStudent(deleteTarget.id);
      await reloadStudents();
      setSuccessMsg(`Data siswa "${deleteTarget.nama}" berhasil dihapus.`);
      setTimeout(() => setSuccessMsg(''), 3500);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus siswa.';
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (s: Student) => {
    setEditTarget(s);
    setEditNama(s.nama);
    setEditNisn(s.nisn);
    setEditKelas(s.kelas);
    setEditGuruId(s.guru_wali_id);
    setEditStatus(s.status_pendampingan);
    setEditError('');
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError('');

    if (!editNama.trim() || editNama.trim().length < 3) {
      setEditError('Nama siswa minimal 3 karakter.');
      return;
    }
    if (!editNisn.trim() || !/^\d{6,12}$/.test(editNisn.trim())) {
      setEditError('NISGM harus berupa 6–12 digit angka.');
      return;
    }
    if (students.some(s => s.nisn === editNisn.trim() && s.id !== editTarget.id)) {
      setEditError('NISGM ini sudah digunakan siswa lain.');
      return;
    }

    try {
      setIsEditSubmitting(true);
      await updateStudent(editTarget.id, {
        nama: editNama.trim(),
        nisn: editNisn.trim(),
        kelas: editKelas,
        guru_wali_id: editGuruId,
        status_pendampingan: editStatus,
      });
      setSuccessMsg(`Data siswa "${editNama}" berhasil diperbarui.`);
      setTimeout(() => setSuccessMsg(''), 3500);
      setEditTarget(null);
      await reloadStudents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui data siswa.';
      setEditError(message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <AdminLayout user={user}>
      <div className="p-4 space-y-4">
        {/* Notification toast */}
        {successMsg && (
          <div className="bg-[#89f5e7] text-[#00201d] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider">
                Basis Data Sekolah
              </span>
              <h1 className="text-xl font-bold text-[#191c1e]">Data Siswa Terdaftar</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#dbe1ff] text-[#003ea8] text-xs font-bold">
                {filtered.length} Siswa
              </span>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191c1e] hover:bg-[#131b2e] text-white text-xs font-semibold shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-[#45464d]">
            Kelola data siswa, penetapan kelas, dan alokasi guru wali pembina.
          </p>

          {/* Search */}
          <div className="relative mt-2">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#76777d]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari siswa atau NISGM..."
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f2f4f6] text-xs font-medium text-[#191c1e] placeholder-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 focus:bg-white transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setClassFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                classFilter === 'all' ? 'bg-[#191c1e] text-white' : 'bg-[#eceef0] text-[#45464d]'
              }`}
            >
              Semua Kelas
            </button>
            <button
              onClick={() => setClassFilter('7')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                classFilter === '7' ? 'bg-[#0051d5] text-white' : 'bg-[#eceef0] text-[#45464d]'
              }`}
            >
              Kelas 7
            </button>
            <button
              onClick={() => setClassFilter('8')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                classFilter === '8' ? 'bg-[#0051d5] text-white' : 'bg-[#eceef0] text-[#45464d]'
              }`}
            >
              Kelas 8
            </button>
            <button
              onClick={() => setClassFilter('9')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                classFilter === '9' ? 'bg-[#0051d5] text-white' : 'bg-[#eceef0] text-[#45464d]'
              }`}
            >
              Kelas 9
            </button>
            <div className="w-[1px] h-6 bg-slate-200 self-center mx-1 flex-shrink-0" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-[#191c1e] text-white' : 'bg-[#eceef0] text-[#45464d]'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setStatusFilter('perlu_perhatian')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                statusFilter === 'perlu_perhatian' ? 'bg-[#ba1a1a] text-white' : 'bg-[#eceef0] text-[#ba1a1a]'
              }`}
            >
              Perlu Perhatian
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
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-4xl text-[#76777d]">person_search</span>
              <div>
                <p className="text-sm font-bold text-[#191c1e]">
                  {students.length === 0 ? 'Belum Ada Data Siswa Terdaftar' : 'Tidak Ada Siswa yang Cocok'}
                </p>
                <p className="text-xs text-[#45464d] mt-1 max-w-sm">
                  {students.length === 0
                    ? 'Mulai dengan menambahkan data siswa baru untuk kelas 7, 8, atau 9.'
                    : 'Coba sesuaikan kata kunci pencarian atau filter kelas yang dipilih.'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 px-4 py-2 bg-[#0051d5] text-white text-xs font-semibold rounded-xl hover:bg-[#003ea8] transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Tambah Siswa Pertama</span>
              </button>
            </div>
          ) : (
            filtered.map(student => {
              const studentSessions = sessions.filter(s => s.siswa_id === student.id);
              const guru = guruWaliList.find(u => u.id === student.guru_wali_id);
              const initials = getInitials(student.nama);

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#dbe1ff] text-[#003ea8] font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-[#191c1e] truncate">{student.nama}</span>
                        <span className="text-[11px] text-[#45464d]">
                          NISGM: {student.nisn} • {student.kelas}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {student.status_pendampingan === 'perlu_perhatian' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a]">
                          Atensi Khusus
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#89f5e7]/40 text-[#0c9488]">
                          Aktif
                        </span>
                      )}
                      <button
                        onClick={() => openEdit(student)}
                        className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-[#dbe1ff] hover:text-[#003ea8] text-[#76777d] flex items-center justify-center transition-colors"
                        title="Edit siswa"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(student)}
                        className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-[#ffdad6] hover:text-[#ba1a1a] text-[#76777d] flex items-center justify-center transition-colors"
                        title="Hapus siswa"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#f7f9fb] rounded-xl p-2.5 text-xs text-[#45464d] flex items-center justify-between">
                    <span>Guru Wali: <strong>{guru?.nama || 'Belum Ditugaskan'}</strong></span>
                    <span className="text-[#0051d5] font-semibold">{studentSessions.length} Sesi Tercatat</span>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Link
                      href={`/dashboard/siswa/${student.id}`}
                      className="text-xs font-semibold text-[#0051d5] hover:underline flex items-center gap-1"
                    >
                      <span>Tinjau Riwayat Pendampingan</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Tambah Siswa */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#191c1e]">Tambah Siswa Baru</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#45464d]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {formError && (
                <div className="bg-[#ffdad6] text-[#ba1a1a] text-xs p-2.5 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddStudent} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#45464d] block mb-1">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={e => setFormNama(e.target.value)}
                    placeholder="Contoh: Muhammad Raihan"
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#45464d] block mb-1">NISGM (Nomor Induk Siswa GM)</label>
                  <input
                    type="text"
                    required
                    value={formNisgm}
                    onChange={e => setFormNisgm(e.target.value)}
                    placeholder="Contoh: 00892147"
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#45464d] block mb-1">Kelas</label>
                    <select
                      value={formKelas}
                      onChange={e => setFormKelas(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                    >
                      {KELAS_OPTIONS.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#45464d] block mb-1">Status Awal</label>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as Student['status_pendampingan'])}
                      className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                    >
                      <option value="stabil">Stabil</option>
                      <option value="aktif">Aktif</option>
                      <option value="perlu_perhatian">Perlu Perhatian</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#45464d] block mb-1">Guru Wali Pembina</label>
                  <select
                    value={formGuruId}
                    onChange={e => setFormGuruId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                  >
                    {guruWaliList.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-10 rounded-xl bg-[#eceef0] text-xs font-semibold text-[#45464d]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-10 rounded-xl bg-[#0051d5] text-xs font-semibold text-white hover:bg-[#003ea8] shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Siswa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: Edit Siswa ───────────────────────────────────── */}
        {editTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#191c1e]">Edit Data Siswa</h3>
                  <p className="text-[11px] text-[#76777d]">NISGM: {editTarget.nisn}</p>
                </div>
                <button
                  onClick={() => setEditTarget(null)}
                  className="w-8 h-8 rounded-full bg-[#eceef0] flex items-center justify-center text-[#45464d] hover:bg-[#e0e3e5]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {editError && (
                <div className="bg-[#ffdad6] text-[#ba1a1a] rounded-xl p-3 text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">error</span>
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleEditStudent} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#45464d] block mb-1">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    required
                    value={editNama}
                    onChange={e => setEditNama(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#45464d] block mb-1">NISGM</label>
                  <input
                    type="text"
                    required
                    value={editNisn}
                    onChange={e => setEditNisn(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#45464d] block mb-1">Kelas</label>
                    <select
                      value={editKelas}
                      onChange={e => setEditKelas(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                    >
                      {KELAS_OPTIONS.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#45464d] block mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as Student['status_pendampingan'])}
                      className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                    >
                      <option value="stabil">Stabil</option>
                      <option value="aktif">Aktif</option>
                      <option value="perlu_perhatian">Perlu Perhatian</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#45464d] block mb-1">Guru Wali Pembina</label>
                  <select
                    value={editGuruId}
                    onChange={e => setEditGuruId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                  >
                    {guruWaliList.map(g => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditTarget(null)}
                    className="flex-1 h-10 rounded-xl bg-[#eceef0] text-xs font-semibold text-[#45464d] hover:bg-[#e0e3e5]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="flex-1 h-10 rounded-xl bg-[#0051d5] text-xs font-bold text-white hover:bg-[#003ea8] disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isEditSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[15px]">save</span>
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── DIALOG: Konfirmasi Hapus Siswa ───────────────────────── */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-center shadow-2xl space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px] text-[#ba1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  person_remove
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[#191c1e] text-base">Hapus Data Siswa?</h3>
                <p className="text-xs text-[#45464d] mt-1 leading-relaxed">
                  Data <strong>{deleteTarget.nama}</strong> (NISGM: {deleteTarget.nisn}) beserta seluruh riwayat sesi pendampingan akan dihapus permanen.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#f2f4f6] text-[#191c1e] text-sm font-semibold hover:bg-[#e6e8ea] transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteStudent}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-sm font-bold hover:bg-[#93000a] transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
