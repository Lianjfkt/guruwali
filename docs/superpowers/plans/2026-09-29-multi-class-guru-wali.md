# Multi-Class Guru Wali (Mentorship Model) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyesuaikan seluruh fitur aplikasi Guru Wali SMP Global Madani agar mendukung model pembinaan mentor di mana seorang Guru Wali mendampingi beberapa siswa yang berasal dari kelas/rombel yang berbeda (lintas kelas).

**Architecture:** Mengubah relasi kepemilikan siswa agar murni berbasis `s.guru_wali_id === user.id`. Menghapus asumsi statis 1 guru = 1 kelas. Memperkenalkan agregasi performa `computeGuruWaliSummaries` di samping `computeClassSummaries`. Menyediakan antarmuka fleksibel (dropdown pemilihan kelas pada form siswa, badge kelas pada kartu siswa, dan tab pemantauan ganda pada panel admin).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase JS SDK (`@supabase/supabase-js`), XLSX.

## Global Constraints
- Node.js >= 18, Next.js 16.3.6, React 19 — jangan downgrade dependency.
- Pertahankan struktur tabel Supabase yang ada (`students.guru_wali_id` dan `students.kelas` sudah ada di schema).
- Semua operasi async DB tetap menggunakan `src/lib/db.ts`.
- ESLint (`npm run lint`) harus 0 error dan Next.js build (`npm run build`) harus exit code 0.
- Tidak ada teks "Wali Kelas X" pada Guru Wali — gunakan "Guru Wali" dan tampilkan badge kelas pada siswa binaannya.

---

### Task 1: Update Data Types & Agregasi Rekapitulasi

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/db.ts`

**Interfaces:**
- Produces: `GuruWaliSummary` interface
- Produces: `computeGuruWaliSummaries(students: Student[], sessions: MentoringSession[], teachers: User[]): GuruWaliSummary[]`
- Produces: `getGuruWaliSummaries(): Promise<GuruWaliSummary[]>` in `src/lib/db.ts`
- Updates: `computeClassSummaries` to dynamically group by unique student classes

- [ ] **Step 1: Tambahkan tipe `GuruWaliSummary` di `src/lib/types.ts`**

Tambahkan interface:
```typescript
export interface GuruWaliSummary {
  guru_wali_id: string;
  guru_wali_nama: string;
  email: string;
  total_siswa: number;
  siswa_terjangkau: number;
  total_sesi: number;
  daftar_kelas: string[];
  status: 'tuntas' | 'berjalan' | 'perlu_perhatian';
}
```

- [ ] **Step 2: Update `computeClassSummaries` dan buat `computeGuruWaliSummaries` di `src/lib/data.ts`**

Implementasikan:
```typescript
export function computeGuruWaliSummaries(
  students: Student[],
  sessions: MentoringSession[],
  teachers: User[]
): GuruWaliSummary[] {
  const guruList = teachers.filter(t => t.role === 'guru_wali');
  return guruList.map(t => {
    const myStudents = students.filter(s => s.guru_wali_id === t.id);
    const studentIds = new Set(myStudents.map(s => s.id));
    const mySessions = sessions.filter(
      s => s.dicatat_oleh === t.id || studentIds.has(s.siswa_id)
    );
    const coveredIds = new Set(mySessions.map(s => s.siswa_id));
    const totalSiswa = myStudents.length;
    const siswaTerjangkau = totalSiswa > 0
      ? myStudents.filter(s => coveredIds.has(s.id)).length
      : 0;
    const pct = totalSiswa > 0 ? (siswaTerjangkau / totalSiswa) * 100 : 0;

    let status: 'tuntas' | 'berjalan' | 'perlu_perhatian' = 'berjalan';
    if (totalSiswa > 0 && pct === 100) status = 'tuntas';
    else if (totalSiswa > 0 && pct < 50) status = 'perlu_perhatian';

    const uniqueKelas = Array.from(new Set(myStudents.map(s => s.kelas))).sort();

    return {
      guru_wali_id: t.id,
      guru_wali_nama: t.nama,
      email: t.email,
      total_siswa: totalSiswa,
      siswa_terjangkau: siswaTerjangkau,
      total_sesi: mySessions.length,
      daftar_kelas: uniqueKelas,
      status,
    };
  });
}
```

Dan update `computeClassSummaries` agar menghitung berdasarkan daftar kelas yang ada pada siswa (7.1 s/d 9.4), bukan dari `teacher.kelas`.

- [ ] **Step 3: Tambahkan `getGuruWaliSummaries` di `src/lib/db.ts`**

Tambahkan fungsi pembungkus async yang memanggil `computeGuruWaliSummaries`.

- [ ] **Step 4: Commit Task 1**
```bash
git add src/lib/types.ts src/lib/data.ts src/lib/db.ts
git commit -m "feat: add GuruWaliSummary and multi-class calculation utilities"
```

---

### Task 2: Refactor Layout & Beranda Dashboard Guru Wali

**Files:**
- Modify: `src/components/layouts.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Behavior:**
- Di navbar `layouts.tsx`: label guru wali tidak menampilkan `Wali 8.1`, melainkan `Guru Wali`.
- Di `dashboard/page.tsx`:
  - Query siswa binaan menggunakan murni `s.guru_wali_id === user.id`.
  - Header menampilkan `Guru Wali • TA 2026/2027` dan jumlah siswa binaan (`{students.length} Siswa Binaan`).
  - Badge pada kartu ringkasan aktivitas siswa menampilkan NISGM & Kelas asal siswa secara jelas (`NISGM: 123456 • Kelas 8.2`).
  - Jika belum ada siswa, pesan menyatakan: *"Belum ada siswa binaan yang terdaftar untuk Anda. Daftarkan siswa binaan Anda terlebih dahulu untuk memulai pendampingan."* (tanpa teks kelas statis).

