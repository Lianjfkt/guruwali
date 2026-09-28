'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AdminLayout } from '@/components/layouts';
import { getInitials } from '@/lib/data';
import { getAllStudents, getAllSessions, getAllGuruWali, addStudent, deleteStudent } from '@/lib/db';
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

  // Form state
  const [formNama, setFormNama] = useState('');
  const [formNisgm, setFormNisgm] = useState('');
  const [formKelas, setFormKelas] = useState('8.1');
  const [formGuruId, setFormGuruId] = useState('');
  const [formStatus, setFormStatus] = useState<Student['status_pendampingan']>('stabil');

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
    reloadStudents();
  }, [reloadStudents]);

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
    } catch (err: any) {
      setFormError(err.message || 'Gagal menambahkan data siswa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string, nama: string) => {
    if (confirm(`Yakin ingin menghapus siswa "${nama}"?`)) {
      try {
        await deleteStudent(id);
        await reloadStudents();
        setSuccessMsg(`Data siswa "${nama}" berhasil dihapus.`);
        setTimeout(() => setSuccessMsg(''), 3500);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus siswa.');
      }
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
          </div>
        </div>

        {/* Student Cards List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
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
                        onClick={() => handleDeleteStudent(student.id, student.nama)}
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
                        {g.nama} ({g.kelas || 'Guru Wali'})
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
                    className="flex-1 h-10 rounded-xl bg-[#0051d5] text-xs font-semibold text-white hover:bg-[#003ea8] shadow-sm"
                  >
                    Simpan Siswa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
