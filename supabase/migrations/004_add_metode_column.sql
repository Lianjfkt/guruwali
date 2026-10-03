-- ============================================================
-- MIGRATION 004: Add metode column to mentoring_sessions
-- Menambahkan kolom metode & tempat pada sesi pendampingan
-- ============================================================
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

ALTER TABLE public.mentoring_sessions 
ADD COLUMN IF NOT EXISTS metode TEXT;

COMMENT ON COLUMN public.mentoring_sessions.metode IS 'Metode dan tempat pelaksanaan sesi pendampingan (tatap muka, bimbingan kelompok, home visit, dll)';
