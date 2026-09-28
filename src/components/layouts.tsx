'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, getDashboardPath } from '@/lib/auth-context';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

// ===================== GURU WALI NAV =====================
const GURU_WALI_NAV: NavItem[] = [
  { path: '/dashboard', icon: 'dashboard', label: 'Beranda' },
  { path: '/dashboard/siswa', icon: 'group', label: 'Siswa' },
  { path: '/dashboard/catat', icon: 'edit_calendar', label: 'Catat' },
  { path: '/dashboard/panduan', icon: 'menu_book', label: 'Panduan' },
];

// ===================== ADMIN NAV =====================
const ADMIN_NAV: NavItem[] = [
  { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/siswa', icon: 'school', label: 'Data Siswa' },
  { path: '/admin/pengguna', icon: 'manage_accounts', label: 'Pengguna' },
  { path: '/admin/laporan', icon: 'analytics', label: 'Laporan' },
  { path: '/admin/panduan', icon: 'menu_book', label: 'Panduan' },
];

// ===================== NOTIFIKASI SYSTEM =====================
const NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Portal Siap Digunakan',
    desc: 'Tahun Ajaran 2026/2027 aktif. Silakan mulai pencatatan bimbingan perwalian.',
    time: 'Hari ini',
    unread: true,
    link: '/dashboard',
    icon: 'verified',
    iconColor: 'text-[#0c9488]',
    bgColor: 'bg-[#89f5e7]/30',
  },
  {
    id: 'n2',
    title: 'Standar 4 Pilar Pendampingan',
    desc: 'Pedoman bimbingan Akademik, Karakter, Kompetensi & Kolaborasi siap diakses.',
    time: 'Pekan ini',
    unread: false,
    link: '/dashboard/panduan',
    icon: 'menu_book',
    iconColor: 'text-[#0051d5]',
    bgColor: 'bg-[#dbe1ff]/50',
  },
];

function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { nama: string; email?: string; kelas?: string; role?: string };
}) {
  const { logout } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#131b2e] text-white flex items-center justify-center font-bold text-sm">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-[#191c1e] truncate">{currentUser.nama}</h3>
              <p className="text-[11px] text-[#45464d] truncate">{currentUser.email || 'Akun Terdaftar'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#45464d] hover:bg-[#e6e8ea]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Info Peran */}
        <div className="bg-[#f7f9fb] rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-[#45464d]">Peran Aktif:</span>
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#dbe1ff] text-[#003ea8] capitalize">
            {currentUser.kelas ? `Wali ${currentUser.kelas}` : currentUser.role || 'Pengguna'}
          </span>
        </div>

        {/* Tombol Logout */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              logout();
              onClose();
              router.push('/login');
            }}
            className="w-full py-2.5 rounded-xl bg-[#ffdad6] hover:bg-[#ffdad6]/80 text-[#ba1a1a] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== NOTIFICATION MODAL =====================
function NotificationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[20px]">notifications</span>
            <h3 className="font-bold text-sm text-[#191c1e]">Notifikasi &amp; Pengingat</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#45464d] hover:bg-[#e6e8ea]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {NOTIFICATIONS.map(n => (
            <div
              key={n.id}
              onClick={() => {
                onClose();
                router.push(n.link);
              }}
              className="p-3 rounded-2xl bg-[#f7f9fb] hover:bg-[#eceef0] border border-slate-100 cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-start gap-2">
                <span className={`material-symbols-outlined text-[18px] ${n.iconColor} mt-0.5`}>
                  {n.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-[#191c1e] truncate">{n.title}</p>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-[#0051d5] flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#45464d] leading-snug mt-0.5">{n.desc}</p>
                  <span className="text-[10px] text-[#76777d] block mt-1">{n.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#45464d] text-xs font-semibold"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

// ===================== GURU WALI LAYOUT =====================
export function GuruWaliLayout({
  children,
  user,
}: {
  children: ReactNode;
  user: { nama: string; email?: string; kelas?: string; role?: string };
}) {
  const pathname = usePathname();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fb]">
      <UserProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        currentUser={user}
      />
      <NotificationModal
        isOpen={showNotif}
        onClose={() => setShowNotif(false)}
      />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#f7f9fb]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe no-print">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#131b2e] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                school
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-medium text-[#45464d] truncate">SMP Global Madani</span>
              <span className="text-sm font-bold text-[#191c1e] truncate leading-tight">Pendampingan Guru Wali</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotif(true)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[#45464d] hover:bg-[#eceef0] transition-colors"
              title="Notifikasi"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ba1a1a]" />
            </button>

            {/* User Profile Button */}
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-[#eceef0] transition-colors"
              title="Menu Pengguna"
            >
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-[#191c1e] truncate max-w-[120px]">{user.nama}</span>
                <span className="text-[10px] text-[#0051d5] font-medium">{user.kelas || 'Guru Wali'}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#131b2e] flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 pb-20 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-white/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)] no-print">
        <div className="flex justify-around items-center h-16 px-2 max-w-2xl mx-auto">
          {GURU_WALI_NAV.map(item => {
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#0051d5] font-semibold'
                    : 'text-[#45464d] hover:text-[#191c1e]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ===================== ADMIN LAYOUT =====================
export function AdminLayout({
  children,
  user,
}: {
  children: ReactNode;
  user: { nama: string; email?: string; role?: string };
}) {
  const pathname = usePathname();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fb]">
      <UserProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        currentUser={user}
      />
      <NotificationModal
        isOpen={showNotif}
        onClose={() => setShowNotif(false)}
      />

      <header className="fixed top-0 inset-x-0 z-40 bg-[#f7f9fb]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe no-print">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#131b2e] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                school
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#191c1e]">SMP Global Madani</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dbe1ff] text-[#003ea8] font-semibold">
                Admin Sekolah
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotif(true)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[#45464d] hover:bg-[#eceef0] transition-colors"
              title="Notifikasi"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ba1a1a]" />
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="w-8 h-8 rounded-full bg-[#131b2e] flex items-center justify-center text-white"
              title="Profil Admin"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16 pb-20 max-w-2xl mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-white/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)] no-print">
        <div className="flex justify-between items-center h-16 px-2 max-w-2xl mx-auto">
          {ADMIN_NAV.map(item => {
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-12 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#0051d5] font-semibold'
                    : 'text-[#45464d] hover:text-[#191c1e]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
