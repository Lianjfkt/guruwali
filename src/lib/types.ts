// ============================================================
// Tipe Data Aplikasi Pendampingan Guru Wali - SMP Global Madani
// ============================================================

export type UserRole = 'guru_wali' | 'admin' | 'orang_tua';
export type UserStatus = 'aktif' | 'nonaktif';

export interface User {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  kelas?: string; // untuk guru_wali
  avatar?: string;
}

export interface Student {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
  guru_wali_id: string;
  orang_tua_id?: string;
  foto?: string;
  status_pendampingan: 'stabil' | 'perlu_perhatian' | 'aktif';
}

export type MentoringAreaId = 'akademik' | 'kompetensi' | 'karakter' | 'kolaborasi';

export interface MentoringArea {
  id: MentoringAreaId;
  nama_area: string;
  tujuan: string;
  daftar_kegiatan: string[];
  opsi_tindak_lanjut: string[];
  warna: {
    badge_bg: string;
    badge_text: string;
    dot: string;
  };
}

export interface MentoringSession {
  id: string;
  siswa_id: string;
  dicatat_oleh: string; // user id
  dicatat_oleh_nama: string;
  tanggal: string; // ISO date
  area_id: MentoringAreaId;
  kegiatan: string[];
  kegiatan_tambahan?: string;
  temuan: string;
  tindak_lanjut: string[];
  target_evaluasi?: string;
  dibuat_pada: string; // ISO timestamp
}

export interface ClassSummary {
  kelas: string;
  guru_wali_id: string;
  guru_wali_nama: string;
  total_siswa: number;
  siswa_terjangkau: number;
  total_sesi: number;
  status: 'tuntas' | 'berjalan' | 'perlu_perhatian';
}

export interface SchoolStats {
  total_siswa: number;
  total_sesi: number;
  total_guru: number;
  guru_melapor: number;
  distribusi_area: Record<MentoringAreaId, number>;
}
