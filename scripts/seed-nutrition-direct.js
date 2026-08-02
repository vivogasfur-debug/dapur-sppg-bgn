const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://zwbspstsbpzsnphdohko.supabase.co',
  'sb_publishable_IBx9PYkqJPg77OZmISs_Rg_NWDtJDLw'
);

// =============================================
// 1. BIKIN TABEL (pakai rpc atau raw SQL via fetch)
// =============================================
// Kita coba insert dulu, kalau tabel belum ada -> error -> kita buat via REST
// Supabase REST API tidak bisa CREATE TABLE, jadi kita pakai pendekatan:
// Coba select, kalau error = tabel belum ada -> tampilkan SQL

async function setup() {
  // Cek apakah tabel nutrition_menu_db sudah ada
  let { data, error } = await sb.from('nutrition_menu_db').select('id').limit(1);
  let menuDbExists = !error;
  
  // Cek apakah tabel weekly_menu_plans sudah ada
  ({ data, error } = await sb.from('weekly_menu_plans').select('id').limit(1));
  let weeklyExists = !error;

  if (!menuDbExists || !weeklyExists) {
    console.log('Tabel belum ada. Membuat via SQL...');
    console.log('Jalankan SQL berikut di Supabase SQL Editor:');
    console.log(SQL_SETUP);
    console.log('\nAtau gunakan endpoint /api/nutrition-setup');
    process.exit(1);
  }
  
  console.log('Tabel sudah ada. Melanjutkan seed...');
  await seedData();
}

const SQL_SETUP = `
-- Tabel Database Menu (Master Dropdown)
CREATE TABLE IF NOT EXISTS nutrition_menu_db (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_menu TEXT NOT NULL,
  tipe_porsi TEXT NOT NULL CHECK (tipe_porsi IN ('porsi_besar', 'porsi_kecil', 'porsi_bayi')),
  nasi TEXT NOT NULL DEFAULT 'Nasi Putih',
  lauk_pauk TEXT NOT NULL,
  sayur TEXT NOT NULL,
  buah TEXT,
  minuman TEXT,
  kalori_est NUMERIC,
  protein_g NUMERIC,
  catatan TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Rencana Menu Mingguan
CREATE TABLE IF NOT EXISTS weekly_menu_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL,
  hari TEXT NOT NULL,
  menu_db_id UUID REFERENCES nutrition_menu_db(id) ON DELETE SET NULL,
  tipe_porsi TEXT NOT NULL CHECK (tipe_porsi IN ('porsi_besar', 'porsi_kecil', 'porsi_bayi')),
  penerima TEXT DEFAULT 'Umum',
  catatan TEXT,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE nutrition_menu_db ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on nutrition_menu_db" ON nutrition_menu_db FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_nutrition_menu_db_tipe ON nutrition_menu_db(tipe_porsi);
CREATE INDEX IF NOT EXISTS idx_nutrition_menu_db_aktif ON nutrition_menu_db(aktif);

ALTER TABLE weekly_menu_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on weekly_menu_plans" ON weekly_menu_plans FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_weekly_menu_tanggal ON weekly_menu_plans(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_menu_porsi ON weekly_menu_plans(tipe_porsi);
`;

