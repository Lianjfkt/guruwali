-- ============================================================
-- GURU WALI APP — Database Schema v1.0
-- SMP Global Madani TA 2026/2027
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- Terhubung ke Supabase Auth (auth.users) via FK
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('guru_wali', 'admin', 'orang_tua')),
  status      TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  kelas       TEXT,  -- hanya untuk guru_wali, contoh: '8.1'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: students (siswa binaan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.students (
  id                    TEXT PRIMARY KEY DEFAULT ('s-' || uuid_generate_v4()::text),
  nama                  TEXT NOT NULL,
  nisn                  TEXT NOT NULL UNIQUE,
  kelas                 TEXT NOT NULL,
  guru_wali_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  orang_tua_id          UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status_pendampingan   TEXT NOT NULL DEFAULT 'stabil'
                          CHECK (status_pendampingan IN ('stabil', 'perlu_perhatian', 'aktif')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: mentoring_sessions (sesi pendampingan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mentoring_sessions (
  id                  TEXT PRIMARY KEY DEFAULT ('sess-' || uuid_generate_v4()::text),
  siswa_id            TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  dicatat_oleh        UUID NOT NULL REFERENCES public.users(id),
  dicatat_oleh_nama   TEXT NOT NULL,
  tanggal             DATE NOT NULL,
  area_id             TEXT NOT NULL CHECK (area_id IN ('akademik', 'kompetensi', 'karakter', 'kolaborasi')),
  kegiatan            TEXT[] NOT NULL DEFAULT '{}',
  kegiatan_tambahan   TEXT,
  temuan              TEXT NOT NULL,
  tindak_lanjut       TEXT[] NOT NULL DEFAULT '{}',
  target_evaluasi     TEXT,
  dibuat_pada         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — isolasi data per pengguna
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_sessions ENABLE ROW LEVEL SECURITY;

-- users: baca profil sendiri
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- users: admin baca semua
CREATE POLICY "admin_read_all_users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- students: guru lihat kelasnya, admin lihat semua, orang_tua lihat anaknya
CREATE POLICY "students_select" ON public.students
  FOR SELECT USING (
    guru_wali_id = auth.uid()
    OR orang_tua_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "students_insert" ON public.students
  FOR INSERT WITH CHECK (guru_wali_id = auth.uid());

CREATE POLICY "students_update" ON public.students
  FOR UPDATE USING (
    guru_wali_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "students_delete" ON public.students
  FOR DELETE USING (
    guru_wali_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- sessions: guru lihat yang dicatatnya, orang_tua lihat sesi anak, admin semua
CREATE POLICY "sessions_select" ON public.mentoring_sessions
  FOR SELECT USING (
    dicatat_oleh = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = siswa_id AND s.orang_tua_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "sessions_insert" ON public.mentoring_sessions
  FOR INSERT WITH CHECK (dicatat_oleh = auth.uid());

CREATE POLICY "sessions_update" ON public.mentoring_sessions
  FOR UPDATE USING (dicatat_oleh = auth.uid());

CREATE POLICY "sessions_delete" ON public.mentoring_sessions
  FOR DELETE USING (dicatat_oleh = auth.uid());

-- ============================================================
-- INDEXES untuk performa query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_students_guru_wali  ON public.students(guru_wali_id);
CREATE INDEX IF NOT EXISTS idx_students_kelas       ON public.students(kelas);
CREATE INDEX IF NOT EXISTS idx_sessions_siswa       ON public.mentoring_sessions(siswa_id);
CREATE INDEX IF NOT EXISTS idx_sessions_dicatat     ON public.mentoring_sessions(dicatat_oleh);
CREATE INDEX IF NOT EXISTS idx_sessions_tanggal     ON public.mentoring_sessions(tanggal DESC);

-- ============================================================
-- FUNCTION: auto-update kolom updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
