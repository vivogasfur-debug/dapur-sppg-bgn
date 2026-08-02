const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://zwbspstsbpzsnphdohko.supabase.co', 'sb_publishable_IBx9PYkqJPg77OZmISs_Rg_NWDtJDLw');

const SQL = `
CREATE TABLE IF NOT EXISTS menu_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL,
  hari TEXT NOT NULL,
  kategori_penerima TEXT DEFAULT 'Umum',
  nasi TEXT NOT NULL DEFAULT 'Nasi Putih',
  lauk_pauk TEXT NOT NULL,
  sayur TEXT NOT NULL,
  buah TEXT,
  minuman TEXT,
  kalori_est NUMERIC,
  protein_g NUMERIC,
  catatan TEXT,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE menu_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on menu_plans" ON menu_plans FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_menu_plans_tanggal ON menu_plans(tanggal DESC);
`;

const MENUS = [
  // Senin 28 Juli 2025
  { tanggal:'2025-07-28', hari:'Senin', kategori:'Umum', nasi:'Nasi Putih', lauk_pauk:'Ayam Goreng Kunyit', sayur:'Sayur Bayam Bening', buah:'Pisang Raja', minuman:'Air Mineral', kalori:580, protein:28, catatan:'Menu pembuka minggu, tinggi protein' },
  { tanggal:'2025-07-28', hari:'Senin', kategori:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Ayam Bakar + Telur Dadar', sayur:'Sup Wortel Kentang', buah:'Pisang Raja', minuman:'Susu UHT', kalori:720, protein:38, catatan:'Extra protein untuk ibu hamil' },
  { tanggal:'2025-07-28', hari:'Senin', kategori:'Balita', nasi:'Nasi Tim Ayam', lauk_pauk:'Tempe Goreng', sayur:'Bubur Bayam Wortel', buah:'Pisang Susu', minuman:'Susu UHT', kalori:450, protein:22, catatan:'Tekstur mudah dikunyah balita' },
  // Selasa 29 Juli 2025
  { tanggal:'2025-07-29', hari:'Selasa', kategori:'Umum', nasi:'Nasi Putih', lauk_pauk:'Rendang Daging Sapi', sayur:'Sayur Nangka Muda', buah:'Jeruk Manis', minuman:'Teh Manis Hangat', kalori:650, protein:32, catatan:'Rendang dengan bumbu rempah lengkap' },
  { tanggal:'2025-07-29', hari:'Selasa', kategori:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Rendang Daging + Ikan Tongkol', sayur:'Sayur Nangka + Tahu Bacem', buah:'Jeruk Manis', minuman:'Jus Jambu', kalori:780, protein:42, catatan:'Double protein hewani dan nabati' },
  { tanggal:'2025-07-29', hari:'Selasa', kategori:'Balita', nasi:'Nasi Goreng Telur', lauk_pauk:'Sosis Ayam', sayur:'Sup Makaroni Sayur', buah:'Jeruk Manis', minuman:'Susu UHT', kalori:480, protein:24, catatan:'Nasi goreng lembut untuk balita' },
  // Rabu 30 Juli 2025
  { tanggal:'2025-07-30', hari:'Rabu', kategori:'Umum', nasi:'Nasi Putih', lauk_pauk:'Ikan Tongkol Pindang', sayur:'Plecing Kangkung', buah:'Pepaya Matang', minuman:'Air Mineral', kalori:520, protein:26, catatan:'Ikan lokal segar dari nelayan' },
  { tanggal:'2025-07-30', hari:'Rabu', kategori:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Ikan Tongkol + Telur Balado', sayur:'Plecing Kangkung + Tahu Goreng', buah:'Pepaya Matang', minuman:'Susu UHT', kalori:700, protein:40, catatan:'Asam folat dari pepaya untuk janin' },
  { tanggal:'2025-07-30', hari:'Rabu', kategori:'Balita', nasi:'Bubur Ayam Sayur', lauk_pauk:'Perkedel Kentang', sayur:'Bubur Labu Kuning', buah:'Pepaya Matang', minuman:'Susu UHT', kalori:420, protein:20, catatan:'Bubur lembut bergizi tinggi' },
  // Kamis 31 Juli 2025
  { tanggal:'2025-07-31', hari:'Kamis', kategori:'Umum', nasi:'Nasi Putih', lauk_pauk:'Ayam Pop + Telur Dadar', sayur:'Sayur Sop Bakso', buah:'Apal Hijau', minuman:'Es Teh Manis', kalori:600, protein:30, catatan:'Ayam pop khas Padang' },
  { tanggal:'2025-07-31', hari:'Kamis', kategori:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Ayam Pop + Daging Sapi Masak Cabai', sayur:'Sayur Sop + Tempe Bacem', buah:'Apal Hijau', minuman:'Susu UHT', kalori:750, protein:44, catatan:'Menu tinggi zat besi' },
  { tanggal:'2025-07-31', hari:'Kamis', kategori:'Balita', nasi:'Nasi Tim Ikan', lauk_pauk:'Tempe Goreng', sayur:'Sup Kentang Wortel', buah:'Apal Hijau', minuman:'Susu UHT', kalori:440, protein:23, catatan:'Omega-3 dari ikan untuk perkembangan otak' },
  // Jumat 1 Agustus 2025
  { tanggal:'2025-08-01', hari:'Jumat', kategori:'Umum', nasi:'Nasi Putih', lauk_pauk:'Gulai Ayam Santan', sayur:'Sayur Nangka Muda', buah:'Semangka', minuman:'Air Mineral', kalori:620, protein:27, catatan:'Gulai santan khas Sulawesi' },
  { tanggal:'2025-08-01', hari:'Jumat', kategori:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Gulai Ayam + Telur Rebus', sayur:'Sayur Nangka + Daun Singkong Rebus', buah:'Semangka', minuman:'Jus Alpukat', kalori:760, protein:40, catatan:'Alpukat untuk asam lemak esensial' },
  { tanggal:'2025-08-01', hari:'Jumat', kategori:'Balita', nasi:'Nasi Tim Ayam Santan', lauk_pauk:'Perkedel Jagung', sayur:'Bubur Kacang Hijau', buah:'Semangka', minuman:'Susu UHT', kalori:460, protein:21, catatan:'Kacang hijau sumber protein nabati' },
  // Sabtu 2 Agustus 2025
  { tanggal:'2025-08-02', hari:'Sabtu', kategori:'Umum', nasi:'Nasi Putih', lauk_pauk:'Bakso Ikan Tongkol', sayur:'Sayur Kol Goreng', buah:'Pisang Ambon', minuman:'Teh Manis Hangat', kalori:540, protein:25, catatan:'Bakso ikan homemade' },
  { tanggal:'2025-08-02', hari:'Sabtu', kategori:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Bakso Ikan + Ayam Suwir', sayur:'Sayur Kol + Tumis Tahu', buah:'Pisang Ambon', minuman:'Susu UHT', kalori:710, protein:39, catatan:'Variasi lauk tinggi protein' },
  { tanggal:'2025-08-02', hari:'Sabtu', kategori:'Balita', nasi:'Mie Goreng Telur', lauk_pauk:'Nugget Ayam', sayur:'Sup Sayur Makaroni', buah:'Pisang Ambon', minuman:'Susu UHT', kalori:470, protein:22, catatan:'Mie goreng bertelur favorit anak' },
  // Minggu 3 Agustus 2025
  { tanggal:'2025-08-03', hari:'Minggu', kategori:'Umum', nasi:'Nasi Kuning', lauk_pauk:'Ayam Goreng + Ikan Teri Medan', sayur:'Sayur Labu Siam', buah:'Mangga Harum Manis', minuman:'Air Jeruk Nipis', kalori:610, protein:29, catatan:'Nasi kuning tradisional Sulawesi' },
  { tanggal:'2025-08-03', hari:'Minggu', kategori:'Bumil', nasi:'Nasi Kuning', lauk_pauk:'Ayam Goreng + Daging Sapi Suwir', sayur:'Sayur Labu + Urap', buah:'Mangga Harum Manis', minuman:'Jus Mangga', kalori:770, protein:43, catatan:'Vitamin C dari mangga dan jeruk' },
  { tanggal:'2025-08-03', hari:'Minggu', kategori:'Balita', nasi:'Nasi Kuning Telur', lauk_pauk:'Suwiran Ayam', sayur:'Sup Makaroni Wortel', buah:'Mangga Potong', minuman:'Susu UHT', kalori:450, protein:24, catatan:'Nasi kuning lembut, porsi balita' },
];

async function main() {
  console.log('=== SEED MENU AHLI GIZI ===');

  // 1. Check if table exists, create if not
  console.log('1. Membuat tabel menu_plans...');
  const { error: chkErr } = await sb.from('menu_plans').select('id').limit(1);
  if (chkErr && chkErr.message.includes('does not exist')) {
    console.log('   Tabel belum ada, perlu dibuat manual di Supabase SQL Editor');
    console.log('   Jalankan SQL berikut:');
    console.log(SQL);
    // Try creating via a trick - insert will fail if no table
    process.exit(1);
  }
  console.log('   Tabel sudah ada');

  // 2. Clean & insert
  console.log('2. Membersihkan data lama...');
  await sb.from('menu_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('3. Menyimpan menu 1 minggu...');
  const { data, error } = await sb.from('menu_plans').insert(MENUS).select();
  if (error) { console.error('GAGAL:', error.message); process.exit(1); }
  console.log(`   ${data.length} menu berhasil disimpan`);

  // Summary
  const hari = [...new Set(MENUS.map(m => `${m.hari} ${m.tanggal}`))];
  console.log(`\nPeriode: ${hari.join(', ')}`);
  console.log(`Kategori: Umum, Bumil, Balita`);
  console.log('Rata-rata kalori:');
  for (const cat of ['Umum','Bumil','Balita']) {
    const items = MENUS.filter(m => m.kategori_penerima === cat);
    const avgCal = (items.reduce((s,m) => s + m.kalori, 0) / items.length).toFixed(0);
    const avgPro = (items.reduce((s,m) => s + m.protein_g, 0) / items.length).toFixed(1);
    console.log(`  ${cat}: ${avgCal} kkal, ${avgPro}g protein`);
  }
  console.log('\n=== SEED SELESAI ===');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
