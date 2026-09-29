import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, nama, role = 'guru_wali', kelas } = body;

    if (!email || !password || !nama) {
      return NextResponse.json(
        { error: 'Nama lengkap, email, dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // Method 1: Using SUPABASE_SERVICE_ROLE_KEY (Optimal, bypasses confirmation & RLS)
    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 1. Create auth user with auto-confirmed email
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: { nama: nama.trim(), role, kelas: role === 'guru_wali' ? kelas : null },
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      const newUserId = authData.user.id;

      // 2. Ensure row in public.users exists
      const { error: profileError } = await adminClient
        .from('users')
        .upsert({
          id: newUserId,
          nama: nama.trim(),
          email: email.trim(),
          role,
          status: 'aktif',
          kelas: role === 'guru_wali' ? kelas : null,
        });

      if (profileError) {
        return NextResponse.json(
          { error: `Akun dibuat, namun gagal menyimpan profil: ${profileError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Akun ${nama} (${email}) berhasil dibuat dan siap digunakan!`,
        user: { id: newUserId, nama, email, role, kelas },
      });
    }

    // Method 2: Fallback using client-side signUp without service_role
    // (Note: creates auth user with persistSession false so current admin isn't signed out)
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nama: nama.trim(),
          role,
          kelas: role === 'guru_wali' ? kelas : null,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!signUpData.user) {
      return NextResponse.json({ error: 'Gagal membuat pengguna di Supabase Auth.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Akun ${nama} (${email}) berhasil didaftarkan! Jika fitur konfirmasi email aktif di Supabase, mintalah guru memverifikasi surel atau aktifkan SUPABASE_SERVICE_ROLE_KEY untuk auto-confirm.`,
      user: { id: signUpData.user.id, nama, email, role, kelas },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada server saat membuat akun.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
