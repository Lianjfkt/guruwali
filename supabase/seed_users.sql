-- ============================================================
-- SEED: Pengguna Awal Guru Wali SMP Global Madani
-- ============================================================
-- CARA PENGGUNAAN:
-- 1. Buat dulu semua user di Supabase Dashboard:
--    Authentication → Users → Add User → Create new user
--    (centang "Auto Confirm User")
-- 2. Setelah semua user dibuat, copy UUID-nya dari kolom "id"
--    di Authentication → Users
-- 3. Ganti UUID-xxx di bawah dengan UUID nyata
-- 4. Jalankan SQL ini di SQL Editor Supabase
-- ============================================================

INSERT INTO public.users (id, nama, email, role, status, kelas) VALUES
  -- Guru Wali
  ('UUID-GANTI-AHMAD',   'Mr. Ahmad Fauzi, S.Pd.',    'ahmad.fauzi@globalsmpmadani.sch.id',   'guru_wali', 'aktif', '8.1'),
  ('UUID-GANTI-FATIMAH', 'Ms. Fatimah Zahra, S.Pd.',  'fatimah.zahra@globalsmpmadani.sch.id', 'guru_wali', 'aktif', '7.1'),
  ('UUID-GANTI-RIZKY',   'Mr. Rizky Pratama, M.Pd.',  'rizky.pratama@globalsmpmadani.sch.id', 'guru_wali', 'aktif', '8.2'),
  ('UUID-GANTI-NURUL',   'Ms. Nurul Hidayah, S.Si.',  'nurul.hidayah@globalsmpmadani.sch.id', 'guru_wali', 'aktif', '9.1'),
  -- Admin
  ('UUID-GANTI-ADMIN',   'Admin Sekolah',              'admin@globalsmpmadani.sch.id',          'admin',     'aktif', NULL),
  -- Orang Tua (contoh)
  ('UUID-GANTI-BAMBANG', 'Bpk. Bambang Irawan',        'bambang.irawan@gmail.com',              'orang_tua', 'aktif', NULL)
ON CONFLICT (id) DO NOTHING;

-- Verifikasi setelah insert:
-- SELECT id, nama, role, kelas FROM public.users ORDER BY role, kelas;