- [ ] **Step 1: Update `src/components/layouts.tsx`**
Ganti teks `Wali ${currentUser.kelas}` menjadi `Guru Wali`.

- [ ] **Step 2: Update `src/app/dashboard/page.tsx`**
Hapus `s.kelas === user.kelas` dan sesuaikan header serta copy teks.

- [ ] **Step 3: Commit Task 2**
```bash
git add src/components/layouts.tsx src/app/dashboard/page.tsx
git commit -m "feat: adapt guru wali layout and dashboard home to mentorship model"
```

---

### Task 3: Refactor Manajemen Siswa Binaan Guru Wali

**Files:**
- Modify: `src/app/dashboard/siswa-binaan/page.tsx`
- Modify: `src/app/dashboard/siswa/page.tsx`
- Modify: `src/app/dashboard/siswa/[id]/page.tsx`

**Behavior:**
- Di `/dashboard/siswa-binaan`:
  - Form modal tambah siswa memiliki dropdown input **Kelas Siswa** (`7.1`, `7.2`, ..., `9.4`), default `'7.1'`.
  - Setiap kartu siswa menampilkan badge kelas yang kontras dan jelas (misal: `[7.1]`, `[8.2]`).
  - Tambahkan filter tab/pilihan jenjang kelas siswa (Semua, Kelas 7, Kelas 8, Kelas 9) di samping search input.
- Di `/dashboard/siswa` & `/dashboard/siswa/[id]`:
  - Query siswa binaan murni `s.guru_wali_id === user.id`.
  - Tampilkan badge kelas pada setiap siswa.

- [ ] **Step 1: Update `src/app/dashboard/siswa-binaan/page.tsx`**
Tambahkan dropdown kelas pada form, badge kelas pada baris/kartu siswa, dan filter jenjang.

- [ ] **Step 2: Update `src/app/dashboard/siswa/page.tsx`**
Hapus fallback `s.kelas === user.kelas` dan perbaiki filter kelas.