// =============================================
// DATABASE MENU (Master) - 30 item
// =============================================
const MENU_DB = [
  // === PORSI BESAR (10 menu) ===
  { nama_menu: 'Nasi + Ayam Goreng Kunyit + Bayam Bening', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Ayam Goreng Kunyit (100g)', sayur: 'Sayur Bayam Bening', buah: 'Pisang Raja (1 buah)', minuman: 'Air Mineral (300ml)', kalori_est: 580, protein_g: 28, catatan: 'Tinggi protein, cocok untuk dewasa dan anak besar' },
  { nama_menu: 'Nasi + Rendang Daging + Sayur Nangka', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Rendang Daging Sapi (80g)', sayur: 'Sayur Nangka Muda', buah: 'Jeruk Manis (1 buah)', minuman: 'Teh Manis Hangat (250ml)', kalori_est: 650, protein_g: 32, catatan: 'Rendang dengan rempah lengkap' },
  { nama_menu: 'Nasi + Ikan Tongkol Pindang + Plecing Kangkung', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Ikan Tongkol Pindang (100g)', sayur: 'Plecing Kangkung', buah: 'Pepaya Matang (100g)', minuman: 'Air Mineral (300ml)', kalori_est: 520, protein_g: 26, catatan: 'Ikan lokal segar dari nelayan' },
  { nama_menu: 'Nasi + Ayam Pop + Telur Dadar + Sop Bakso', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Ayam Pop + Telur Dadar (80g)', sayur: 'Sayur Sop Bakso', buah: 'Apel Hijau (1 buah)', minuman: 'Es Teh Manis (250ml)', kalori_est: 600, protein_g: 30, catatan: 'Ayam pop khas Padang, double protein' },
  { nama_menu: 'Nasi + Gulai Ayam + Sayur Nangka', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Gulai Ayam Santan (100g)', sayur: 'Sayur Nangka Muda', buah: 'Semangka (150g)', minuman: 'Air Mineral (300ml)', kalori_est: 620, protein_g: 27, catatan: 'Gulai santan khas Sulawesi' },
  { nama_menu: 'Nasi + Bakso Ikan + Sayur Kol', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Bakso Ikan Tongkol (120g)', sayur: 'Sayur Kol Goreng', buah: 'Pisang Ambon (1 buah)', minuman: 'Teh Manis Hangat (250ml)', kalori_est: 540, protein_g: 25, catatan: 'Bakso ikan homemade' },
  { nama_menu: 'Nasi Kuning + Ayam Goreng + Teri Medan', tipe_porsi: 'porsi_besar', nasi: 'Nasi Kuning (200g)', lauk_pauk: 'Ayam Goreng + Ikan Teri Medan (90g)', sayur: 'Sayur Labu Siam', buah: 'Mangga Harum Manis (1 buah)', minuman: 'Air Jeruk Nipis (250ml)', kalori_est: 610, protein_g: 29, catatan: 'Nasi kuning tradisional Sulawesi' },
  { nama_menu: 'Nasi + Daging Sapi Masak Cabai + Sayur Sop', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Daging Sapi Masak Cabai (80g)', sayur: 'Sayur Sop Kentang Wortel', buah: 'Jeruk Ponkam (1 buah)', minuman: 'Air Mineral (300ml)', kalori_est: 630, protein_g: 34, catatan: 'Tinggi zat besi dari daging sapi' },
  { nama_menu: 'Nasi + Ikan Tongkol Balado + Tahu Tempe', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Ikan Tongkol Balado (100g) + Tahu Tempe (60g)', sayur: 'Sayur Asem', buah: 'Pepaya Matang (100g)', minuman: 'Teh Manis Hangat (250ml)', kalori_est: 560, protein_g: 27, catatan: 'Double protein ikan + nabati' },
  { nama_menu: 'Nasi + Ayam Suwir + Perkedel Kentang', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Ayam Suwir Pedas (90g) + Perkedel Kentang (50g)', sayur: 'Tumis Kangkung', buah: 'Pisang Raja (1 buah)', minuman: 'Air Mineral (300ml)', kalori_est: 590, protein_g: 26, catatan: 'Ayam suwir bumbu pedas' },

  // === PORSI KECIL (10 menu) ===
  { nama_menu: 'Nasi + Ayam Goreng Kecil + Bayam', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Ayam Goreng Kunyit (60g)', sayur: 'Sayur Bayam Bening', buah: 'Pisang Raja (1/2 buah)', minuman: 'Air Mineral (200ml)', kalori_est: 380, protein_g: 18, catatan: 'Porsi anak SD-SMP, setengah porsi dewasa' },
  { nama_menu: 'Nasi + Rendang Daging Kecil + Nangka', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Rendang Daging (50g)', sayur: 'Sayur Nangka Muda', buah: 'Jeruk Manis (1/2 buah)', minuman: 'Teh Manis Hangat (200ml)', kalori_est: 420, protein_g: 20, catatan: 'Rendang porsi kecil untuk anak' },
  { nama_menu: 'Nasi + Ikan Tongkol Kecil + Kangkung', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Ikan Tongkol Pindang (60g)', sayur: 'Plecing Kangkung', buah: 'Pepaya Potong (50g)', minuman: 'Air Mineral (200ml)', kalori_est: 340, protein_g: 16, catatan: 'Ikan porsi anak, omega-3 untuk otak' },
  { nama_menu: 'Nasi + Ayam Pop Kecil + Sop Bakso', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Ayam Pop + Telur Dadar (50g)', sayur: 'Sayur Sop Bakso', buah: 'Apel Potong (50g)', minuman: 'Es Teh Manis (200ml)', kalori_est: 390, protein_g: 19, catatan: 'Ayam pop porsi anak' },
  { nama_menu: 'Nasi + Gulai Ayam Kecil + Nangka', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Gulai Ayam (60g)', sayur: 'Sayur Nangka Muda', buah: 'Semangka Potong (80g)', minuman: 'Air Mineral (200ml)', kalori_est: 400, protein_g: 17, catatan: 'Gulai santan porsi anak' },
  { nama_menu: 'Nasi + Bakso Ikan Kecil + Sayur Kol', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Bakso Ikan (70g)', sayur: 'Sayur Kol Goreng', buah: 'Pisang Ambon (1/2 buah)', minuman: 'Teh Manis Hangat (200ml)', kalori_est: 360, protein_g: 16, catatan: 'Bakso ikan porsi anak' },
  { nama_menu: 'Nasi Kuning Kecil + Ayam Goreng + Teri', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Kuning (120g)', lauk_pauk: 'Ayam Goreng + Teri (55g)', sayur: 'Sayur Labu Siam', buah: 'Mangga Potong (50g)', minuman: 'Air Jeruk Nipis (200ml)', kalori_est: 410, protein_g: 18, catatan: 'Nasi kuning porsi anak' },
  { nama_menu: 'Nasi + Daging Cabai Kecil + Sop', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Daging Masak Cabai (50g)', sayur: 'Sayur Sop Kentang Wortel', buah: 'Jeruk Ponkam (1/2 buah)', minuman: 'Air Mineral (200ml)', kalori_est: 415, protein_g: 22, catatan: 'Daging porsi kecil, tinggi zat besi' },
  { nama_menu: 'Nasi + Telur Balado + Tempe Goreng', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Telur Balado (1 butir) + Tempe Goreng (40g)', sayur: 'Sayur Asem', buah: 'Pepaya Potong (50g)', minuman: 'Teh Manis Hangat (200ml)', kalori_est: 370, protein_g: 17, catatan: 'Protein telur + tempe nabati' },
  { nama_menu: 'Nasi + Nugget Ayam + Sup Sayur', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Nugget Ayam (3 pcs)', sayur: 'Sup Makaroni Sayur', buah: 'Pisang Raja (1/2 buah)', minuman: 'Susu UHT (200ml)', kalori_est: 430, protein_g: 19, catatan: 'Nugget favorit anak-anak' },

  // === PORSI BAYI 6-12 BULAN (10 menu) ===
  { nama_menu: 'Bubur Nasi Ayam + Wortel Bayam', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Suwiran Ayam Rebus (30g)', sayur: 'Puree Wortel + Bayam (40g)', buah: 'Pisang Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 180, protein_g: 8, catatan: 'Tekstur lumat, mudah dicerna bayi 6-9 bulan' },
  { nama_menu: 'Bubur Nasi Rendang + Labu Kuning', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Rendang Daging Cincang (25g)', sayur: 'Puree Labu Kuning (40g)', buah: 'Pisang Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 190, protein_g: 9, catatan: 'Rendang cincang halus untuk bayi' },
  { nama_menu: 'Bubur Nasi Ikan + Kentang Wortel', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Ikan Tongkol Suwir Halus (25g)', sayur: 'Puree Kentang + Wortel (40g)', buah: 'Pepaya Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 175, protein_g: 8, catatan: 'Omega-3 ikan untuk perkembangan otak bayi' },
  { nama_menu: 'Bubur Nasi Ayam + Sup Kentang', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Suwiran Ayam Pop (30g)', sayur: 'Sup Kentang Wortel Halus (50g)', buah: 'Apel Rebus Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 185, protein_g: 9, catatan: 'Sup kentang hangat untuk bayi' },
  { nama_menu: 'Bubur Santan Ayam + Kacang Hijau', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Santan Halus (80g)', lauk_pauk: 'Suwiran Ayam Gulai (25g)', sayur: 'Bubur Kacang Hijau (30g)', buah: 'Semangka Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 195, protein_g: 8, catatan: 'Santan dan kacang hijau untuk kalori ekstra' },
  { nama_menu: 'Bubur Nasi Ikan + Makaroni Wortel', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Bakso Ikan Cincang (25g)', sayur: 'Makaroni Rebus + Wortel (40g)', buah: 'Pisang Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 180, protein_g: 7, catatan: 'Makaroni lunak untuk bayi belajar mengunyah' },
  { nama_menu: 'Bubur Nasi Kuning + Ayam Suwir', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Kuning (80g)', lauk_pauk: 'Suwiran Ayam Rebus (30g)', sayur: 'Puree Labu Siam (40g)', buah: 'Mangga Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 185, protein_g: 8, catatan: 'Bubur kuning aromatik untuk bayi' },
  { nama_menu: 'Bubur Nasi Hati Ayam + Brokoli', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Hati Ayam Cincang (25g)', sayur: 'Puree Brokoli + Kentang (40g)', buah: 'Pepaya Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 190, protein_g: 10, catatan: 'Hati ayam sumber zat besi tinggi' },
  { nama_menu: 'Bubur Nasi Tempe + Bayam Wortel', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Tempe Cincang Halus (25g)', sayur: 'Puree Bayam + Wortel (40g)', buah: 'Pisang Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 170, protein_g: 7, catatan: 'Protein nabati dari tempe' },
  { nama_menu: 'Bubur Nasi Telur + Makaroni Sayur', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Telur Rebus Cincang (1/2 butir)', sayur: 'Makaroni + Wortel Rebus (40g)', buah: 'Apel Rebus Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 185, protein_g: 9, catatan: 'Telur sumber protein hewani ekonomis' },
];

// =============================================
// WEEKLY MENU PLAN (1 minggu: 28 Jul - 3 Aug 2025)
// =============================================
const WEEKLY_PLANS = [
  // Senin 28 Jul
  { tanggal: '2025-07-28', hari: 'Senin', menu_nama: 'Nasi + Ayam Goreng Kunyit + Bayam Bening', tipe_porsi: 'porsi_besar' },
  { tanggal: '2025-07-28', hari: 'Senin', menu_nama: 'Nasi + Ayam Goreng Kecil + Bayam', tipe_porsi: 'porsi_kecil' },
  { tanggal: '2025-07-28', hari: 'Senin', menu_nama: 'Bubur Nasi Ayam + Wortel Bayam', tipe_porsi: 'porsi_bayi' },
  // Selasa 29 Jul
  { tanggal: '2025-07-29', hari: 'Selasa', menu_nama: 'Nasi + Rendang Daging + Sayur Nangka', tipe_porsi: 'porsi_besar' },
  { tanggal: '2025-07-29', hari: 'Selasa', menu_nama: 'Nasi + Rendang Daging Kecil + Nangka', tipe_porsi: 'porsi_kecil' },
  { tanggal: '2025-07-29', hari: 'Selasa', menu_nama: 'Bubur Nasi Rendang + Labu Kuning', tipe_porsi: 'porsi_bayi' },
  // Rabu 30 Jul
  { tanggal: '2025-07-30', hari: 'Rabu', menu_nama: 'Nasi + Ikan Tongkol Pindang + Plecing Kangkung', tipe_porsi: 'porsi_besar' },
  { tanggal: '2025-07-30', hari: 'Rabu', menu_nama: 'Nasi + Ikan Tongkol Kecil + Kangkung', tipe_porsi: 'porsi_kecil' },
  { tanggal: '2025-07-30', hari: 'Rabu', menu_nama: 'Bubur Nasi Ikan + Kentang Wortel', tipe_porsi: 'porsi_bayi' },
  // Kamis 31 Jul
  { tanggal: '2025-07-31', hari: 'Kamis', menu_nama: 'Nasi + Ayam Pop + Telur Dadar + Sop Bakso', tipe_porsi: 'porsi_besar' },
  { tanggal: '2025-07-31', hari: 'Kamis', menu_nama: 'Nasi + Ayam Pop Kecil + Sop Bakso', tipe_porsi: 'porsi_kecil' },
  { tanggal: '2025-07-31', hari: 'Kamis', menu_nama: 'Bubur Nasi Ayam + Sup Kentang', tipe_porsi: 'porsi_bayi' },
  // Jumat 1 Aug
  { tanggal: '2025-08-01', hari: 'Jumat', menu_nama: 'Nasi + Gulai Ayam + Sayur Nangka', tipe_porsi: 'porsi_besar' },
  { tanggal: '2025-08-01', hari: 'Jumat', menu_nama: 'Nasi + Gulai Ayam Kecil + Nangka', tipe_porsi: 'porsi_kecil' },
  { tanggal: '2025-08-01', hari: 'Jumat', menu_nama: 'Bubur Santan Ayam + Kacang Hijau', tipe_porsi: 'porsi_bayi' },
  // Sabtu 2 Aug
  { tanggal: '2025-08-02', hari: 'Sabtu', menu_nama: 'Nasi + Bakso Ikan + Sayur Kol', tipe_porsi: 'porsi_besar' },
  { tanggal: '2025-08-02', hari: 'Sabtu', menu_nama: 'Nasi + Bakso Ikan Kecil + Sayur Kol', tipe_porsi: 'porsi_kecil' },
  { tanggal: '2025-08-02', hari: 'Sabtu', menu_nama: 'Bubur Nasi Ikan + Makaroni Wortel', tipe_porsi: 'porsi_bayi' },
  // Minggu 3 Aug
  { tanggal: '2025-08-03', hari: 'Minggu', menu_nama: 'Nasi Kuning + Ayam Goreng + Teri Medan', tipe_porsi: 'porsi_besar' },
  { tanggal: '2025-08-03', hari: 'Minggu', menu_nama: 'Nasi Kuning Kecil + Ayam Goreng + Teri', tipe_porsi: 'porsi_kecil' },
  { tanggal: '2025-08-03', hari: 'Minggu', menu_nama: 'Bubur Nasi Kuning + Ayam Suwir', tipe_porsi: 'porsi_bayi' },
];

async function seedData() {
  // 1. Clear existing data
  console.log('Menghapus data lama...');
  await sb.from('weekly_menu_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('nutrition_menu_db').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. Insert menu database
  console.log('Menyisipkan ' + MENU_DB.length + ' menu ke database...');
  const { data: menuData, error: menuErr } = await sb.from('nutrition_menu_db').insert(MENU_DB).select('id, nama_menu');
  if (menuErr) {
    console.error('Error insert menu_db:', menuErr.message);
    process.exit(1);
  }
  console.log('OK: ' + menuData.length + ' menu database tersimpan');

  // 3. Build map nama -> id
  const menuMap = new Map(menuData.map(function(m) { return [m.nama_menu, m.id]; }));

  // 4. Insert weekly plans with menu_db_id
  console.log('Menyisipkan ' + WEEKLY_PLANS.length + ' rencana menu mingguan...');
  const plansWithId = WEEKLY_PLANS.map(p => ({
    tanggal: p.tanggal,
    hari: p.hari,
    menu_db_id: menuMap.get(p.menu_nama),
    tipe_porsi: p.tipe_porsi,
    penerima: p.tipe_porsi === 'porsi_bayi' ? 'Bayi' : 'Umum',
    catatan: null,
    status: 'Aktif',
  }));

  const { data: planData, error: planErr } = await sb.from('weekly_menu_plans').insert(plansWithId).select('id, hari, tipe_porsi');
  if (planErr) {
    console.error('Error insert weekly_plans:', planErr.message);
    process.exit(1);
  }
  console.log('OK: ' + planData.length + ' rencana menu mingguan tersimpan');
  console.log('\n=== SEED SELESAI ===');
  console.log('Menu DB: ' + menuData.length + ' item');
  console.log('Weekly Plans: ' + planData.length + ' item (7 hari x 3 porsi)');
}

setup();
