# Supabase Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti sistem mock (localStorage + hardcoded credentials) dengan Supabase sebagai backend nyata — autentikasi aman, database tersinkronisasi antar pengguna, dan ekspor data nyata.

**Architecture:** Supabase menyediakan PostgreSQL database dan Auth built-in. Layer data (`src/lib/data.ts`) akan diganti dengan fungsi async yang memanggil Supabase client. Auth context (`src/lib/auth-context.tsx`) akan menggunakan Supabase Auth, bukan mock credentials. Semua page component akan menggunakan async/await dan loading state yang ada.

**Tech Stack:** Next.js 16 App Router · Supabase JS SDK (`@supabase/supabase-js`) · Supabase Auth (email+password) · PostgreSQL (via Supabase) · `xlsx` library untuk ekspor

## Global Constraints

- Node.js >= 18, Next.js 16.3.6, React 19 — jangan downgrade
- Pertahankan semua TypeScript types yang ada di `src/lib/types.ts` — hanya tambah, jangan ubah nama property
- Semua UI component tetap sama — tidak ada perubahan visual/styling
- Nama kolom database menggunakan `snake_case` yang sama dengan TypeScript interface
- Environment variables wajib prefix `NEXT_PUBLIC_` untuk client-side
- `src/lib/data.ts` tetap menyediakan fungsi helper non-async (MENTORING_AREAS, formatDate, dll)
- Supabase project region: pilih Asia (Singapore) — ap-southeast-1 untuk latensi minimal

---

## File Map

| File | Aksi | Tanggung Jawab |
|---|---|---|
| `.env.local` | Buat baru | Supabase URL + anon key |
| `src/lib/supabase.ts` | Buat baru | Supabase client singleton |
| `src/lib/db.ts` | Buat baru | Semua fungsi async CRUD |
| `src/lib/auth-context.tsx` | Ganti | Gunakan Supabase Auth |
| `src/lib/data.ts` | Refactor | Hapus CRUD localStorage, pertahankan helpers |
| `src/app/dashboard/page.tsx` | Update | Gunakan db.ts |
| `src/app/dashboard/siswa/page.tsx` | Update | Gunakan db.ts |
| `src/app/dashboard/siswa/[id]/page.tsx` | Update | Gunakan db.ts |
| `src/app/dashboard/siswa-binaan/page.tsx` | Update | Gunakan db.ts |
| `src/app/dashboard/catat/page.tsx` | Update | Gunakan db.ts |
| `src/app/admin/page.tsx` | Update | Gunakan db.ts + ekspor nyata |
| `src/app/admin/siswa/page.tsx` | Update | Gunakan db.ts |
| `src/app/portal-orang-tua/page.tsx` | Update | Gunakan db.ts |
| `supabase/migrations/001_init.sql` | Buat baru | DDL untuk semua tabel + RLS |
| `package.json` | Update | Tambah @supabase/supabase-js + xlsx |

---

## Task 1: Setup Project Supabase & Environment

**Files:**
- Buat: `.env.local`
- Buat: `src/lib/supabase.ts`
- Update: `package.json`

**Produces:** `supabase` singleton client dari `src/lib/supabase.ts`

- [ ] **Step 1: Install dependencies**

```bash
cd "/media/lian/Ubuntu/Guru Wali/guru-wali-app"
npm install @supabase/supabase-js xlsx
```

- [ ] **Step 2: Buat project Supabase**

1. Buka https://supabase.com/dashboard
2. Klik **New Project**
3. Nama: `guru-wali-smp-global-madani`
4. Region: **Southeast Asia (Singapore)**
5. Tunggu hingga aktif (~2 menit)
6. Buka **Settings → API** — copy:
   - `Project URL` (contoh: `https://xyzabcdef.supabase.co`)
   - `anon public` key

