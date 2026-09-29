// src/lib/db.ts
// ============================================================
// Semua operasi database async via Supabase
// Menggantikan fungsi localStorage dari data.ts
// ============================================================

import { supabase } from './supabase';
import type { User, Student, MentoringSession } from './types';

// ── STUDENTS ───────────────────────────────────────────────────────────────

/**
 * Ambil semua siswa binaan milik satu guru wali (by UUID)
 */
export async function getStudentsByGuruWali(guruWaliId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('guru_wali_id', guruWaliId)
    .order('nama', { ascending: true });

  if (error) throw new Error(`getStudentsByGuruWali: ${error.message}`);
  return (data || []) as Student[];
}

/**
 * Ambil semua siswa (untuk admin)
 */
export async function getAllStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('kelas', { ascending: true });

  if (error) throw new Error(`getAllStudents: ${error.message}`);
  return (data || []) as Student[];
}

/**
 * Tambah siswa baru — id di-generate otomatis oleh database
 */
export async function addStudent(
  student: Omit<Student, 'id'>
): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert([student])
    .select()
    .single();

  if (error) throw new Error(`addStudent: ${error.message}`);
  return data as Student;
}

/**
 * Update status pendampingan siswa
 */
export async function updateStudentStatus(
  id: string,
  status: Student['status_pendampingan']
): Promise<void> {
  const { error } = await supabase
    .from('students')
    .update({ status_pendampingan: status })
    .eq('id', id);

  if (error) throw new Error(`updateStudentStatus: ${error.message}`);
}

/**
 * Update data lengkap siswa
 */
export async function updateStudent(
  id: string,
  data: Partial<Omit<Student, 'id'>>
): Promise<Student> {
  const { data: updated, error } = await supabase
    .from('students')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`updateStudent: ${error.message}`);
  return updated as Student;
}

/**
 * Hapus siswa (cascade: semua sesi siswa ini juga terhapus)
 */
export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`deleteStudent: ${error.message}`);
}

// ── SESSIONS ───────────────────────────────────────────────────────────────

/**
 * Ambil semua sesi pendampingan untuk satu siswa
 */
export async function getSessionsByStudent(studentId: string): Promise<MentoringSession[]> {
  const { data, error } = await supabase
    .from('mentoring_sessions')
    .select('*')
    .eq('siswa_id', studentId)
    .order('tanggal', { ascending: false });

  if (error) throw new Error(`getSessionsByStudent: ${error.message}`);
  return (data || []) as MentoringSession[];
}

/**
 * Ambil semua sesi yang dicatat oleh satu guru wali
 */
export async function getSessionsByGuruWali(guruWaliId: string): Promise<MentoringSession[]> {
  const { data, error } = await supabase
    .from('mentoring_sessions')
    .select('*')
    .eq('dicatat_oleh', guruWaliId)
    .order('tanggal', { ascending: false });

  if (error) throw new Error(`getSessionsByGuruWali: ${error.message}`);
  return (data || []) as MentoringSession[];
}

/**
 * Ambil semua sesi (untuk admin)
 */
export async function getAllSessions(): Promise<MentoringSession[]> {
  const { data, error } = await supabase
    .from('mentoring_sessions')
    .select('*')
    .order('tanggal', { ascending: false });

  if (error) throw new Error(`getAllSessions: ${error.message}`);
  return (data || []) as MentoringSession[];
}

/**
 * Tambah sesi pendampingan baru
 */
export async function addSession(
  session: Omit<MentoringSession, 'id' | 'dibuat_pada'>
): Promise<MentoringSession> {
  const payload = {
    ...session,
    dibuat_pada: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('mentoring_sessions')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(`addSession: ${error.message}`);
  return data as MentoringSession;
}

// ── USERS ──────────────────────────────────────────────────────────────────

/**
 * Ambil profil user berdasarkan UUID (dari Supabase Auth)
 */
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as User;
}

/**
 * Ambil semua guru wali yang aktif
 */
export async function getAllGuruWali(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'guru_wali')
    .eq('status', 'aktif')
    .order('kelas', { ascending: true });

  if (error) throw new Error(`getAllGuruWali: ${error.message}`);
  return (data || []) as User[];
}

/**
 * Ambil semua pengguna (untuk halaman admin/pengguna)
 */
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('role', { ascending: true });

  if (error) throw new Error(`getAllUsers: ${error.message}`);
  return (data || []) as User[];
}

/**
 * Update profil pengguna di public.users (nama, role, status)
 * Catatan: perubahan email dilakukan via Supabase Auth (butuh service_role)
 */
export async function updateUser(
  id: string,
  data: Partial<Pick<User, 'nama' | 'role' | 'status'>>
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update(data)
    .eq('id', id);

  if (error) throw new Error(`updateUser: ${error.message}`);
}

import { computeClassSummaries, computeGuruWaliSummaries } from './data';
import type { ClassSummary, GuruWaliSummary } from './types';

export async function getClassSummaries(): Promise<ClassSummary[]> {
  const [students, sessions] = await Promise.all([
    getAllStudents(),
    getAllSessions(),
  ]);
  return computeClassSummaries(students, sessions);
}

export async function getGuruWaliSummaries(): Promise<GuruWaliSummary[]> {
  const [students, sessions, teachers] = await Promise.all([
    getAllStudents(),
    getAllSessions(),
    getAllGuruWali(),
  ]);
  return computeGuruWaliSummaries(students, sessions, teachers);
}
