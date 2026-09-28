// ============================================================
// Data Statis & Helper Functions - Aplikasi Pendampingan Guru Wali
// SMP Global Madani - TA 2026/2027
//
// Catatan: Fungsi CRUD (students, sessions) telah dipindah ke
// src/lib/db.ts yang menggunakan Supabase async functions.
// File ini hanya berisi data statis dan helper functions.
// ============================================================

import { User, Student, MentoringArea, MentoringSession, ClassSummary } from './types';

// --- PENGGUNA (sementara — akan dihapus setelah auth Supabase aktif) ---
// Digunakan hanya untuk backward compat di portal-orang-tua dan layouts
export const USERS: User[] = [
  {
    id: 'u1',
    nama: 'Mr. Ahmad Fauzi, S.Pd.',
    email: 'ahmad.fauzi@globalsmpmadani.sch.id',
    role: 'guru_wali',
    status: 'aktif',
    kelas: '8.1',
  },
  {
    id: 'u2',
    nama: 'Ms. Fatimah Zahra, S.Pd.',
    email: 'fatimah.zahra@globalsmpmadani.sch.id',
    role: 'guru_wali',
    status: 'aktif',
    kelas: '7.1',
  },
  {
    id: 'u3',
    nama: 'Mr. Rizky Pratama, M.Pd.',
    email: 'rizky.pratama@globalsmpmadani.sch.id',
    role: 'guru_wali',
    status: 'aktif',
    kelas: '8.2',
  },
  {
    id: 'u4',
    nama: 'Ms. Nurul Hidayah, S.Si.',
    email: 'nurul.hidayah@globalsmpmadani.sch.id',
    role: 'guru_wali',
    status: 'aktif',
    kelas: '9.1',
  },
  {
    id: 'u5',
    nama: 'Admin Sekolah',
    email: 'admin@globalsmpmadani.sch.id',
    role: 'admin',
    status: 'aktif',
  },
  {
    id: 'u6',
    nama: 'Bpk. Bambang Irawan',
    email: 'bambang.irawan@gmail.com',
    role: 'orang_tua',
    status: 'aktif',
  },
];

// --- SISWA (kosong — data dikelola via Supabase database) ---
export const STUDENTS: Student[] = [];

// --- AREA PENDAMPINGAN (Standar 4 Pilar Buku Panduan SMP Global Madani) ---
export const MENTORING_AREAS: MentoringArea[] = [
  {
    id: 'akademik',
    nama_area: 'Akademik',
    tujuan: 'Membantu siswa meningkatkan hasil belajar dan mengatasi kesulitan akademik.',
    daftar_kegiatan: [
      'Membahas hasil ulangan/tugas',
      'Mengidentifikasi mata pelajaran yang sulit',
      'Menemukan penyebab kesulitan belajar',
      'Menentukan strategi belajar efektif',
      'Evaluasi hasil formatif/ujian tengah semester',
      'Bimbingan metode & manajemen waktu belajar',
      'Penelusuran hambatan mata pelajaran tertentu',
    ],
    opsi_tindak_lanjut: [
      'Program remedial',
      'Bimbingan belajar tambahan',
      'Target belajar mingguan',
      'Tutor sebaya dengan teman sekelas',
      'Koordinasi dengan guru mata pelajaran',
      'Komunikasi pengawasan belajar ke orang tua',
    ],
    warna: {
      badge_bg: 'bg-secondary-fixed',
      badge_text: 'text-on-secondary-fixed',
      dot: 'bg-secondary-container',
    },
  },
  {
    id: 'kompetensi',
    nama_area: 'Kompetensi & Keterampilan',
    tujuan: 'Mengembangkan minat, bakat, dan potensi siswa.',
    daftar_kegiatan: [
      'Menggali minat dan cita-cita siswa',
      'Mengenalkan kegiatan ekstrakurikuler',
      'Memberi kesempatan mengikuti lomba/proyek',
      'Eksplorasi bakat seni, olahraga, dan teknologi',
      'Identifikasi kekuatan dan area pengembangan siswa',
    ],
    opsi_tindak_lanjut: [
      'Mengikuti ekstrakurikuler',
      'Pelatihan keterampilan tertentu',
      'Persiapan lomba/pameran',
      'Portofolio karya siswa',
      'Didaftarkan ke ekskul relevan',
    ],
    warna: {
      badge_bg: 'bg-primary-fixed',
      badge_text: 'text-on-primary-fixed',
      dot: 'bg-on-primary-fixed-variant',
    },
  },
  {
    id: 'karakter',
    nama_area: 'Karakter',
    tujuan: 'Membentuk karakter positif seperti disiplin, tanggung jawab, dan pengendalian diri.',
    daftar_kegiatan: [
      'Memberi apresiasi perilaku positif',
      'Refleksi perilaku yang perlu diperbaiki',
      'Membantu siswa membuat target karakter',
      'Penguatan kedisiplinan ibadah dan adab',
      'Motivasi kepemimpinan dan tanggung jawab',
    ],
    opsi_tindak_lanjut: [
      'Monitoring perilaku harian',
      'Kartu target karakter',
      'Refleksi mingguan',
      'Pemberian apresiasi sebagai percontohan',
      'Koordinasi dengan pengasuh asrama',
    ],
    warna: {
      badge_bg: 'bg-tertiary-fixed',
      badge_text: 'text-on-tertiary-fixed',
      dot: 'bg-on-tertiary-container',
    },
  },
  {
    id: 'kolaborasi',
    nama_area: 'Komunikasi & Kolaborasi',
    tujuan: 'Memastikan dukungan yang konsisten kepada siswa melalui koordinasi antar pemangku kepentingan.',
    daftar_kegiatan: [
      'Mengumpulkan informasi dari guru mata pelajaran',
      'Mengidentifikasi kesulitan siswa dari perspektif guru lain',
      'Menyusun strategi bersama lintas pengajar',
      'Koordinasi dengan Tim BK sekolah',
      'Pertemuan dengan orang tua/wali siswa',
    ],
    opsi_tindak_lanjut: [
      'Monitoring berkala lintas guru',
      'Evaluasi efektivitas strategi',
      'Tindak lanjut rapat guru',
      'Surat/pesan pemberitahuan ke orang tua',
      'Jadwal pertemuan tindak lanjut',
    ],
    warna: {
      badge_bg: 'bg-surface-container-high',
      badge_text: 'text-on-surface',
      dot: 'bg-surface-tint',
    },
  },
];

