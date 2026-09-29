# Design Document: Multi-Class Guru Wali (Mentorship Model)

**Date:** 2026-09-29  
**Status:** Approved  
**Author:** Pair Programming Session  

---

## 1. Overview & Context

Di SMP Global Madani, sistem **Guru Wali** berfungsi sebagai mentor dan pembina personal bagi sekelompok siswa binaan (*mentees*), bukan wali kelas administratif (*homeroom teacher*). Konsekuensinya:
1. Seorang Guru Wali tidak terikat pada satu rombongan belajar (rombel/kelas) tunggal.
2. Siswa binaan seorang Guru Wali dapat berasal dari berbagai kelas yang berbeda (lintas kelas, misalnya beberapa siswa dari 7.1, 8.2, dan 9.1 berada di bawah bimbingan Guru Wali yang sama).
3. Seluruh fitur pada aplikasi (Dashboard Guru, Pencatatan, Manajemen Siswa, Panel Admin, Pemantauan, Laporan, dan Portal Orang Tua) harus merefleksikan model pembinaan berbasis siswa binaan lintas kelas ini.

---

## 2. Requirements & Behavior

### 2.1. Model Data & Tipe (`types.ts`, `db.ts`, `data.ts`)
- **Tipe `User`:** Properti `kelas?: string` tidak lagi menjadi penentu kelas siswa binaan dan bersifat opsional.
- **Tipe `Student`:** Siswa tetap memiliki `kelas: string` (kelas asal siswa, e.g. '7.1', '8.2') dan `guru_wali_id: string` (UUID guru wali pembinanya).
- **Tipe Baru `GuruWaliSummary`:**
  ```typescript
  export interface GuruWaliSummary {
    guru_wali_id: string;
    guru_wali_nama: string;
    email: string;
    total_siswa: number;
    siswa_terjangkau: number;
    total_sesi: number;
    daftar_kelas: string[]; // daftar kelas unik dari siswa binaannya (e.g. ['7.1', '8.2'])
    status: 'tuntas' | 'berjalan' | 'perlu_perhatian';
  }
  ```
- **Fungsi Agregasi di `data.ts`:**
  - `computeGuruWaliSummaries(students, sessions, teachers): GuruWaliSummary[]`
  - `computeClassSummaries(students, sessions): ClassSummary[]` (dihitung per rombel siswa 7.1 s/d 9.4)
- **Aturan Kepemilikan Siswa:**
  - Dihapus semua kondisi fallback `s.kelas === user.kelas`.
  - Kepemilikan siswa murni ditentukan oleh `s.guru_wali_id === user.id`.

### 2.2. Portal Guru Wali
- **Header & Layout:**
  - Menghapus teks statis `Wali Kelas {user.kelas}`.
  - Mengganti badge dengan `Guru Wali • TA 2026/2027` dan menampilkan jumlah siswa binaan aktif.
- **Halaman Siswa Binaan (`/dashboard/siswa-binaan`):**
  - Form pendaftaran siswa baru menyediakan input pilihan kelas siswa (dropdown `7.1` sampai `9.4`), bukan otomatis mengunci ke `user.kelas`.
  - Daftar siswa menampilkan badge kelas masing-masing siswa secara jelas.
  - Menambahkan filter cepat berdasarkan jenjang/kelas siswa (Semua, Kelas 7, Kelas 8, Kelas 9).
- **Halaman Daftar Siswa (`/dashboard/siswa` & `/dashboard/siswa/[id]`):**
  - Menampilkan badge kelas untuk masing-masing siswa.
  - Filter pencarian mencakup nama, NISGM, dan kelas.
- **Pencatatan Sesi Pendampingan (`/dashboard/catat`):**
  - Pemilih siswa binaan menampilkan label kelas siswa di samping nama (`[8.1] Muhammad Farhan`).

### 2.3. Panel Admin
- **Dashboard Utama (`/admin`):**
  - Menyediakan 2 tab pemantauan ketercapaian:
    1. **Tab "Per Guru Wali":** Memantau progres setiap Guru Wali terhadap siswa binaannya lintas kelas.
    2. **Tab "Per Kelas / Rombel":** Memantau progres agregat siswa di setiap kelas.
- **Manajemen Pengguna (`/admin/pengguna`):**
  - Form pembuatan akun guru wali tidak lagi mewajibkan pengisian kelas tunggal.
  - Tabel pengguna menampilkan jumlah siswa binaan yang saat ini dibina oleh setiap guru.
- **Manajemen Siswa (`/admin/siswa`):**
  - Admin dapat menetapkan kelas asal siswa dan menugaskan guru wali manapun.
- **Laporan & Ekspor (`/admin/laporan`):**
  - Menyediakan rekapitulasi data baik per Guru Wali maupun per Rombel Kelas untuk diunduh (XLSX/Cetak).

### 2.4. Portal Orang Tua (`/portal-orang-tua`)
- Keterangan profil guru wali disesuaikan menjadi "Guru Wali: {nama_guru_wali}" yang diambil dari data relasi `guru_wali_id`.

---

## 3. Implementation Steps

1. **Update Data Types & Calculation Utilities:**
   - Tambah `GuruWaliSummary` di `src/lib/types.ts`.
   - Update `computeClassSummaries` dan tambah `computeGuruWaliSummaries` di `src/lib/data.ts`.
   - Update `getClassSummaries` dan tambah `getGuruWaliSummaries` di `src/lib/db.ts`.
2. **Refactor Guru Wali Dashboard Pages & Layouts:**
   - Update `src/components/layouts.tsx` (hilangkan teks "Wali Kelas X").
   - Update `src/app/dashboard/page.tsx` (ganti header dan query siswa murni by `guru_wali_id`).
   - Update `src/app/dashboard/siswa-binaan/page.tsx` (dropdown kelas saat tambah siswa, badge kelas, filter jenjang).
   - Update `src/app/dashboard/siswa/page.tsx` & `src/app/dashboard/siswa/[id]/page.tsx`.
   - Update `src/app/dashboard/catat/page.tsx` (badge kelas pada pemilih siswa).
3. **Refactor Admin Panel Pages:**
   - Update `src/app/admin/page.tsx` (tab "Per Guru Wali" & "Per Kelas / Rombel").
   - Update `src/app/admin/pengguna/page.tsx` (hilangkan mandatory kelas pada guru wali, tampilkan counter siswa binaan).
   - Update `src/app/admin/laporan/page.tsx` (dukung ringkasan per Guru Wali & Rombel).
4. **Refactor Portal Orang Tua:**
   - Update `src/app/portal-orang-tua/page.tsx` (tampilkan nama guru wali pembina siswa).
5. **Verifikasi & Testing:**
   - `npm run lint` bebas error.
   - `npm run build` sukses.
