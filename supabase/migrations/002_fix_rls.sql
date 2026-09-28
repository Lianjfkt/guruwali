-- ============================================================
-- FIX: Solusi Infinite Recursion RLS Supabase
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- 1. Fungsi helper SECURITY DEFINER untuk mengecek admin tanpa memicu RLS loop
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Perbaiki RLS tabel public.users
DROP POLICY IF EXISTS "admin_read_all_users" ON public.users;
DROP POLICY IF EXISTS "users_read_own" ON public.users;
DROP POLICY IF EXISTS "users_read_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_admin_manage" ON public.users;

-- Semua pengguna terautentikasi dapat membaca data publik pengguna
CREATE POLICY "users_read_authenticated" ON public.users
  FOR SELECT TO authenticated USING (true);

-- Admin dan pengguna itu sendiri dapat memperbarui profil
CREATE POLICY "users_admin_manage" ON public.users
  FOR ALL TO authenticated
  USING (public.is_admin() OR auth.uid() = id)
  WITH CHECK (public.is_admin() OR auth.uid() = id);

-- 3. Perbaiki RLS tabel public.students
DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;

CREATE POLICY "students_select" ON public.students
  FOR SELECT TO authenticated USING (
    guru_wali_id = auth.uid()
    OR orang_tua_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "students_insert" ON public.students
  FOR INSERT TO authenticated WITH CHECK (
    guru_wali_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "students_update" ON public.students
  FOR UPDATE TO authenticated USING (
    guru_wali_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "students_delete" ON public.students
  FOR DELETE TO authenticated USING (
    guru_wali_id = auth.uid() OR public.is_admin()
  );

-- 4. Perbaiki RLS tabel public.mentoring_sessions
DROP POLICY IF EXISTS "sessions_select" ON public.mentoring_sessions;
DROP POLICY IF EXISTS "sessions_insert" ON public.mentoring_sessions;
DROP POLICY IF EXISTS "sessions_update" ON public.mentoring_sessions;
DROP POLICY IF EXISTS "sessions_delete" ON public.mentoring_sessions;

CREATE POLICY "sessions_select" ON public.mentoring_sessions
  FOR SELECT TO authenticated USING (
    dicatat_oleh = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = siswa_id AND s.orang_tua_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "sessions_insert" ON public.mentoring_sessions
  FOR INSERT TO authenticated WITH CHECK (
    dicatat_oleh = auth.uid() OR public.is_admin()
  );

CREATE POLICY "sessions_update" ON public.mentoring_sessions
  FOR UPDATE TO authenticated USING (
    dicatat_oleh = auth.uid() OR public.is_admin()
  );

-- 5. Auto-sync auth.users to public.users via Trigger
-- Sehingga saat akun dibuat, data profil di public.users otomatis terisi tanpa input manual UUID!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nama, email, role, status, kelas)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guru_wali'),
    'aktif',
    NEW.raw_user_meta_data->>'kelas'
  )
  ON CONFLICT (id) DO UPDATE SET
    nama = EXCLUDED.nama,
    role = EXCLUDED.role,
    kelas = EXCLUDED.kelas;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