// --- SESI (kosong — data dikelola via Supabase database) ---
export const SESSIONS: MentoringSession[] = [];

// --- REKAP KELAS (kosong — dihitung dinamis dari Supabase) ---
export const CLASS_SUMMARIES: ClassSummary[] = [];

// --- HELPER FUNCTIONS (tidak butuh database) ---

export function getMentoringArea(areaId: string): MentoringArea | undefined {
  return MENTORING_AREAS.find(a => a.id === areaId);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} pekan lalu`;
  return formatDateShort(dateStr);
}

export function getAreaDistribution(sessions: MentoringSession[]): Record<string, number> {
  const dist: Record<string, number> = {
    akademik: 0,
    kompetensi: 0,
    karakter: 0,
    kolaborasi: 0,
  };
  sessions.forEach(s => {
    dist[s.area_id] = (dist[s.area_id] || 0) + 1;
  });
  return dist;
}

export function getInitials(nama: string): string {
  return nama
    .split(' ')
    .filter(w => !['Mr.', 'Ms.', 'S.Pd.', 'M.Pd.', 'S.Si.', 'S.T.', 'Bpk.', 'Ibu'].includes(w))
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'SW';
}

/**
 * Hitung rekap kelas secara dinamis dari data yang sudah dimuat
 * (dipakai di admin dashboard setelah data diambil dari Supabase)
 */
export function computeClassSummaries(
  students: import('./types').Student[],
  sessions: MentoringSession[],
  teachers: User[]
): ClassSummary[] {
  return teachers.map(t => {
    const classStudents = students.filter(
      s => s.guru_wali_id === t.id || s.kelas === t.kelas
    );
    const studentIds = new Set(classStudents.map(s => s.id));
    const classSessions = sessions.filter(
      s => studentIds.has(s.siswa_id) || s.dicatat_oleh === t.id
    );
    const coveredStudentIds = new Set(classSessions.map(s => s.siswa_id));
    const totalSiswa = classStudents.length;
    const siswaTerjangkau = totalSiswa > 0
      ? classStudents.filter(s => coveredStudentIds.has(s.id)).length
      : 0;
    const pct = totalSiswa > 0 ? (siswaTerjangkau / totalSiswa) * 100 : 0;

    let status: 'tuntas' | 'berjalan' | 'perlu_perhatian' = 'berjalan';
    if (totalSiswa > 0 && pct === 100) status = 'tuntas';
    else if (totalSiswa > 0 && pct < 50) status = 'perlu_perhatian';

    return {
      kelas: t.kelas || '',
      guru_wali_id: t.id,
      guru_wali_nama: t.nama,
      total_siswa: totalSiswa,
      siswa_terjangkau: siswaTerjangkau,
      total_sesi: classSessions.length,
      status,
    };
  });
}
