import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'Parameter id wajib disertakan.' }, { status: 400 });
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY tidak dikonfigurasi. Hapus akun manual di Supabase Dashboard.' },
        { status: 500 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Hapus dari public.users (siswa & sesi otomatis terhapus jika ada FK cascade)
    const { error: dbError } = await adminClient
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      return NextResponse.json({ error: `Gagal menghapus profil: ${dbError.message}` }, { status: 500 });
    }

    // 2. Hapus dari Supabase Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) {
      // Profil sudah terhapus, hanya Auth yang gagal — tetap laporkan
      return NextResponse.json(
        { error: `Profil terhapus, namun akun Auth gagal dihapus: ${authError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Akun pengguna berhasil dihapus.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
