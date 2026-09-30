-- ============================================================
-- MIGRATION 003: Fix user creation persistence
-- MASALAH: Akun baru dibuat di Auth tapi tidak tersimpan ke public.users
-- PENYEBAB: RLS memblokir INSERT ke public.users dari anon/authenticated
--            dan trigger belum memiliki fallback yang robust
-- ============================================================
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- 1. Pastikan trigger handle_new_user SELALU membuat baris di public.users
--    (override/replace fungsi yang ada, lebih robust)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nama, email, role, status, kelas)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'nama'), ''), SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'guru_wali'),
    'aktif',
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'kelas', '')), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    nama  = EXCLUDED.nama,
    email = EXCLUDED.email,
    role  = EXCLUDED.role,
    kelas = EXCLUDED.kelas;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Pastikan trigger ter-attach ke auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Pastikan RLS public.users memiliki policy INSERT yang benar
--    Policy ini memungkinkan service_role (API server) insert/upsert
DROP POLICY IF EXISTS "users_service_insert" ON public.users;
DROP POLICY IF EXISTS "users_self_insert" ON public.users;

-- Izinkan authenticated user insert baris dengan id mereka sendiri
-- (dibutuhkan saat trigger jalan dengan auth context baru)
CREATE POLICY "users_self_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 4. Verifikasi: pastikan semua user di auth.users punya baris di public.users
--    (backfill untuk akun yang mungkin sudah terbuat tapi tidak tersimpan)
INSERT INTO public.users (id, nama, email, role, status)
SELECT
  au.id,
  COALESCE(NULLIF(au.raw_user_meta_data->>'nama', ''), SPLIT_PART(au.email, '@', 1)) AS nama,
  au.email,
  COALESCE(NULLIF(au.raw_user_meta_data->>'role', ''), 'guru_wali') AS role,
  'aktif' AS status
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 5. Tampilkan hasil verifikasi
SELECT
  pu.id,
  pu.nama,
  pu.email,
  pu.role,
  pu.status,
  pu.created_at
FROM public.users pu
ORDER BY pu.created_at DESC
LIMIT 20;