- [ ] **Step 3: Buat file `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

Ganti nilai dengan yang asli dari Supabase dashboard.

- [ ] **Step 4: Buat `src/lib/supabase.ts`**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

- [ ] **Step 5: Pastikan `.env.local` ada di `.gitignore`**

```bash
grep -q ".env.local" "/media/lian/Ubuntu/Guru Wali/guru-wali-app/.gitignore" \
  || echo ".env.local" >> "/media/lian/Ubuntu/Guru Wali/guru-wali-app/.gitignore"
```

- [ ] **Step 6: Verifikasi install berhasil**

```bash
cd "/media/lian/Ubuntu/Guru Wali/guru-wali-app"
npm ls @supabase/supabase-js xlsx
```

Expected: kedua package muncul tanpa error

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/supabase.ts .gitignore
git commit -m "feat: install supabase client and xlsx, create supabase singleton"
```

---

## Task 2: Skema Database (DDL Migration)

**Files:**
- Buat: `supabase/migrations/001_init.sql`

**Produces:** Tabel `users`, `students`, `mentoring_sessions` + RLS policies di Supabase

- [ ] **Step 1: Buat direktori**

```bash
mkdir -p "/media/lian/Ubuntu/Guru Wali/guru-wali-app/supabase/migrations"
```

- [ ] **Step 2: Buat `supabase/migrations/001_init.sql`**

```sql
-- ============================================================
-- GURU WALI APP — Database Schema v1.0
-- SMP Global Madani TA 2026/2027
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE: users
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('guru_wali', 'admin', 'orang_tua')),
  status      TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  kelas       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: students
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

-- TABLE: mentoring_sessions
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

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_sessions ENABLE ROW LEVEL SECURITY;

-- users: baca profil sendiri
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- users: admin bisa baca semua
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

-- sessions: guru lihat yang dicatatnya, orang_tua lihat anaknya, admin semua
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_students_guru_wali ON public.students(guru_wali_id);
CREATE INDEX IF NOT EXISTS idx_students_kelas ON public.students(kelas);
CREATE INDEX IF NOT EXISTS idx_sessions_siswa ON public.mentoring_sessions(siswa_id);
CREATE INDEX IF NOT EXISTS idx_sessions_dicatat ON public.mentoring_sessions(dicatat_oleh);
CREATE INDEX IF NOT EXISTS idx_sessions_tanggal ON public.mentoring_sessions(tanggal DESC);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

- [ ] **Step 3: Jalankan SQL di Supabase**

Supabase Dashboard → **SQL Editor → New Query** → paste isi file → **Run**

Expected output: `Success. No rows returned`

- [ ] **Step 4: Verifikasi di Table Editor**

Pastikan 3 tabel muncul: `users`, `students`, `mentoring_sessions`

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add PostgreSQL schema with RLS policies"
```

---

## Task 3: Seed Akun Pengguna (Manual via Dashboard)

**Files:**
- Buat: `supabase/seed_users.sql`

**Produces:** 6 akun di Supabase Auth + baris di `public.users`

> Langkah ini dilakukan MANUAL via Supabase Dashboard — tidak ada kode app yang diubah.

- [ ] **Step 1: Buat akun di Supabase Auth dashboard**

Supabase → **Authentication → Users → Add User → Create new user**

Buat 6 akun dengan "Auto Confirm User" = ON:

| Email | Password (buat baru yang kuat) | Role |
|---|---|---|
| `ahmad.fauzi@globalsmpmadani.sch.id` | *(buat password aman)* | guru_wali |
| `fatimah.zahra@globalsmpmadani.sch.id` | *(buat password aman)* | guru_wali |
| `rizky.pratama@globalsmpmadani.sch.id` | *(buat password aman)* | guru_wali |
| `nurul.hidayah@globalsmpmadani.sch.id` | *(buat password aman)* | guru_wali |
| `admin@globalsmpmadani.sch.id` | *(buat password aman)* | admin |
| `bambang.irawan@gmail.com` | *(buat password aman)* | orang_tua |

- [ ] **Step 2: Copy UUID dari Auth dashboard**

Authentication → Users → copy kolom `id` (UUID) untuk masing-masing user.

