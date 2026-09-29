'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdminLayout } from '@/components/layouts';
import { getInitials } from '@/lib/data';
import { getAllUsers } from '@/lib/db';
import { User, UserRole } from '@/lib/types';

const KELAS_OPTIONS = [
  '7.1', '7.2', '7.3', '7.4',
  '8.1', '8.2', '8.3', '8.4',
  '9.1', '9.2', '9.3', '9.4',
];

export default function AdminPenggunaPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [search, setSearch] = useState('');
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
  const [newKelas, setNewKelas] = useState('7.1');

  const loadUsers = useCallback(async () => {
    try {
      setIsDbLoading(true);
      const data = await getAllUsers();
      setUsersList(data);
    } catch {
      // ignore
    } finally {
      setIsDbLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getAllUsers()
      .then(data => {
        if (!ignore) {
          setUsersList(data);
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
          kelas: newRole === 'guru_wali' ? newKelas : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Gagal membuat akun');
      }

      setSuccessMsg(json.message || `Akun ${newNama} berhasil dibuat!`);
      setShowAddModal(false);
      setNewNama('');
      setNewEmail('');
      setNewPassword('');
      await loadUsers();
      setTimeout(() => setSuccessMsg(''), 5000);
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

  if (!user) return null;

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
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                roleFilter === 'all' ? 'bg-[#191c1e] text-white' : 'bg-[#eceef0] text-[#45464d]'
              }`}
            >
              Semua ({usersList.length})
            </button>
            <button
              onClick={() => setRoleFilter('guru_wali')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                roleFilter === 'guru_wali' ? 'bg-[#0051d5] text-white' : 'bg-[#eceef0] text-[#45464d]'
              }`}
            >
              Guru Wali ({usersList.filter(u => u.role === 'guru_wali').length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                roleFilter === 'admin' ? 'bg-[#0051d5] text-white' : 'bg-[#eceef0] text-[#45464d]'
              }`}
            >
              Admin ({usersList.filter(u => u.role === 'admin').length})
            </button>
            <button
              onClick={() => setRoleFilter('orang_tua')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                roleFilter === 'orang_tua' ? 'bg-[#0051d5] text-white' : 'bg-[#eceef0] text-[#45464d]'
              }`}
            >
              Orang Tua ({usersList.filter(u => u.role === 'orang_tua').length})
            </button>
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
                      {u.kelas && (
                        <span className="text-[10px] text-[#0051d5] font-semibold mt-0.5">
                          Wali Kelas: {u.kelas}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'guru_wali'
                          ? 'bg-[#dbe1ff] text-[#003ea8]'
                          : u.role === 'admin'
                          ? 'bg-[#89f5e7]/40 text-[#0c9488]'
                          : 'bg-[#eceef0] text-[#565e74]'
                      }`}
                    >
                      {u.role === 'guru_wali' ? 'Guru Wali' : u.role === 'admin' ? 'Admin Sekolah' : 'Orang Tua'}
                    </span>
                    <span className="text-[10px] text-[#0c9488] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0c9488]" />
                      Aktif
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Buat Akun Guru / Pengguna */}
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

                {newRole === 'guru_wali' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#45464d]">Alokasi Kelas</label>
                    <select
                      value={newKelas}
                      onChange={e => setNewKelas(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#f7f9fb] text-xs font-medium text-[#191c1e] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30"
                    >
                      {KELAS_OPTIONS.map(k => (
                        <option key={k} value={k}>Kelas {k}</option>
                      ))}
                    </select>
                  </div>
                )}

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
      </div>
    </AdminLayout>
  );
}
