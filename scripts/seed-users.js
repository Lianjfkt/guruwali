// scripts/seed-users.js
// Script untuk mengisi akun pengguna awal ke Supabase Auth & public.users
// Menggunakan SUPABASE_SERVICE_ROLE_KEY dari .env.local

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Baca .env.local secara manual jika dotenv belum diinstal
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'Smpgm2026!';

const INITIAL_USERS = [
  {
    nama: 'Admin Sekolah',
    email: 'admin@globalsmpmadani.sch.id',
    role: 'admin',
    kelas: null,
  },
  {
    nama: 'Mr. Ahmad Fauzi, S.Pd.',
    email: 'ahmad.fauzi@globalsmpmadani.sch.id',
    role: 'guru_wali',
    kelas: '8.1',
  },
  {
    nama: 'Ms. Fatimah Zahra, S.Pd.',
    email: 'fatimah.zahra@globalsmpmadani.sch.id',
    role: 'guru_wali',
    kelas: '7.1',
  },
  {
    nama: 'Mr. Rizky Pratama, M.Pd.',
    email: 'rizky.pratama@globalsmpmadani.sch.id',
    role: 'guru_wali',
    kelas: '8.2',
  },
  {
    nama: 'Ms. Nurul Hidayah, S.Si.',
    email: 'nurul.hidayah@globalsmpmadani.sch.id',
    role: 'guru_wali',
    kelas: '9.1',
  },
  {
    nama: 'Bpk. Bambang Irawan',
    email: 'bambang.irawan@gmail.com',
    role: 'orang_tua',
    kelas: null,
  },
];

async function seed() {
  console.log('🚀 Menghubungkan ke Supabase:', supabaseUrl);
  console.log(`🔑 Password default yang akan diset: ${DEFAULT_PASSWORD}\n`);

  for (const u of INITIAL_USERS) {
    try {
      // 1. Cek apakah user sudah ada di auth.users
      const { data: listRes } = await adminClient.auth.admin.listUsers();
      const existing = listRes?.users?.find(x => x.email?.toLowerCase() === u.email.toLowerCase());

      let userId;
      if (existing) {
        console.log(`ℹ️  Akun Auth sudah ada: ${u.email} (${existing.id})`);
        userId = existing.id;
      } else {
        // Buat user di Auth
        const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
          email: u.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            nama: u.nama,
            role: u.role,
            kelas: u.kelas,
          },
        });

        if (createErr) {
          console.error(`❌ Gagal membuat Auth untuk ${u.email}:`, createErr.message);
          continue;
        }
        userId = created.user.id;
        console.log(`✅ Berhasil membuat Auth: ${u.email} (${userId})`);
      }

      // 2. Pastikan profil di public.users ada
      const { error: profileErr } = await adminClient.from('users').upsert({
        id: userId,
        nama: u.nama,
        email: u.email,
        role: u.role,
        status: 'aktif',
        kelas: u.kelas,
      });

      if (profileErr) {
        console.error(`⚠️ Gagal upsert public.users untuk ${u.email}:`, profileErr.message);
      } else {
        console.log(`   └─ Profil public.users tersinkronisasi.`);
      }
    } catch (err) {
      console.error(`❌ Terjadi error pada ${u.email}:`, err.message);
    }
  }

  console.log('\n🎉 Selesai! Semua akun awal telah siap digunakan di portal.');
}

seed();