- [ ] **Step 3: Buat dan jalankan `supabase/seed_users.sql`**

```sql
-- Ganti UUID-xxx dengan nilai nyata dari Supabase Auth dashboard
INSERT INTO public.users (id, nama, email, role, status, kelas) VALUES
  ('UUID-AHMAD',   'Mr. Ahmad Fauzi, S.Pd.',    'ahmad.fauzi@globalsmpmadani.sch.id',   'guru_wali', 'aktif', '8.1'),
  ('UUID-FATIMAH', 'Ms. Fatimah Zahra, S.Pd.',  'fatimah.zahra@globalsmpmadani.sch.id', 'guru_wali', 'aktif', '7.1'),
  ('UUID-RIZKY',   'Mr. Rizky Pratama, M.Pd.',  'rizky.pratama@globalsmpmadani.sch.id', 'guru_wali', 'aktif', '8.2'),
  ('UUID-NURUL',   'Ms. Nurul Hidayah, S.Si.',  'nurul.hidayah@globalsmpmadani.sch.id', 'guru_wali', 'aktif', '9.1'),
  ('UUID-ADMIN',   'Admin Sekolah',              'admin@globalsmpmadani.sch.id',          'admin',     'aktif', NULL),
  ('UUID-BAMBANG', 'Bpk. Bambang Irawan',        'bambang.irawan@gmail.com',              'orang_tua', 'aktif', NULL)
ON CONFLICT (id) DO NOTHING;
```

Jalankan di SQL Editor Supabase.

- [ ] **Step 4: Verifikasi**

Table Editor → `users` → 6 baris muncul.

- [ ] **Step 5: Simpan password di password manager sekolah**

Jangan simpan password di kode, README, atau chat.

- [ ] **Step 6: Commit template**

```bash
git add supabase/seed_users.sql
git commit -m "feat: add seed SQL template (UUIDs diisi manual)"
```

---

## Task 4: Layer Database — `src/lib/db.ts`

**Files:**
- Buat: `src/lib/db.ts`
- Refactor: `src/lib/data.ts` (hapus fungsi CRUD localStorage)

**Produces:** Fungsi async CRUD yang dipakai Task 5-7:
- `getStudentsByGuruWali(guruWaliId: string): Promise<Student[]>`
- `getAllStudents(): Promise<Student[]>`
- `addStudent(student: Omit<Student, 'id'>): Promise<Student>`
- `updateStudentStatus(id: string, status: Student['status_pendampingan']): Promise<void>`
- `deleteStudent(id: string): Promise<void>`
- `getSessionsByStudent(studentId: string): Promise<MentoringSession[]>`
- `getSessionsByGuruWali(guruWaliId: string): Promise<MentoringSession[]>`
- `getAllSessions(): Promise<MentoringSession[]>`
- `addSession(session: Omit<MentoringSession, 'id' | 'dibuat_pada'>): Promise<MentoringSession>`
- `getUserById(id: string): Promise<User | null>`
- `getAllGuruWali(): Promise<User[]>`
- `getAllUsers(): Promise<User[]>`

- [ ] **Step 1: Buat `src/lib/db.ts`**

