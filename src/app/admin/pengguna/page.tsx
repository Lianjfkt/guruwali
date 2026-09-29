'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdminLayout } from '@/components/layouts';
import { getInitials } from '@/lib/data';
import { getAllUsers, getAllStudents, updateUser } from '@/lib/db';
import { User, UserRole, UserStatus, Student } from '@/lib/types';

export default function AdminPenggunaPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [search, setSearch] = useState('');

  // Create modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New user form state
  const [newNama, setNewNama] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('guru_wali');

  // Edit modal state
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('guru_wali');
  const [editStatus, setEditStatus] = useState<UserStatus>('aktif');
  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setIsDbLoading(true);
      const [data, studs] = await Promise.all([getAllUsers(), getAllStudents()]);
      setUsersList(data);
      setStudents(studs);
    } catch {
      // ignore
    } finally {
      setIsDbLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([getAllUsers(), getAllStudents()])
      .then(([data, studs]) => {
        if (!ignore) {
          setUsersList(data);
          setStudents(studs);
          setIsDbLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setIsDbLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchSearch =
        u.nama.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' ? true : u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [usersList, search, roleFilter]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // ── CREATE ──────────────────────────────────────────────────────
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newNama.trim() || newNama.trim().length < 3) {
      setFormError('Nama lengkap minimal 3 karakter.');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setFormError('Alamat email tidak valid.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setFormError('Kata sandi awal minimal 6 karakter.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: newNama.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Gagal membuat akun');
      }

      showSuccess(json.message || `Akun ${newNama} berhasil dibuat!`);
      setShowAddModal(false);
      setNewNama('');
      setNewEmail('');
      setNewPassword('');
      await loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat akun.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pwd = 'Gw-';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setShowPassword(true);
  };

  // ── EDIT ────────────────────────────────────────────────────────
  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditNama(u.nama);
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditError('');
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError('');

    if (!editNama.trim() || editNama.trim().length < 3) {
      setEditError('Nama minimal 3 karakter.');
      return;
    }

    try {
      setIsEditSubmitting(true);
      await updateUser(editTarget.id, {
        nama: editNama.trim(),
        role: editRole,
        status: editStatus,
      });
      showSuccess(`Data ${editNama} berhasil diperbarui.`);
      setEditTarget(null);
      await loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui data.';
      setEditError(message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // ── DELETE ──────────────────────────────────────────────────────
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/delete-user?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Gagal menghapus akun');
      showSuccess(`Akun "${deleteTarget.nama}" berhasil dihapus.`);
      setDeleteTarget(null);
      await loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus akun.';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  const roleLabel = (role: UserRole) =>
    role === 'guru_wali' ? 'Guru Wali' : role === 'admin' ? 'Admin Sekolah' : 'Orang Tua';

  const roleBadge = (role: UserRole) =>
    role === 'guru_wali'
      ? 'bg-[#dbe1ff] text-[#003ea8]'
      : role === 'admin'
      ? 'bg-[#89f5e7]/40 text-[#0c9488]'
      : 'bg-[#eceef0] text-[#565e74]';

  return (
    <AdminLayout user={user}>
      <div className="p-4 space-y-4">
        {/* Success Alert Banner */}
        {successMsg && (
          <div className="bg-[#89f5e7] text-[#00201d] px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0c9488]">check_circle</span>
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-[#00201d]/60 hover:text-[#00201d]">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider">
                Manajemen Akses
              </span>
              <h1 className="text-xl font-bold text-[#191c1e]">Pengguna &amp; Akun Guru Wali</h1>
            </div>
            <button
              onClick={() => {
                setShowAddModal(true);
                setFormError('');
                setNewPassword('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191c1e] hover:bg-[#131b2e] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>+ Buat Akun Baru</span>
            </button>
          </div>
          <p className="text-xs text-[#45464d]">
            Kelola akun Guru Wali, Tim Kesiswaan/Admin, dan Orang Tua siswa secara langsung tersinkronisasi ke database.
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
              placeholder="Cari pengguna berdasarkan nama atau surel..."
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f2f4f6] text-xs font-medium text-[#191c1e] placeholder-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 focus:bg-white transition-all"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
            {(['all', 'guru_wali', 'admin', 'orang_tua'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                  roleFilter === r
                    ? r === 'all' ? 'bg-[#191c1e] text-white' : 'bg-[#0051d5] text-white'
                    : 'bg-[#eceef0] text-[#45464d]'
                }`}
              >
                {r === 'all'
                  ? `Semua (${usersList.length})`
                  : `${roleLabel(r as UserRole)} (${usersList.filter(u => u.role === r).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {isDbLoading ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-[#0051d5] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#76777d] mt-2 font-medium">Memuat data pengguna...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-[#76777d]">person_off</span>
              <p className="text-xs font-semibold text-[#191c1e] mt-1">Belum ada akun pengguna terdaftar</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 px-4 py-2 bg-[#0051d5] text-white text-xs font-semibold rounded-xl hover:bg-[#003ea8] transition-colors"
              >
                + Buat Akun Guru Wali
              </button>
            </div>
          ) : (
            filteredUsers.map(u => {
              const initials = getInitials(u.nama);
              const siswaBinaan = students.filter(s => s.guru_wali_id === u.id).length;
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#131b2e] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs text-[#191c1e] truncate">{u.nama}</span>
                      <span className="text-[11px] text-[#45464d] truncate">{u.email}</span>
                      {u.role === 'guru_wali' ? (
                        <span className="text-[10px] text-[#0051d5] font-semibold mt-0.5">
                          {siswaBinaan} Siswa Binaan
                        </span>
                      ) : u.kelas ? (
                        <span className="text-[10px] text-[#0051d5] font-semibold mt-0.5">
                          Kelas: {u.kelas}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${roleBadge(u.role)}`}>
                        {roleLabel(u.role)}
                      </span>
                      <span className={`text-[10px] font-semibold flex items-center gap-1 ${u.status === 'aktif' ? 'text-[#0c9488]' : 'text-[#ba1a1a]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'aktif' ? 'bg-[#0c9488]' : 'bg-[#ba1a1a]'}`} />
                        {u.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => openEdit(u)}
                        title="Edit pengguna"
                        className="w-8 h-8 rounded-full bg-[#f2f4f6] hover:bg-[#dbe1ff] hover:text-[#003ea8] text-[#76777d] flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(u); setDeleteError(''); }}
                        title="Hapus pengguna"
                        className="w-8 h-8 rounded-full bg-[#f2f4f6] hover:bg-[#ffdad6] hover:text-[#ba1a1a] text-[#76777d] flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── MODAL: Buat Akun Baru ─────────────────────────────────── */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#191c1e]">Buat Akun Pengguna</h3>
                  <p className="text-[11px] text-[#76777d]">Daftarkan akun resmi ke Supabase Auth</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-[#eceef0] flex items-center justify-center text-[#45464d] hover:bg-[#e0e3e5]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {formError && (
                <div className="bg-[#ffdad6] text-[#ba1a1a] rounded-xl p-3 text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">error</span>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddUser} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#45464d]">Nama Lengkap &amp; Gelar</label>
                  <input
                    type="text"
                    required
                    value={newNama}
                    onChange={e => setNewNama(e.target.value)}
                    placeholder="Contoh: Mr. Ahmad Fauzi, S.Pd."
                    className="w-full h-10 px-3 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#45464d]">Alamat Surel (Email)</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="nama@globalsmpmadani.sch.id"
                    className="w-full h-10 px-3 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#45464d]">Kata Sandi Awal</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] text-[#0051d5] font-semibold hover:underline"
                    >
                      Acak Sandi
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full h-10 pl-3 pr-10 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d]"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#45464d]">Peran (Role)</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                  >
                    <option value="guru_wali">Guru Wali</option>
                    <option value="admin">Admin Sekolah / Kesiswaan</option>
                    <option value="orang_tua">Orang Tua / Wali Siswa</option>
                  </select>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-[#191c1e] text-white text-xs font-bold hover:bg-[#131b2e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Mendaftarkan ke Supabase...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                        <span>Buat &amp; Aktifkan Akun</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full py-2.5 rounded-xl bg-[#eceef0] text-[#45464d] text-xs font-semibold hover:bg-[#e0e3e5] transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: Edit Pengguna ───────────────────────────────────── */}
        {editTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#191c1e]">Edit Pengguna</h3>
                  <p className="text-[11px] text-[#76777d]">{editTarget.email}</p>
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

              <form onSubmit={handleEditUser} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#45464d]">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editNama}
                    onChange={e => setEditNama(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#45464d]">Peran</label>
                    <select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value as UserRole)}
                      className="w-full h-10 px-3 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                    >
                      <option value="guru_wali">Guru Wali</option>
                      <option value="admin">Admin</option>
                      <option value="orang_tua">Orang Tua</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#45464d]">Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as UserStatus)}
                      className="w-full h-10 px-3 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <p className="text-[10px] text-[#76777d] bg-[#f7f9fb] rounded-xl px-3 py-2">
                  ⚠️ Perubahan email dilakukan melalui Supabase Dashboard langsung.
                </p>

                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[#eceef0] text-[#45464d] text-xs font-semibold hover:bg-[#e0e3e5] transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#0051d5] text-white text-xs font-bold hover:bg-[#003ea8] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isEditSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[15px]">save</span>
                        <span>Simpan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── DIALOG: Hapus Pengguna ─────────────────────────────────── */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-center shadow-2xl space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px] text-[#ba1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  person_remove
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[#191c1e] text-base">Hapus Akun Pengguna?</h3>
                <p className="text-xs text-[#45464d] mt-1 leading-relaxed">
                  Akun <strong>{deleteTarget.nama}</strong> ({deleteTarget.email}) akan dihapus permanen dari Supabase Auth dan database.
                </p>
              </div>

              {deleteError && (
                <div className="bg-[#ffdad6] text-[#ba1a1a] rounded-xl p-3 text-xs text-left flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">error</span>
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#f2f4f6] text-[#191c1e] text-sm font-semibold hover:bg-[#e6e8ea] transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-sm font-bold hover:bg-[#93000a] transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Hapus'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
