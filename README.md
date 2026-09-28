# Portal Pendampingan Guru Wali — SMP Global Madani

Aplikasi manajemen dan dokumentasi pendampingan siswa berbasis 4 Pilar Pembinaan (Akademik, Kompetensi & Keterampilan, Karakter & Adab, serta Komunikasi & Kolaborasi) untuk SMP Global Madani Tahun Ajaran 2026/2027.

---

## 🚀 Fitur Utama

- **Dashboard Guru Wali:** Ringkasan capaian perwalian, progres bulanan, distribusi 4 pilar, dan jurnal aktivitas terkini.
- **Pencatatan Sesi Fleksibel:** Catat sesi pendampingan untuk satu siswa, beberapa siswa terpilih, atau seluruh siswa binaan sekaligus (sesi grup/kelas).
- **Manajemen Siswa Binaan:** Tambah, edit status (Stabil, Aktif, Perlu Perhatian), dan kelola siswa perwalian langsung dari dashboard guru wali atau admin.
- **Dashboard Eksekutif Admin:** Monitoring ketercapaian seluruh rombel (Kelas 7, 8, 9), deteksi siswa butuh atensi khusus, dan audit kepatuhan.
- **Laporan & Ekspor:** Rekapitulasi per semester/bulan dengan fitur Cetak PDF resmi dan unduh CSV.
- **Portal Orang Tua:** Akses transparan bagi wali murid untuk memantau ringkasan evaluasi, perkembangan karakter, dan memberikan konfirmasi/catatan wali.

---

## 🔑 Autentikasi & Keamanan (Supabase Backend)

Aplikasi ini menggunakan **Supabase Auth** dan **PostgreSQL Database** dengan enkripsi dan Row Level Security (RLS) aktif:

- Password dikelola dan di-hash langsung oleh Supabase Auth.
- Kredensial akun resmi dibagikan secara terpisah oleh pihak sekolah / admin IT melalui saluran aman.
- Tidak ada password atau kredensial sensitif yang disimpan di repositori.

Untuk membuat akun pengguna baru atau mengatur ulang kata sandi, admin dapat mengelolanya langsung melalui **Supabase Dashboard → Authentication → Users**.

---

## 🛠️ Menjalankan Lokal

```bash
# 1. Masuk ke direktori proyek
cd guru-wali-app

# 2. Instal dependensi
npm install

# 3. Jalankan development server
npm run dev

# Buka http://localhost:3000 pada browser
```

---

## 📦 Build Produksi & Deploy Vercel

### 1. Build Lokal
```bash
npm run build
npm run start
```

### 2. Deploy ke Vercel (Rekomendasi)
Aplikasi ini dioptimalkan 100% untuk deployment di [Vercel](https://vercel.com):

1. Unggah folder proyek ini ke repositori **GitHub** / **GitLab**.
2. Buka dashboard [Vercel](https://vercel.com/new) dan klik **Add New Project**.
3. Hubungkan repositori GitHub Anda.
4. Framework Preset akan otomatis terdeteksi sebagai **Next.js**.
5. Klik tombol **Deploy**. Aplikasi akan aktif dalam hitungan detik.

---

## 📂 Struktur Proyek

```
guru-wali-app/
├── src/
│   ├── app/
│   │   ├── admin/                # Panel Eksekutif Admin (Siswa, Pengguna, Laporan)
│   │   ├── dashboard/            # Panel Guru Wali (Beranda, Catat, Siswa Binaan, Detail)
│   │   ├── login/                # Halaman Otentikasi Demo
│   │   ├── portal-orang-tua/     # Portal Transparansi Wali Murid
│   │   └── layout.tsx            # Root layout, fonts, meta tags
│   ├── components/               # Navigasi, Layout Guru & Admin, Modals
│   └── lib/
│       ├── auth-context.tsx      # State otentikasi & session
│       ├── data.ts               # Storage persistence & helpers 4 pilar
│       └── types.ts              # Definisi tipe TypeScript
└── package.json
```