```typescript
// src/lib/db.ts
import { supabase } from './supabase';
import type { User, Student, MentoringSession } from './types';

// ── STUDENTS ───────────────────────────────────────────────

export async function getStudentsByGuruWali(guruWaliId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('guru_wali_id', guruWaliId)
    .order('nama', { ascending: true });
  if (error) throw new Error(`getStudentsByGuruWali: ${error.message}`);
  return (data || []) as Student[];
}

export async function getAllStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('kelas', { ascending: true });
  if (error) throw new Error(`getAllStudents: ${error.message}`);
  return (data || []) as Student[];
}

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

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw new Error(`deleteStudent: ${error.message}`);
}

// ── SESSIONS ───────────────────────────────────────────────

export async function getSessionsByStudent(studentId: string): Promise<MentoringSession[]> {
  const { data, error } = await supabase
    .from('mentoring_sessions')
    .select('*')
    .eq('siswa_id', studentId)
    .order('tanggal', { ascending: false });
  if (error) throw new Error(`getSessionsByStudent: ${error.message}`);
  return (data || []) as MentoringSession[];
}

export async function getSessionsByGuruWali(guruWaliId: string): Promise<MentoringSession[]> {
  const { data, error } = await supabase
    .from('mentoring_sessions')
    .select('*')
    .eq('dicatat_oleh', guruWaliId)
    .order('tanggal', { ascending: false });
  if (error) throw new Error(`getSessionsByGuruWali: ${error.message}`);
  return (data || []) as MentoringSession[];
}

export async function getAllSessions(): Promise<MentoringSession[]> {
  const { data, error } = await supabase
    .from('mentoring_sessions')
    .select('*')
    .order('tanggal', { ascending: false });
  if (error) throw new Error(`getAllSessions: ${error.message}`);
  return (data || []) as MentoringSession[];
}

export async function addSession(
  session: Omit<MentoringSession, 'id' | 'dibuat_pada'>
): Promise<MentoringSession> {
  const { data, error } = await supabase
    .from('mentoring_sessions')
    .insert([{ ...session, dibuat_pada: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw new Error(`addSession: ${error.message}`);
  return data as MentoringSession;
}

// ── USERS ──────────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as User;
}

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

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('role', { ascending: true });
  if (error) throw new Error(`getAllUsers: ${error.message}`);
  return (data || []) as User[];
}
```

- [ ] **Step 2: Bersihkan `src/lib/data.ts`**

Hapus fungsi-fungsi berikut (sudah dipindah ke `db.ts`):
- `getStoredStudents()`
- `addStoredStudent()`
- `removeStoredStudent()`
- `getStoredSessions()`
- `addStoredSession()`
- `getStudentsByGuruWali()`
- `getSessionsByStudent()`
- `getSessionsByStudentId()`
- `getClassSummaries()`

Juga hapus konstanta storage keys dan `SESSIONS.unshift()` patterns.

Pertahankan:
- `MENTORING_AREAS`, `USERS` (sementara)
- `formatDate()`, `formatDateShort()`, `getRelativeTime()`
- `getAreaDistribution()`, `getInitials()`, `getMentoringArea()`

- [ ] **Step 3: Verifikasi TypeScript**

```bash
cd "/media/lian/Ubuntu/Guru Wali/guru-wali-app"
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts src/lib/data.ts
git commit -m "feat: create db.ts with async Supabase CRUD, clean localStorage from data.ts"
```

---

## Task 5: Ganti Auth Context dengan Supabase Auth

**Files:**
- Ganti: `src/lib/auth-context.tsx`
- Update: `src/app/login/page.tsx` (hapus Quick Login buttons)
- Update: `src/components/layouts.tsx` (hapus switchUser / demo accounts section)

**Interface yang dipertahankan** (agar semua halaman tidak perlu diubah):
```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}
```

- [ ] **Step 1: Ganti `src/lib/auth-context.tsx`**

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { getUserById } from '@/lib/db';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await getUserById(session.user.id);
          setUser(profile);
        }
      } catch {
        // ignore init errors
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await getUserById(session.user.id);
          setUser(profile);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setIsLoading(false); return false; }
      return true;
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'guru_wali': return '/dashboard';
    case 'admin': return '/admin';
    case 'orang_tua': return '/portal-orang-tua';
    default: return '/login';
  }
}
```

- [ ] **Step 2: Update `src/app/login/page.tsx`**

Hapus semua tombol "Quick Login" dan referensi `switchUser` (tidak ada lagi di context). Pertahankan form email + password standar.

- [ ] **Step 3: Update `src/components/layouts.tsx`**

Di `UserProfileModal`, hapus blok "Demo Accounts" (tombol-tombol switch user). Pertahankan tombol logout biasa.

- [ ] **Step 4: Test manual login**

```bash
npm run dev
```

1. Buka http://localhost:3000/login
2. Login dengan email + password Supabase dari Task 3
3. Cek redirect ke dashboard sesuai role
4. Refresh halaman → tetap login
5. Logout → redirect ke /login

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth-context.tsx src/app/login/ src/components/layouts.tsx
git commit -m "feat: replace mock auth with Supabase Auth email+password"
```