- [ ] **Step 3: Update `src/app/dashboard/siswa/[id]/page.tsx`**
Pastikan detail siswa menampilkan kelas siswa dengan tepat.

- [ ] **Step 4: Commit Task 3**
```bash
git add src/app/dashboard/siswa-binaan/page.tsx src/app/dashboard/siswa/page.tsx src/app/dashboard/siswa/[id]/page.tsx
git commit -m "feat: enable cross-class student management in guru wali portal"
```

---

### Task 4: Refactor Pemilih Siswa pada Pencatatan Jurnal

**Files:**
- Modify: `src/app/dashboard/catat/page.tsx`

**Behavior:**
- Di `/dashboard/catat`:
  - Saat guru wali memilih siswa binaan yang didampingi (satuan / beberapa / semua), tampilkan badge kelas di samping nama siswa (`Muhammad Farhan • Kelas 8.2`).
  - Menampilkan filter pencarian atau pengelompokan jika siswa berasal dari kelas yang berbeda.

- [ ] **Step 1: Update pemilih siswa di `src/app/dashboard/catat/page.tsx`**
- [ ] **Step 2: Commit Task 4**
```bash
git add src/app/dashboard/catat/page.tsx
git commit -m "feat: show student class badge in mentoring session creation"
```

---

### Task 5: Refactor Panel Admin (Beranda, Pengguna, Siswa, Laporan)

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/pengguna/page.tsx`
- Modify: `src/app/admin/laporan/page.tsx`

**Behavior:**
- Di `/admin` (Beranda Admin):
  - Buat 2 Tab:
    1. **Tab "Per Guru Wali":** Menampilkan kartu performa setiap guru wali (nama guru, daftar kelas siswa binaannya, jumlah binaan, persentase tuntas, total sesi).
    2. **Tab "Per Rombel / Kelas":** Menampilkan ringkasan agregat seluruh siswa per kelas 7.1 s/d 9.4.
- Di `/admin/pengguna`:
  - Form tambah user untuk Guru Wali tidak lagi mewajibkan memilih 1 kelas.
  - Tabel pengguna menampilkan jumlah siswa binaan yang sedang dibina masing-masing guru wali.
- Di `/admin/laporan`:
  - Ekspor dan tabel rekapitulasi menyediakan opsi rekapitulasi "Per Guru Wali" dan "Per Rombel".

- [ ] **Step 1: Update `src/app/admin/page.tsx`**
- [ ] **Step 2: Update `src/app/admin/pengguna/page.tsx`**
- [ ] **Step 3: Update `src/app/admin/laporan/page.tsx`**
- [ ] **Step 4: Commit Task 5**
```bash
git add src/app/admin/page.tsx src/app/admin/pengguna/page.tsx src/app/admin/laporan/page.tsx
git commit -m "feat: add dual-tab monitoring and multi-class support to admin panel"
```

---

### Task 6: Refactor Portal Orang Tua

**Files:**
- Modify: `src/app/portal-orang-tua/page.tsx`

**Behavior:**
- Ambil nama guru wali pembina siswa dari relasi `child.guru_wali_id` dari daftar pengguna.
- Tampilkan "Guru Wali: {nama_guru_wali}" dan kelas anak.

- [ ] **Step 1: Update `src/app/portal-orang-tua/page.tsx`**
- [ ] **Step 2: Commit Task 6**
```bash
git add src/app/portal-orang-tua/page.tsx
git commit -m "feat: adapt parent portal to resolve guru wali dynamically"
```

---

### Task 7: Verifikasi End-to-End & Build

**Files:**
- Seluruh file proyek

- [ ] **Step 1: Jalankan `npm run lint`**
Harus exit code 0 dengan 0 error.

- [ ] **Step 2: Jalankan `npm run build`**
Harus exit code 0 dan seluruh rute berhasil dikompilasi.

- [ ] **Step 3: Push commit ke remote origin**
```bash
git push origin main
```
