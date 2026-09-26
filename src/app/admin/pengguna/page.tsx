'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdminLayout } from '@/components/layouts';
import { USERS, getInitials } from '@/lib/data';
import { User, UserRole } from '@/lib/types';

export default function AdminPenggunaPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<User[]>(USERS);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newNama, setNewNama] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('guru_wali');
  const [newKelas, setNewKelas] = useState('7.1');

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchSearch =
        u.nama.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' ? true : u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [usersList, search, roleFilter]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama || !newEmail) return;

    const created: User = {
      id: `u-${Date.now()}`,
      nama: newNama,
      email: newEmail,
      role: newRole,
      status: 'aktif',
      kelas: newRole === 'guru_wali' ? newKelas : undefined,
    };

    setUsersList([created, ...usersList]);
    setShowAddModal(false);
    setNewNama('');
    setNewEmail('');
  };

  if (!user) return null;

  return (
    <AdminLayout user={user}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider">
                Manajemen Akses
              </span>
              <h1 className="text-xl font-bold text-[#191c1e]">Pengguna &amp; Peran</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#191c1e] hover:bg-[#131b2e] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Tambah</span>
            </button>
          </div>
          <p className="text-xs text-[#45464d]">
            Kelola akun Guru Wali, Tim Kesiswaan/Admin, dan Orang Tua siswa.
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
          {filteredUsers.map(u => {
            const initials = getInitials(u.nama);
            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3"
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
          })}
        </div>

        {/* Modal Tambah Pengguna */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#191c1e]">Tambah Pengguna Baru</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-[#eceef0] flex items-center justify-center text-[#45464d]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#45464d]">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={newNama}
                    onChange={e => setNewNama(e.target.value)}
                    placeholder="Contoh: Mr. Burhanuddin, S.Pd."
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
                      <option value="7.1">7.1</option>
                      <option value="7.2">7.2</option>
                      <option value="8.1">8.1</option>
                      <option value="8.2">8.2</option>
                      <option value="9.1">9.1</option>
                      <option value="9.2">9.2</option>
                    </select>
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#191c1e] text-white text-xs font-bold hover:bg-[#131b2e] transition-colors"
                  >
                    Simpan Pengguna
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