---

## Task 6: Update Semua Halaman ke Supabase DB

**Files:** Semua halaman di `src/app/`

**Pattern migrasi** (sama untuk semua halaman):

```typescript
// SEBELUM (localStorage):
useEffect(() => { setStudents(getStoredStudents()); }, []);

// SESUDAH (Supabase):
const [isDbLoading, setIsDbLoading] = useState(true);
const [dbError, setDbError] = useState<string | null>(null);

useEffect(() => {
  if (!user) return;
  const load = async () => {
    try {
      const data = await getStudentsByGuruWali(user.id);
      setStudents(data);
    } catch {
      setDbError('Gagal memuat data. Coba refresh halaman.');
    } finally {
      setIsDbLoading(false);
    }
  };
  load();
}, [user]);
```

- [ ] **Step 1: Update `src/app/dashboard/page.tsx`**

Import dari `db.ts`: `getStudentsByGuruWali`, `getSessionsByGuruWali`
Hapus import: `getStoredStudents`, `getStoredSessions` dari `data.ts`

- [ ] **Step 2: Update `src/app/dashboard/siswa/page.tsx`**

Import dari `db.ts`: `getStudentsByGuruWali`

- [ ] **Step 3: Update `src/app/dashboard/siswa/[id]/page.tsx`**

Import dari `db.ts`: `getSessionsByStudent`

- [ ] **Step 4: Update `src/app/dashboard/siswa-binaan/page.tsx`**

Import dari `db.ts`: `getStudentsByGuruWali`, `addStudent`, `deleteStudent`

Ubah `handleAdd` menjadi async:
```typescript
const handleAdd = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... validasi ...
  try {
    await addStudent({
      nama: form.nama.trim(),
      nisn: form.nisn.trim(),
      kelas: user.kelas || '',
      guru_wali_id: user.id,
      status_pendampingan: form.status_pendampingan,
    });
    await reload(); // reload dari Supabase
    setShowAddModal(false);
    setSuccessMsg('Siswa berhasil ditambahkan!');
  } catch (err) {
    setFormError('Gagal menyimpan data. Coba lagi.');
  }
};
```

- [ ] **Step 5: Update `src/app/dashboard/catat/page.tsx`**

Import dari `db.ts`: `getStudentsByGuruWali`, `addSession`

Ubah handleSubmit menjadi async — ganti `addStoredSession()` dengan `await addSession({...})`.

- [ ] **Step 6: Update `src/app/admin/page.tsx`**

Import dari `db.ts`: `getAllStudents`, `getAllSessions`, `getAllGuruWali`

Perbaiki data hardcoded:
```typescript
// Ganti "Semester Ganjil 2024/2025" dengan:
const currentYear = new Date().getFullYear();
const semesterLabel = `Semester Ganjil ${currentYear}/${currentYear + 1}`;

// Ganti "Bulan Berjalan (Okt)" dengan:
const currentMonth = new Date().toLocaleDateString('id-ID', { month: 'long' });

// Hapus "+18%" hardcoded

// "Kepatuhan Guru" — hitung guru yang punya minimal 1 sesi:
const guruAktif = allGuruWali.filter(g =>
  sessions.some(s => s.dicatat_oleh === g.id)
).length;
```

- [ ] **Step 7: Update `src/app/admin/siswa/page.tsx`**

Import dari `db.ts`: `getAllStudents`

- [ ] **Step 8: Update `src/app/portal-orang-tua/page.tsx`**

Import dari `db.ts`: `getAllStudents`, `getSessionsByStudent`

- [ ] **Step 9: Verifikasi TypeScript**

```bash
cd "/media/lian/Ubuntu/Guru Wali/guru-wali-app"
npx tsc --noEmit
```

Expected: 0 error

- [ ] **Step 10: Test end-to-end manual**

1. Login guru wali → tambah siswa → data muncul di dashboard
2. Login guru wali lain → siswa guru pertama TIDAK muncul (RLS bekerja)
3. Login admin → SEMUA siswa semua guru muncul
4. Catat sesi → data tersimpan dan muncul di jurnal
5. Logout → login ulang → semua data tetap ada

- [ ] **Step 11: Commit**

```bash
git add src/app/
git commit -m "feat: all pages migrated from localStorage to Supabase DB"
```

---

## Task 7: Ekspor XLSX Nyata + Build Produksi

**Files:**
- Update: `src/app/admin/page.tsx` (hapus `alert()` simulasi)

- [ ] **Step 1: Tambahkan fungsi ekspor nyata di `src/app/admin/page.tsx`**

Tambahkan import di atas:
```typescript
import * as XLSX from 'xlsx';
```

Ganti handler simulasi:
```typescript
// HAPUS:
alert('Laporan spreadsheet XLSX berhasil diunduh (simulasi).');

// GANTI DENGAN:
const handleExportXLSX = async () => {
  try {
    const [allSessions, allStudents] = await Promise.all([getAllSessions(), getAllStudents()]);
    const rows = allSessions.map(s => {
      const siswa = allStudents.find(st => st.id === s.siswa_id);
      return {
        'Tanggal': s.tanggal,
        'Nama Siswa': siswa?.nama || '-',
        'Kelas': siswa?.kelas || '-',
        'Area Pendampingan': s.area_id,
        'Dicatat Oleh': s.dicatat_oleh_nama,
        'Temuan': s.temuan,
        'Tindak Lanjut': s.tindak_lanjut.join('; '),
        'Target Evaluasi': s.target_evaluasi || '-',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Pendampingan');
    XLSX.writeFile(wb, `laporan-pendampingan-${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportModal(false);
  } catch {
    alert('Gagal mengunduh laporan. Coba lagi.');
  }
};
```

- [ ] **Step 2: Production build**

```bash
cd "/media/lian/Ubuntu/Guru Wali/guru-wali-app"
npm run build
```

Expected: `✓ Compiled successfully`, 0 TypeScript error

- [ ] **Step 3: Set environment variables di Vercel**

Vercel Dashboard → Project → **Settings → Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL     = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxxx...
```

- [ ] **Step 4: Deploy**

Push ke GitHub → Vercel auto-deploy. Atau:
```bash
npx vercel --prod
```

- [ ] **Step 5: Smoke test di production URL**

1. Buka URL Vercel yang diberikan
2. Login dengan salah satu akun
3. Tambah satu siswa test
4. Catat satu sesi test
5. Cek data muncul di admin dashboard

- [ ] **Step 6: Update README**

Ganti tabel password demo dengan:
```markdown
> Untuk akses demo/evaluasi, hubungi admin sekolah.
> Password tidak lagi tersedia di dokumentasi publik.
```

- [ ] **Step 7: Final commit + tag**

```bash
git add .
git commit -m "feat: real XLSX export, production build & deploy verified"
git tag v1.0.0
git push origin main --tags
```

---

## Checklist Self-Review

- [x] Mock auth → Supabase Auth: Task 5
- [x] localStorage → Supabase DB: Task 4, 6
- [x] RLS isolasi data per-guru: Task 2
- [x] Ekspor XLSX nyata: Task 7
- [x] Statistik hardcoded diperbaiki: Task 6 Step 6
- [x] Deploy ke Vercel: Task 7
- [x] Password tidak hardcoded di kode: Task 3, Task 7 Step 6
- [x] Semua tipe TypeScript konsisten: `Student`, `User`, `MentoringSession` dari `types.ts`
- [x] Tidak ada placeholder TBD/TODO — semua langkah berisi kode nyata

> [!IMPORTANT]
> Setelah selesai Task 3, simpan semua password baru di password manager sekolah.
> Jangan pernah commit `.env.local` ke git.
