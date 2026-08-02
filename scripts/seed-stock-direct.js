const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://zwbspstsbpzsnphdohko.supabase.co',
  'sb_publishable_IBx9PYkqJPg77OZmISs_Rg_NWDtJDLw'
);

function pad(n) { return String(n).padStart(2, '0'); }

// =============================================
// DAFTAR BARANG (65 item)
// =============================================
const STOCK_ITEMS = [
  // Bahan Makanan (20 item)
  { name: 'Beras Premium', category: 'Bahan Makanan', unit: 'kg', min_stock: 50, location: 'Rak A-1', description: 'Beras IR64 kualitas premium' },
  { name: 'Minyak Goreng Curah', category: 'Bahan Makanan', unit: 'liter', min_stock: 20, location: 'Rak A-2', description: 'Minyak goreng kelapa sawit curah' },
  { name: 'Telur Ayam', category: 'Bahan Makanan', unit: 'kg', min_stock: 10, location: 'Kulkas 1', description: 'Telur ayam negeri segar' },
  { name: 'Tahu Putih', category: 'Bahan Makanan', unit: 'kg', min_stock: 5, location: 'Kulkas 2', description: 'Tahu putih segar' },
  { name: 'Tempe', category: 'Bahan Makanan', unit: 'kg', min_stock: 5, location: 'Kulkas 2', description: 'Tempe kedelai segar' },
  { name: 'Ikan Tongkol', category: 'Bahan Makanan', unit: 'kg', min_stock: 10, location: 'Freezer 1', description: 'Tongkol segar/beku' },
  { name: 'Ikan Teri', category: 'Bahan Makanan', unit: 'kg', min_stock: 3, location: 'Rak B-1', description: 'Teri medan kering' },
  { name: 'Ayam Potong', category: 'Bahan Makanan', unit: 'kg', min_stock: 15, location: 'Freezer 2', description: 'Ayam potong segar' },
  { name: 'Daging Sapi', category: 'Bahan Makanan', unit: 'kg', min_stock: 5, location: 'Freezer 2', description: 'Daging sapi has dalam' },
  { name: 'Sayur Bayam', category: 'Bahan Makanan', unit: 'kg', min_stock: 3, location: 'Kulkas 3', description: 'Bayam hijau segar' },
  { name: 'Sayur Kangkung', category: 'Bahan Makanan', unit: 'kg', min_stock: 2, location: 'Kulkas 3', description: 'Kangkung darat segar' },
  { name: 'Wortel', category: 'Bahan Makanan', unit: 'kg', min_stock: 3, location: 'Kulkas 3', description: 'Wortel lokal' },
  { name: 'Kentang', category: 'Bahan Makanan', unit: 'kg', min_stock: 5, location: 'Rak A-3', description: 'Kentang konsumsi' },
  { name: 'Kacang Hijau', category: 'Bahan Makanan', unit: 'kg', min_stock: 5, location: 'Rak B-2', description: 'Kacang hijau kering' },
  { name: 'Kacang Tanah', category: 'Bahan Makanan', unit: 'kg', min_stock: 3, location: 'Rak B-2', description: 'Kacang tanah sangrai' },
  { name: 'Mie Instan', category: 'Bahan Makanan', unit: 'karton', min_stock: 8, location: 'Rak C-1', description: 'Mie instan berbagai rasa' },
  { name: 'Tepung Terigu', category: 'Bahan Makanan', unit: 'kg', min_stock: 10, location: 'Rak A-3', description: 'Tepung terigu segitiga biru' },
  { name: 'Gula Pasir', category: 'Bahan Makanan', unit: 'kg', min_stock: 8, location: 'Rak A-2', description: 'Gula pasir putih' },
  { name: 'Susu UHT', category: 'Bahan Makanan', unit: 'karton', min_stock: 5, location: 'Kulkas 1', description: 'Susu UHT full cream 1L' },
  { name: 'Makaroni', category: 'Bahan Makanan', unit: 'kg', min_stock: 3, location: 'Rak C-2', description: 'Makaroni kering' },
  // Bumbu Dapur (20 item)
  { name: 'Bawang Merah', category: 'Bumbu Dapur', unit: 'kg', min_stock: 5, location: 'Rak D-1', description: 'Bawang merah lokal' },
  { name: 'Bawang Putih', category: 'Bumbu Dapur', unit: 'kg', min_stock: 4, location: 'Rak D-1', description: 'Bawang putih lokal' },
  { name: 'Cabai Merah Keriting', category: 'Bumbu Dapur', unit: 'kg', min_stock: 3, location: 'Kulkas 3', description: 'Cabai merah keriting segar' },
  { name: 'Cabai Rawit', category: 'Bumbu Dapur', unit: 'kg', min_stock: 1, location: 'Kulkas 3', description: 'Cabai rawit hijau/merah' },
  { name: 'Kunyit', category: 'Bumbu Dapur', unit: 'kg', min_stock: 2, location: 'Rak D-2', description: 'Kunyit segar' },
  { name: 'Jahe', category: 'Bumbu Dapur', unit: 'kg', min_stock: 1, location: 'Rak D-2', description: 'Jahe emprit segar' },
  { name: 'Lengkuas', category: 'Bumbu Dapur', unit: 'kg', min_stock: 1, location: 'Rak D-2', description: 'Lengkuas segar' },
  { name: 'Serai', category: 'Bumbu Dapur', unit: 'kg', min_stock: 1, location: 'Rak D-2', description: 'Serai segar' },
  { name: 'Daun Salam', category: 'Bumbu Dapur', unit: 'kg', min_stock: 0.5, location: 'Rak D-3', description: 'Daun salam kering' },
  { name: 'Daun Jeruk', category: 'Bumbu Dapur', unit: 'kg', min_stock: 0.2, location: 'Rak D-3', description: 'Daun jeruk purut kering' },
  { name: 'Kecap Manis', category: 'Bumbu Dapur', unit: 'liter', min_stock: 3, location: 'Rak D-4', description: 'Kecap manis ABC' },
  { name: 'Kecap Asin', category: 'Bumbu Dapur', unit: 'liter', min_stock: 1, location: 'Rak D-4', description: 'Kecap asin' },
  { name: 'Saus Tomat', category: 'Bumbu Dapur', unit: 'liter', min_stock: 2, location: 'Rak D-4', description: 'Saus tomat botolan' },
  { name: 'Garam Dapur', category: 'Bumbu Dapur', unit: 'kg', min_stock: 5, location: 'Rak D-1', description: 'Garam beryodium' },
  { name: 'Merica Bubuk', category: 'Bumbu Dapur', unit: 'kg', min_stock: 0.5, location: 'Rak D-3', description: 'Merica putih bubuk' },
  { name: 'Ketumbar Bubuk', category: 'Bumbu Dapur', unit: 'kg', min_stock: 0.3, location: 'Rak D-3', description: 'Ketumbar halus' },
  { name: 'Bawang Goreng', category: 'Bumbu Dapur', unit: 'kg', min_stock: 1, location: 'Rak D-5', description: 'Bawang goreng siap pakai' },
  { name: 'Terasi Udang', category: 'Bumbu Dapur', unit: 'kg', min_stock: 1, location: 'Rak D-5', description: 'Terasi udang bakar' },
  { name: 'Santan Kelapa', category: 'Bumbu Dapur', unit: 'liter', min_stock: 4, location: 'Rak D-5', description: 'Santan kelapa kental' },
  { name: 'Penyedap Rasa', category: 'Bumbu Dapur', unit: 'kg', min_stock: 1, location: 'Rak D-4', description: 'MSG / penyedap masakan' },
  // Peralatan Masak (17 item)
  { name: 'Panci Stainless 30cm', category: 'Peralatan Masak', unit: 'pcs', min_stock: 2, location: 'Lemari P-1', description: 'Panci stainless steel 30cm' },
  { name: 'Panci Stainless 50cm', category: 'Peralatan Masak', unit: 'pcs', min_stock: 1, location: 'Lemari P-1', description: 'Panci besar untuk rebus nasi' },
  { name: 'Wajan Besi 40cm', category: 'Peralatan Masak', unit: 'pcs', min_stock: 2, location: 'Lemari P-2', description: 'Wajan besi cor anti lengket' },
  { name: 'Wajan Besi 60cm', category: 'Peralatan Masak', unit: 'pcs', min_stock: 1, location: 'Lemari P-2', description: 'Wajan besar untuk tumis massal' },
  { name: 'Spatula Kayu', category: 'Peralatan Masak', unit: 'pcs', min_stock: 3, location: 'Laci P-1', description: 'Spatula pengaduk kayu' },
  { name: 'Sendok Sayur Besar', category: 'Peralatan Masak', unit: 'pcs', min_stock: 2, location: 'Laci P-1', description: 'Sendok sayur stainless' },
  { name: 'Ladle (Sendok Sup)', category: 'Peralatan Masak', unit: 'pcs', min_stock: 2, location: 'Laci P-1', description: 'Sendok sup berlubang' },
  { name: 'Pisau Dapur Chef', category: 'Peralatan Masak', unit: 'pcs', min_stock: 2, location: 'Laci P-2', description: 'Pisau chef 8 inch' },
  { name: 'Pisau Pemotong Sayur', category: 'Peralatan Masak', unit: 'pcs', min_stock: 2, location: 'Laci P-2', description: 'Pisau sayur stainless' },
  { name: 'Talenan Kayu', category: 'Peralatan Masak', unit: 'pcs', min_stock: 2, location: 'Lemari P-3', description: 'Talenan kayu jati' },
  { name: 'Talenan Plastik', category: 'Peralatan Masak', unit: 'pcs', min_stock: 4, location: 'Lemari P-3', description: 'Talenan plastik warna warni' },
  { name: 'Kompor Gas 2 Tungku', category: 'Peralatan Masak', unit: 'pcs', min_stock: 1, location: 'Area Masak', description: 'Kompor gas industri 2 tungku' },
  { name: 'Kompor Gas 4 Tungku', category: 'Peralatan Masak', unit: 'pcs', min_stock: 1, location: 'Area Masak', description: 'Kompor gas industri 4 tungku' },
  { name: 'Tabung Gas LPG 5.5kg', category: 'Peralatan Masak', unit: 'pcs', min_stock: 2, location: 'Luar Gedung', description: 'Tabung gas LPG 5.5 kg' },
  { name: 'Regulator Gas', category: 'Peralatan Masak', unit: 'pcs', min_stock: 1, location: 'Lemari P-4', description: 'Regulator gas + selang' },
  { name: 'Dandang (Kukusan Besar)', category: 'Peralatan Masak', unit: 'pcs', min_stock: 1, location: 'Lemari P-1', description: 'Dandang aluminium besar' },
  { name: 'Penggiling Bumbu', category: 'Peralatan Masak', unit: 'pcs', min_stock: 1, location: 'Lemari P-4', description: 'Blender bumbu industri' },
  { name: 'Timbangan Dapur', category: 'Peralatan Masak', unit: 'pcs', min_stock: 1, location: 'Meja Kerja', description: 'Timbangan digital 30kg' },
  // Bahan Kemasan (8 item)
  { name: 'Kotak Styrofoam 500ml', category: 'Bahan Kemasan', unit: 'lusin', min_stock: 20, location: 'Gudang K-1', description: 'Kotak styrofoam 500ml' },
  { name: 'Kotak Styrofoam 750ml', category: 'Bahan Kemasan', unit: 'lusin', min_stock: 15, location: 'Gudang K-1', description: 'Kotak styrofoam 750ml' },
  { name: 'Plastik Kemasan Besar', category: 'Bahan Kemasan', unit: 'rim', min_stock: 5, location: 'Gudang K-2', description: 'Plastik kresek besar' },
  { name: 'Plastik Kemasan Kecil', category: 'Bahan Kemasan', unit: 'rim', min_stock: 8, location: 'Gudang K-2', description: 'Plastik kecil untuk lauk' },
  { name: 'Gelas Plastik 220ml', category: 'Bahan Kemasan', unit: 'lusin', min_stock: 15, location: 'Gudang K-3', description: 'Gelas plastik sekali pakai' },
  { name: 'Sendok Plastik', category: 'Bahan Kemasan', unit: 'lusin', min_stock: 25, location: 'Gudang K-3', description: 'Sendok plastik sekali pakai' },
  { name: 'Tisu Makan', category: 'Bahan Kemasan', unit: 'rim', min_stock: 4, location: 'Gudang K-4', description: 'Tisu makan / napkin' },
  { name: 'Lap Penutup Makanan', category: 'Bahan Kemasan', unit: 'pcs', min_stock: 10, location: 'Gudang K-4', description: 'Penutup makanan plastik' },
  // Lainnya (10 item)
  { name: 'Sabun Cuci Piring', category: 'Lainnya', unit: 'pcs', min_stock: 3, location: 'Rak L-1', description: 'Sunlight / sabun cuci piring' },
  { name: 'Sabun Mandi', category: 'Lainnya', unit: 'pcs', min_stock: 5, location: 'Rak L-1', description: 'Sabun mandi batangan' },
  { name: 'Deterjen Bubuk', category: 'Lainnya', unit: 'kg', min_stock: 2, location: 'Rak L-2', description: 'Deterjen bubuk' },
  { name: 'Pembersih Lantai', category: 'Lainnya', unit: 'liter', min_stock: 2, location: 'Rak L-2', description: 'Floor cleaner cair' },
  { name: 'Sapu Ijuk', category: 'Lainnya', unit: 'pcs', min_stock: 1, location: 'Tempat Sapu', description: 'Sapu ijuk' },
  { name: 'Kain Lap Microfiber', category: 'Lainnya', unit: 'pcs', min_stock: 5, location: 'Rak L-3', description: 'Kain lap serbaguna' },
  { name: 'Sarung Tangan Dapur', category: 'Lainnya', unit: 'pcs', min_stock: 3, location: 'Rak L-1', description: 'Sarung tangan anti panas' },
  { name: 'Ember Plastik 20L', category: 'Lainnya', unit: 'pcs', min_stock: 2, location: 'Rak L-3', description: 'Ember plastik besar' },
  { name: 'Bak Air Stainless', category: 'Lainnya', unit: 'pcs', min_stock: 1, location: 'Area Cuci', description: 'Bak cuci piring stainless' },
  { name: 'Koran Bekas', category: 'Lainnya', unit: 'bundel', min_stock: 2, location: 'Gudang K-5', description: 'Koran bekas untuk alas' },
];

// =============================================
// TRANSAKSI 1 BULAN (Juli 2025)
// =============================================
const TRANSACTIONS = [
  // AWAL BULAN: Pembelian besar 1-3 Juli
  { name: 'Beras Premium', type: 'Masuk', qty: 200, day: 1, ref: 'Dinas Kesehatan Kab. Buteng', notes: 'Pengadaan bulanan Juli 2025' },
  { name: 'Minyak Goreng Curah', type: 'Masuk', qty: 60, day: 1, ref: 'Dinas Kesehatan Kab. Buteng', notes: 'Pengadaan bulanan Juli 2025' },
  { name: 'Telur Ayam', type: 'Masuk', qty: 40, day: 1, ref: 'Dinas Kesehatan Kab. Buteng', notes: 'Pengadaan bulanan Juli 2025' },
  { name: 'Ayam Potong', type: 'Masuk', qty: 50, day: 1, ref: 'Distributor Ayam', notes: 'Pengiriman rutin mingguan' },
  { name: 'Ikan Tongkol', type: 'Masuk', qty: 30, day: 1, ref: 'Nelayan Lokal', notes: 'Hasil tangkapan nelayan' },
  { name: 'Gula Pasir', type: 'Masuk', qty: 25, day: 1, ref: 'Dinas Kesehatan Kab. Buteng', notes: 'Pengadaan bulanan Juli 2025' },
  { name: 'Tepung Terigu', type: 'Masuk', qty: 30, day: 1, ref: 'Toko Bahan Kue', notes: 'Pembelian tepung terigu' },
  { name: 'Mie Instan', type: 'Masuk', qty: 25, day: 1, ref: 'Distributor Mie', notes: 'Pengadaan bulanan' },
  { name: 'Susu UHT', type: 'Masuk', qty: 15, day: 1, ref: 'Distributor Susu', notes: 'Pengiriman susu UHT' },
  { name: 'Bawang Merah', type: 'Masuk', qty: 20, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Bumbu mingguan' },
  { name: 'Bawang Putih', type: 'Masuk', qty: 15, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Bumbu mingguan' },
  { name: 'Cabai Merah Keriting', type: 'Masuk', qty: 10, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Bumbu mingguan' },
  { name: 'Cabai Rawit', type: 'Masuk', qty: 5, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Bumbu mingguan' },
  { name: 'Kunyit', type: 'Masuk', qty: 5, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Bumbu mingguan' },
  { name: 'Jahe', type: 'Masuk', qty: 4, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Bumbu mingguan' },
  { name: 'Lengkuas', type: 'Masuk', qty: 3, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Bumbu mingguan' },
  { name: 'Serai', type: 'Masuk', qty: 3, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Bumbu mingguan' },
  { name: 'Daun Salam', type: 'Masuk', qty: 1, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Bumbu mingguan' },
  { name: 'Daun Jeruk', type: 'Masuk', qty: 0.5, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Bumbu mingguan' },
  { name: 'Kecap Manis', type: 'Masuk', qty: 6, day: 2, ref: 'Toko Sembako', notes: 'Bumbu liquid' },
  { name: 'Kecap Asin', type: 'Masuk', qty: 3, day: 2, ref: 'Toko Sembako', notes: 'Bumbu liquid' },
  { name: 'Saus Tomat', type: 'Masuk', qty: 4, day: 2, ref: 'Toko Sembako', notes: 'Bumbu liquid' },
  { name: 'Garam Dapur', type: 'Masuk', qty: 10, day: 2, ref: 'Toko Sembako', notes: 'Bumbu dasar' },
  { name: 'Santan Kelapa', type: 'Masuk', qty: 10, day: 2, ref: 'Toko Sembako', notes: 'Bumbu masakan' },
  { name: 'Penyedap Rasa', type: 'Masuk', qty: 3, day: 2, ref: 'Toko Sembako', notes: 'Penyedap masakan' },
  { name: 'Tahu Putih', type: 'Masuk', qty: 12, day: 3, ref: 'Produsen Tahu', notes: 'Pengiriman tahu segar' },
  { name: 'Tempe', type: 'Masuk', qty: 10, day: 3, ref: 'Produsen Tempe', notes: 'Pengiriman tempe segar' },
  { name: 'Sayur Bayam', type: 'Masuk', qty: 8, day: 3, ref: 'Petani Lokal', notes: 'Sayur hijau segar' },
  { name: 'Sayur Kangkung', type: 'Masuk', qty: 6, day: 3, ref: 'Petani Lokal', notes: 'Sayur hijau segar' },
  { name: 'Wortel', type: 'Masuk', qty: 8, day: 3, ref: 'Pasar Tradisional', notes: 'Sayuran' },
  { name: 'Kentang', type: 'Masuk', qty: 10, day: 3, ref: 'Pasar Tradisional', notes: 'Bahan makanan' },
  { name: 'Kacang Hijau', type: 'Masuk', qty: 8, day: 3, ref: 'Toko Sembako', notes: 'Kacang untuk dessert' },
  { name: 'Kacang Tanah', type: 'Masuk', qty: 5, day: 3, ref: 'Toko Sembako', notes: 'Bahan sambal' },
  { name: 'Makaroni', type: 'Masuk', qty: 5, day: 3, ref: 'Toko Sembako', notes: 'Bahan sup makaroni' },
  { name: 'Daging Sapi', type: 'Masuk', qty: 15, day: 3, ref: 'Distributor Daging', notes: 'Daging sapi segar' },
  { name: 'Ikan Teri', type: 'Masuk', qty: 5, day: 3, ref: 'Nelayan Lokal', notes: 'Teri medan' },
  { name: 'Bawang Goreng', type: 'Masuk', qty: 3, day: 3, ref: 'Produsen Bawang Goreng', notes: 'Topping' },
  { name: 'Merica Bubuk', type: 'Masuk', qty: 1, day: 3, ref: 'Toko Bumbu', notes: 'Bumbu halus' },
  { name: 'Ketumbar Bubuk', type: 'Masuk', qty: 0.5, day: 3, ref: 'Toko Bumbu', notes: 'Bumbu halus' },
  { name: 'Terasi Udang', type: 'Masuk', qty: 2, day: 3, ref: 'Toko Bumbu', notes: 'Bumbu dasar sambal' },
  { name: 'Tabung Gas LPG 5.5kg', type: 'Masuk', qty: 4, day: 3, ref: 'Pangkalan Gas', notes: 'Penggantian tabung gas' },
  { name: 'Kotak Styrofoam 500ml', type: 'Masuk', qty: 50, day: 3, ref: 'Toko Plastik', notes: 'Stok kemasan kecil' },
  { name: 'Kotak Styrofoam 750ml', type: 'Masuk', qty: 30, day: 3, ref: 'Toko Plastik', notes: 'Stok kemasan besar' },
  { name: 'Gelas Plastik 220ml', type: 'Masuk', qty: 60, day: 3, ref: 'Toko Plastik', notes: 'Stok gelas' },
  { name: 'Sendok Plastik', type: 'Masuk', qty: 80, day: 3, ref: 'Toko Plastik', notes: 'Stok sendok' },
  { name: 'Plastik Kemasan Besar', type: 'Masuk', qty: 10, day: 3, ref: 'Toko Plastik', notes: 'Stok plastik besar' },
  { name: 'Plastik Kemasan Kecil', type: 'Masuk', qty: 15, day: 3, ref: 'Toko Plastik', notes: 'Stok plastik kecil' },
  { name: 'Tisu Makan', type: 'Masuk', qty: 8, day: 3, ref: 'Toko Plastik', notes: 'Stok tisu' },
  { name: 'Lap Penutup Makanan', type: 'Masuk', qty: 20, day: 3, ref: 'Toko Plastik', notes: 'Stok penutup' },
  { name: 'Sabun Cuci Piring', type: 'Masuk', qty: 6, day: 3, ref: 'Toko Sembako', notes: 'Kebersihan dapur' },
  { name: 'Deterjen Bubuk', type: 'Masuk', qty: 5, day: 3, ref: 'Toko Sembako', notes: 'Kebersihan' },
  { name: 'Pembersih Lantai', type: 'Masuk', qty: 4, day: 3, ref: 'Toko Sembako', notes: 'Kebersihan' },
  { name: 'Sarung Tangan Dapur', type: 'Masuk', qty: 4, day: 3, ref: 'Toko Sembako', notes: 'APD dapur' },
  { name: 'Kain Lap Microfiber', type: 'Masuk', qty: 10, day: 3, ref: 'Toko Sembako', notes: 'Alat kebersihan' },
  // PEMAKAIAN MINGGU 1
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 3, ref: 'Distribusi Kamis', notes: '200 porsi nasi' },
  { name: 'Ayam Potong', type: 'Keluar', qty: 10, day: 3, ref: 'Distribusi Kamis', notes: 'Ayam goreng' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2.5, day: 3, ref: 'Distribusi Kamis', notes: 'Bumbu ayam goreng' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 3, ref: 'Distribusi Kamis', notes: 'Bumbu ayam goreng' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 0.3, day: 3, ref: 'Distribusi Kamis', notes: 'Sambal' },
  { name: 'Minyak Goreng Curah', type: 'Keluar', qty: 5, day: 3, ref: 'Distribusi Kamis', notes: 'Goreng ayam' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 17, day: 3, ref: 'Distribusi Kamis', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 17, day: 3, ref: 'Distribusi Kamis', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 17, day: 3, ref: 'Distribusi Kamis', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 40, day: 4, ref: 'Distribusi Jumat', notes: '220 porsi' },
  { name: 'Ikan Tongkol', type: 'Keluar', qty: 10, day: 4, ref: 'Distribusi Jumat', notes: 'Pindang tongkol' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 4, ref: 'Distribusi Jumat', notes: 'Bumbu pindang' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 4, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 0.5, day: 4, ref: 'Distribusi Jumat', notes: 'Sambal' },
  { name: 'Kunyit', type: 'Keluar', qty: 0.3, day: 4, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Santan Kelapa', type: 'Keluar', qty: 2, day: 4, ref: 'Distribusi Jumat', notes: 'Gulai ikan' },
  { name: 'Daun Salam', type: 'Keluar', qty: 0.1, day: 4, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Kecap Manis', type: 'Keluar', qty: 1, day: 4, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 22, day: 4, ref: 'Distribusi Jumat', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 22, day: 4, ref: 'Distribusi Jumat', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 22, day: 4, ref: 'Distribusi Jumat', notes: 'Sendok' },
  { name: 'Tisu Makan', type: 'Keluar', qty: 1, day: 4, ref: 'Distribusi Jumat', notes: 'Tisu makan' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 5, ref: 'Distribusi Sabtu', notes: '200 porsi' },
  { name: 'Telur Ayam', type: 'Keluar', qty: 8, day: 5, ref: 'Distribusi Sabtu', notes: 'Telur balado' },
  { name: 'Tempe', type: 'Keluar', qty: 4, day: 5, ref: 'Distribusi Sabtu', notes: 'Tempe goreng' },
  { name: 'Tahu Putih', type: 'Keluar', qty: 3, day: 5, ref: 'Distribusi Sabtu', notes: 'Tahu goreng' },
  { name: 'Sayur Bayam', type: 'Keluar', qty: 2.5, day: 5, ref: 'Distribusi Sabtu', notes: 'Sayur bening' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 5, ref: 'Distribusi Sabtu', notes: 'Bumbu' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 5, ref: 'Distribusi Sabtu', notes: 'Bumbu' },
  { name: 'Cabai Merah Keriting', type: 'Keluar', qty: 1, day: 5, ref: 'Distribusi Sabtu', notes: 'Sambal' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 0.3, day: 5, ref: 'Distribusi Sabtu', notes: 'Sambal' },
  { name: 'Terasi Udang', type: 'Keluar', qty: 0.3, day: 5, ref: 'Distribusi Sabtu', notes: 'Sambal terasi' },
  { name: 'Gula Pasir', type: 'Keluar', qty: 1.5, day: 5, ref: 'Distribusi Sabtu', notes: 'Minuman' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 18, day: 5, ref: 'Distribusi Sabtu', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 18, day: 5, ref: 'Distribusi Sabtu', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 18, day: 5, ref: 'Distribusi Sabtu', notes: 'Sendok' },
  { name: 'Tisu Makan', type: 'Keluar', qty: 1, day: 5, ref: 'Distribusi Sabtu', notes: 'Tisu makan' },
  // RESTOCK MINGGU 2
  { name: 'Ayam Potong', type: 'Masuk', qty: 40, day: 8, ref: 'Distributor Ayam', notes: 'Pengiriman mingguan' },
  { name: 'Telur Ayam', type: 'Masuk', qty: 25, day: 8, ref: 'Peternakan Ayam', notes: 'Restock telur' },
  { name: 'Bawang Merah', type: 'Masuk', qty: 10, day: 8, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Bawang Putih', type: 'Masuk', qty: 8, day: 8, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Cabai Merah Keriting', type: 'Masuk', qty: 6, day: 8, ref: 'Pasar Tradisional', notes: 'Restock cabai' },
  { name: 'Cabai Rawit', type: 'Masuk', qty: 3, day: 8, ref: 'Pasar Tradisional', notes: 'Restock cabai rawit' },
  { name: 'Sayur Bayam', type: 'Masuk', qty: 6, day: 8, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Sayur Kangkung', type: 'Masuk', qty: 5, day: 8, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Tahu Putih', type: 'Masuk', qty: 10, day: 9, ref: 'Produsen Tahu', notes: 'Restock tahu' },
  { name: 'Tempe', type: 'Masuk', qty: 8, day: 9, ref: 'Produsen Tempe', notes: 'Restock tempe' },
  { name: 'Ikan Tongkol', type: 'Masuk', qty: 20, day: 9, ref: 'Nelayan Lokal', notes: 'Restock ikan' },
  { name: 'Minyak Goreng Curah', type: 'Masuk', qty: 30, day: 9, ref: 'Toko Sembako', notes: 'Restock minyak' },
  { name: 'Tabung Gas LPG 5.5kg', type: 'Masuk', qty: 4, day: 10, ref: 'Pangkalan Gas', notes: 'Penggantian tabung' },
  { name: 'Sabun Cuci Piring', type: 'Masuk', qty: 5, day: 10, ref: 'Toko Sembako', notes: 'Restock sabun' },
  { name: 'Kotak Styrofoam 750ml', type: 'Masuk', qty: 40, day: 10, ref: 'Toko Plastik', notes: 'Stok kemasan besar' },
  // PEMAKAIAN MINGGU 2
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 8, ref: 'Distribusi Selasa', notes: '200 porsi' },
  { name: 'Telur Ayam', type: 'Keluar', qty: 10, day: 8, ref: 'Distribusi Selasa', notes: 'Telur balado' },
  { name: 'Tempe', type: 'Keluar', qty: 4, day: 8, ref: 'Distribusi Selasa', notes: 'Tempe bacem' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 9, ref: 'Distribusi Rabu', notes: '200 porsi' },
  { name: 'Ayam Potong', type: 'Keluar', qty: 10, day: 9, ref: 'Distribusi Rabu', notes: 'Ayam goreng kunyit' },
  { name: 'Tahu Putih', type: 'Keluar', qty: 4, day: 9, ref: 'Distribusi Rabu', notes: 'Tahu goreng' },
  { name: 'Sayur Bayam', type: 'Keluar', qty: 2.5, day: 9, ref: 'Distribusi Rabu', notes: 'Sayur bening' },
  { name: 'Kunyit', type: 'Keluar', qty: 0.5, day: 9, ref: 'Distribusi Rabu', notes: 'Bumbu ayam' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 9, ref: 'Distribusi Rabu', notes: 'Bumbu' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 9, ref: 'Distribusi Rabu', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 9, ref: 'Distribusi Rabu', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 9, ref: 'Distribusi Rabu', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 40, day: 11, ref: 'Distribusi Jumat', notes: '220 porsi' },
  { name: 'Ikan Tongkol', type: 'Keluar', qty: 10, day: 11, ref: 'Distribusi Jumat', notes: 'Pindang tongkol' },
  { name: 'Kacang Hijau', type: 'Keluar', qty: 3, day: 11, ref: 'Distribusi Jumat', notes: 'Bubur kacang hijau' },
  { name: 'Gula Pasir', type: 'Keluar', qty: 2, day: 11, ref: 'Distribusi Jumat', notes: 'Bubur dan minuman' },
  { name: 'Santan Kelapa', type: 'Keluar', qty: 2, day: 11, ref: 'Distribusi Jumat', notes: 'Gulai ikan' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 11, ref: 'Distribusi Jumat', notes: 'Bumbu gulai' },
  { name: 'Kecap Manis', type: 'Keluar', qty: 1, day: 11, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Kotak Styrofoam 750ml', type: 'Keluar', qty: 22, day: 11, ref: 'Distribusi Jumat', notes: 'Menu komplit' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 22, day: 11, ref: 'Distribusi Jumat', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 22, day: 11, ref: 'Distribusi Jumat', notes: 'Sendok' },
  { name: 'Tisu Makan', type: 'Keluar', qty: 1, day: 11, ref: 'Distribusi Jumat', notes: 'Tisu' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 14, ref: 'Distribusi Senin', notes: '200 porsi' },
  { name: 'Daging Sapi', type: 'Keluar', qty: 5, day: 14, ref: 'Distribusi Senin', notes: 'Rendang daging' },
  { name: 'Wortel', type: 'Keluar', qty: 2, day: 14, ref: 'Distribusi Senin', notes: 'Sayur sop' },
  { name: 'Kentang', type: 'Keluar', qty: 3, day: 14, ref: 'Distribusi Senin', notes: 'Kentang kecap' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2.5, day: 14, ref: 'Distribusi Senin', notes: 'Bumbu rendang' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 2, day: 14, ref: 'Distribusi Senin', notes: 'Bumbu' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 0.5, day: 14, ref: 'Distribusi Senin', notes: 'Sambal' },
  { name: 'Santan Kelapa', type: 'Keluar', qty: 3, day: 14, ref: 'Distribusi Senin', notes: 'Rendang dan gulai' },
  { name: 'Kecap Manis', type: 'Keluar', qty: 1.5, day: 14, ref: 'Distribusi Senin', notes: 'Kentang kecap' },
  { name: 'Lengkuas', type: 'Keluar', qty: 0.5, day: 14, ref: 'Distribusi Senin', notes: 'Bumbu rendang' },
  { name: 'Daun Salam', type: 'Keluar', qty: 0.2, day: 14, ref: 'Distribusi Senin', notes: 'Bumbu rendang' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 18, day: 14, ref: 'Distribusi Senin', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 18, day: 14, ref: 'Distribusi Senin', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 18, day: 14, ref: 'Distribusi Senin', notes: 'Sendok' },
  // RESTOCK MINGGU 3
  { name: 'Ayam Potong', type: 'Masuk', qty: 45, day: 15, ref: 'Distributor Ayam', notes: 'Pengiriman mingguan' },
  { name: 'Telur Ayam', type: 'Masuk', qty: 30, day: 15, ref: 'Peternakan Ayam', notes: 'Restock telur' },
  { name: 'Bawang Merah', type: 'Masuk', qty: 12, day: 15, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Bawang Putih', type: 'Masuk', qty: 10, day: 15, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Cabai Merah Keriting', type: 'Masuk', qty: 8, day: 15, ref: 'Pasar Tradisional', notes: 'Restock cabai' },
  { name: 'Cabai Rawit', type: 'Masuk', qty: 4, day: 15, ref: 'Pasar Tradisional', notes: 'Restock cabai rawit' },
  { name: 'Sayur Bayam', type: 'Masuk', qty: 8, day: 15, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Sayur Kangkung', type: 'Masuk', qty: 6, day: 15, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Daging Sapi', type: 'Masuk', qty: 10, day: 15, ref: 'Distributor Daging', notes: 'Restock daging' },
  { name: 'Susu UHT', type: 'Masuk', qty: 10, day: 16, ref: 'Distributor Susu', notes: 'Restock susu' },
  { name: 'Tahu Putih', type: 'Masuk', qty: 10, day: 16, ref: 'Produsen Tahu', notes: 'Restock tahu' },
  { name: 'Tempe', type: 'Masuk', qty: 8, day: 16, ref: 'Produsen Tempe', notes: 'Restock tempe' },
  { name: 'Ikan Tongkol', type: 'Masuk', qty: 15, day: 16, ref: 'Nelayan Lokal', notes: 'Restock ikan' },
  { name: 'Kotak Styrofoam 500ml', type: 'Masuk', qty: 40, day: 17, ref: 'Toko Plastik', notes: 'Stok kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Masuk', qty: 50, day: 17, ref: 'Toko Plastik', notes: 'Stok gelas' },
  { name: 'Sendok Plastik', type: 'Masuk', qty: 60, day: 17, ref: 'Toko Plastik', notes: 'Stok sendok' },
  { name: 'Plastik Kemasan Kecil', type: 'Masuk', qty: 10, day: 17, ref: 'Toko Plastik', notes: 'Stok plastik kecil' },
  // PEMAKAIAN MINGGU 3
  { name: 'Beras Premium', type: 'Keluar', qty: 40, day: 15, ref: 'Distribusi Selasa', notes: '220 porsi' },
  { name: 'Ayam Potong', type: 'Keluar', qty: 10, day: 15, ref: 'Distribusi Selasa', notes: 'Ayam goreng' },
  { name: 'Tahu Putih', type: 'Keluar', qty: 4, day: 15, ref: 'Distribusi Selasa', notes: 'Tahu goreng' },
  { name: 'Sayur Kangkung', type: 'Keluar', qty: 2, day: 15, ref: 'Distribusi Selasa', notes: 'Plecing kangkung' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 15, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 15, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 0.5, day: 15, ref: 'Distribusi Selasa', notes: 'Sambal' },
  { name: 'Minyak Goreng Curah', type: 'Keluar', qty: 5, day: 15, ref: 'Distribusi Selasa', notes: 'Goreng' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 15, ref: 'Distribusi Selasa', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 15, ref: 'Distribusi Selasa', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 15, ref: 'Distribusi Selasa', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 16, ref: 'Distribusi Rabu', notes: '200 porsi' },
  { name: 'Daging Sapi', type: 'Keluar', qty: 5, day: 16, ref: 'Distribusi Rabu', notes: 'Semur daging' },
  { name: 'Kentang', type: 'Keluar', qty: 3, day: 16, ref: 'Distribusi Rabu', notes: 'Kentang semur' },
  { name: 'Wortel', type: 'Keluar', qty: 2, day: 16, ref: 'Distribusi Rabu', notes: 'Sayur sop' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 16, ref: 'Distribusi Rabu', notes: 'Bumbu' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 2, day: 16, ref: 'Distribusi Rabu', notes: 'Bumbu' },
  { name: 'Kecap Manis', type: 'Keluar', qty: 1.5, day: 16, ref: 'Distribusi Rabu', notes: 'Semur' },
  { name: 'Susu UHT', type: 'Keluar', qty: 3, day: 16, ref: 'Distribusi Rabu', notes: 'Minuman' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 18, day: 16, ref: 'Distribusi Rabu', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 18, day: 16, ref: 'Distribusi Rabu', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 18, day: 16, ref: 'Distribusi Rabu', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 40, day: 18, ref: 'Distribusi Jumat', notes: '220 porsi' },
  { name: 'Ikan Tongkol', type: 'Keluar', qty: 8, day: 18, ref: 'Distribusi Jumat', notes: 'Pindang tongkol' },
  { name: 'Tempe', type: 'Keluar', qty: 4, day: 18, ref: 'Distribusi Jumat', notes: 'Tempe bacem' },
  { name: 'Sayur Bayam', type: 'Keluar', qty: 3, day: 18, ref: 'Distribusi Jumat', notes: 'Sayur bening' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 18, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 18, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Cabai Merah Keriting', type: 'Keluar', qty: 1.5, day: 18, ref: 'Distribusi Jumat', notes: 'Sambal' },
  { name: 'Terasi Udang', type: 'Keluar', qty: 0.3, day: 18, ref: 'Distribusi Jumat', notes: 'Sambal terasi' },
  { name: 'Kotak Styrofoam 750ml', type: 'Keluar', qty: 20, day: 18, ref: 'Distribusi Jumat', notes: 'Menu komplit' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 18, ref: 'Distribusi Jumat', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 18, ref: 'Distribusi Jumat', notes: 'Sendok' },
  { name: 'Tisu Makan', type: 'Keluar', qty: 1, day: 18, ref: 'Distribusi Jumat', notes: 'Tisu' },
  // RESTOCK MINGGU 4
  { name: 'Beras Premium', type: 'Masuk', qty: 100, day: 22, ref: 'Dinas Kesehatan Kab. Buteng', notes: 'Pengadaan tambahan Juli' },
  { name: 'Ayam Potong', type: 'Masuk', qty: 40, day: 22, ref: 'Distributor Ayam', notes: 'Pengiriman mingguan' },
  { name: 'Telur Ayam', type: 'Masuk', qty: 25, day: 22, ref: 'Peternakan Ayam', notes: 'Restock telur' },
  { name: 'Bawang Merah', type: 'Masuk', qty: 10, day: 22, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Bawang Putih', type: 'Masuk', qty: 8, day: 22, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Cabai Merah Keriting', type: 'Masuk', qty: 6, day: 22, ref: 'Pasar Tradisional', notes: 'Bumbu' },
  { name: 'Cabai Rawit', type: 'Masuk', qty: 3, day: 22, ref: 'Pasar Tradisional', notes: 'Bumbu' },
  { name: 'Sayur Bayam', type: 'Masuk', qty: 6, day: 22, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Sayur Kangkung', type: 'Masuk', qty: 5, day: 22, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Minyak Goreng Curah', type: 'Masuk', qty: 20, day: 22, ref: 'Toko Sembako', notes: 'Restock minyak' },
  { name: 'Gula Pasir', type: 'Masuk', qty: 15, day: 22, ref: 'Toko Sembako', notes: 'Restock gula' },
  { name: 'Santan Kelapa', type: 'Masuk', qty: 6, day: 22, ref: 'Toko Sembako', notes: 'Restock santan' },
  { name: 'Kecap Manis', type: 'Masuk', qty: 4, day: 22, ref: 'Toko Sembako', notes: 'Restock kecap' },
  { name: 'Daging Sapi', type: 'Masuk', qty: 10, day: 23, ref: 'Distributor Daging', notes: 'Restock daging' },
  { name: 'Tahu Putih', type: 'Masuk', qty: 10, day: 23, ref: 'Produsen Tahu', notes: 'Restock tahu' },
  { name: 'Tempe', type: 'Masuk', qty: 8, day: 23, ref: 'Produsen Tempe', notes: 'Restock tempe' },
  { name: 'Ikan Tongkol', type: 'Masuk', qty: 20, day: 23, ref: 'Nelayan Lokal', notes: 'Restock ikan' },
  { name: 'Mie Instan', type: 'Masuk', qty: 10, day: 24, ref: 'Distributor Mie', notes: 'Restock mie' },
  { name: 'Kotak Styrofoam 500ml', type: 'Masuk', qty: 50, day: 24, ref: 'Toko Plastik', notes: 'Stok kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Masuk', qty: 50, day: 24, ref: 'Toko Plastik', notes: 'Stok gelas' },
  { name: 'Sendok Plastik', type: 'Masuk', qty: 60, day: 24, ref: 'Toko Plastik', notes: 'Stok sendok' },
  // PEMAKAIAN MINGGU 4
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 22, ref: 'Distribusi Selasa', notes: '200 porsi' },
  { name: 'Ayam Potong', type: 'Keluar', qty: 10, day: 22, ref: 'Distribusi Selasa', notes: 'Ayam goreng' },
  { name: 'Tempe', type: 'Keluar', qty: 4, day: 22, ref: 'Distribusi Selasa', notes: 'Tempe goreng' },
  { name: 'Sayur Kangkung', type: 'Keluar', qty: 2, day: 22, ref: 'Distribusi Selasa', notes: 'Plecing' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 22, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 22, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Minyak Goreng Curah', type: 'Keluar', qty: 5, day: 22, ref: 'Distribusi Selasa', notes: 'Goreng' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 22, ref: 'Distribusi Selasa', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 22, ref: 'Distribusi Selasa', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 22, ref: 'Distribusi Selasa', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 23, ref: 'Distribusi Rabu', notes: '200 porsi' },
  { name: 'Daging Sapi', type: 'Keluar', qty: 5, day: 23, ref: 'Distribusi Rabu', notes: 'Rendang daging' },
  { name: 'Wortel', type: 'Keluar', qty: 2, day: 23, ref: 'Distribusi Rabu', notes: 'Sayur sop' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2.5, day: 23, ref: 'Distribusi Rabu', notes: 'Bumbu rendang' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 2, day: 23, ref: 'Distribusi Rabu', notes: 'Bumbu' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 0.5, day: 23, ref: 'Distribusi Rabu', notes: 'Sambal' },
  { name: 'Santan Kelapa', type: 'Keluar', qty: 3, day: 23, ref: 'Distribusi Rabu', notes: 'Rendang' },
  { name: 'Lengkuas', type: 'Keluar', qty: 0.5, day: 23, ref: 'Distribusi Rabu', notes: 'Bumbu rendang' },
  { name: 'Daun Salam', type: 'Keluar', qty: 0.2, day: 23, ref: 'Distribusi Rabu', notes: 'Bumbu rendang' },
  { name: 'Kotak Styrofoam 750ml', type: 'Keluar', qty: 18, day: 23, ref: 'Distribusi Rabu', notes: 'Menu komplit' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 18, day: 23, ref: 'Distribusi Rabu', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 18, day: 23, ref: 'Distribusi Rabu', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 40, day: 25, ref: 'Distribusi Jumat', notes: '220 porsi' },
  { name: 'Telur Ayam', type: 'Keluar', qty: 8, day: 25, ref: 'Distribusi Jumat', notes: 'Telur dadar' },
  { name: 'Ikan Teri', type: 'Keluar', qty: 2, day: 25, ref: 'Distribusi Jumat', notes: 'Peyek teri' },
  { name: 'Kacang Tanah', type: 'Keluar', qty: 1.5, day: 25, ref: 'Distribusi Jumat', notes: 'Sambal kacang' },
  { name: 'Tahu Putih', type: 'Keluar', qty: 3, day: 25, ref: 'Distribusi Jumat', notes: 'Tahu goreng' },
  { name: 'Sayur Bayam', type: 'Keluar', qty: 2.5, day: 25, ref: 'Distribusi Jumat', notes: 'Sayur bening' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 25, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 25, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 25, ref: 'Distribusi Jumat', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 25, ref: 'Distribusi Jumat', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 25, ref: 'Distribusi Jumat', notes: 'Sendok' },
  { name: 'Tisu Makan', type: 'Keluar', qty: 1, day: 25, ref: 'Distribusi Jumat', notes: 'Tisu' },
  // RESTOCK & PEMAKAIAN MINGGU 5 (sisa bulan)
  { name: 'Ayam Potong', type: 'Masuk', qty: 35, day: 29, ref: 'Distributor Ayam', notes: 'Pengiriman mingguan' },
  { name: 'Telur Ayam', type: 'Masuk', qty: 20, day: 29, ref: 'Peternakan Ayam', notes: 'Restock telur' },
  { name: 'Bawang Merah', type: 'Masuk', qty: 8, day: 29, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Bawang Putih', type: 'Masuk', qty: 6, day: 29, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Cabai Merah Keriting', type: 'Masuk', qty: 5, day: 29, ref: 'Pasar Tradisional', notes: 'Bumbu' },
  { name: 'Sayur Bayam', type: 'Masuk', qty: 5, day: 29, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Sayur Kangkung', type: 'Masuk', qty: 4, day: 29, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Tahu Putih', type: 'Masuk', qty: 8, day: 30, ref: 'Produsen Tahu', notes: 'Restock tahu' },
  { name: 'Tempe', type: 'Masuk', qty: 6, day: 30, ref: 'Produsen Tempe', notes: 'Restock tempe' },
  { name: 'Ikan Tongkol', type: 'Masuk', qty: 15, day: 30, ref: 'Nelayan Lokal', notes: 'Restock ikan' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 29, ref: 'Distribusi Selasa', notes: '200 porsi' },
  { name: 'Ayam Potong', type: 'Keluar', qty: 10, day: 29, ref: 'Distribusi Selasa', notes: 'Ayam goreng' },
  { name: 'Tahu Putih', type: 'Keluar', qty: 4, day: 29, ref: 'Distribusi Selasa', notes: 'Tahu goreng' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 29, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 29, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 0.5, day: 29, ref: 'Distribusi Selasa', notes: 'Sambal' },
  { name: 'Minyak Goreng Curah', type: 'Keluar', qty: 5, day: 29, ref: 'Distribusi Selasa', notes: 'Goreng' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 29, ref: 'Distribusi Selasa', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 29, ref: 'Distribusi Selasa', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 29, ref: 'Distribusi Selasa', notes: 'Sendok' },
  { name: 'Tisu Makan', type: 'Keluar', qty: 1, day: 29, ref: 'Distribusi Selasa', notes: 'Tisu' },
  { name: 'Plastik Kemasan Besar', type: 'Keluar', qty: 2, day: 29, ref: 'Distribusi Selasa', notes: 'Bungkus lauk' },
  { name: 'Beras Premium', type: 'Keluar', qty: 30, day: 30, ref: 'Distribusi Rabu', notes: '180 porsi' },
  { name: 'Telur Ayam', type: 'Keluar', qty: 8, day: 30, ref: 'Distribusi Rabu', notes: 'Telur dadar' },
  { name: 'Tempe', type: 'Keluar', qty: 3, day: 30, ref: 'Distribusi Rabu', notes: 'Tempe goreng' },
  { name: 'Mie Instan', type: 'Keluar', qty: 2, day: 30, ref: 'Distribusi Rabu', notes: 'Mie goreng' },
  { name: 'Sayur Kangkung', type: 'Keluar', qty: 2, day: 30, ref: 'Distribusi Rabu', notes: 'Plecing' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 30, ref: 'Distribusi Rabu', notes: 'Bumbu' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 30, ref: 'Distribusi Rabu', notes: 'Bumbu' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 18, day: 30, ref: 'Distribusi Rabu', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 18, day: 30, ref: 'Distribusi Rabu', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 18, day: 30, ref: 'Distribusi Rabu', notes: 'Sendok' },
  { name: 'Tisu Makan', type: 'Keluar', qty: 1, day: 30, ref: 'Distribusi Rabu', notes: 'Tisu' },
  { name: 'Plastik Kemasan Besar', type: 'Keluar', qty: 2, day: 30, ref: 'Distribusi Rabu', notes: 'Bungkus lauk' },
  { name: 'Beras Premium', type: 'Keluar', qty: 30, day: 31, ref: 'Distribusi Kamis', notes: '180 porsi' },
  { name: 'Ayam Potong', type: 'Keluar', qty: 10, day: 31, ref: 'Distribusi Kamis', notes: 'Ayam goreng' },
  { name: 'Telur Ayam', type: 'Keluar', qty: 8, day: 31, ref: 'Distribusi Kamis', notes: 'Telur dadar' },
  { name: 'Mie Instan', type: 'Keluar', qty: 2, day: 31, ref: 'Distribusi Kamis', notes: 'Mie goreng' },
  { name: 'Sayur Kangkung', type: 'Keluar', qty: 2, day: 31, ref: 'Distribusi Kamis', notes: 'Plecing' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 18, day: 31, ref: 'Distribusi Kamis', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 18, day: 31, ref: 'Distribusi Kamis', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 18, day: 31, ref: 'Distribusi Kamis', notes: 'Sendok' },
];

// =============================================
// MAIN: SEED DATA
// =============================================
async function main() {
  console.log('=== SEED DATA STOCK & GUDANG - DAPUR SPPG BGN ===');
  console.log(`Total barang: ${STOCK_ITEMS.length}`);
  console.log(`Total transaksi: ${TRANSACTIONS.length}`);
  console.log('');

  // 1. Bersihkan data lama
  console.log('1. Membersihkan data lama...');
  const { error: delTxErr } = await sb.from('stock_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delTxErr) console.error('   Gagal hapus transaksi:', delTxErr.message);
  else console.log('   Transaksi lama dihapus');

  const { error: delItemErr } = await sb.from('stock_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delItemErr) console.error('   Gagal hapus barang:', delItemErr.message);
  else console.log('   Barang lama dihapus');

  // 2. Insert barang
  console.log('2. Menyimpan daftar barang...');
  const { data: insertedItems, error: insertErr } = await sb
    .from('stock_items')
    .insert(STOCK_ITEMS.map(i => ({
      name: i.name,
      category: i.category,
      unit: i.unit,
      stock_qty: 0,
      min_stock: i.min_stock,
      location: i.location,
      description: i.description,
    })))
    .select('id, name');

  if (insertErr) {
    console.error('   GAGAL insert barang:', insertErr.message);
    process.exit(1);
  }
  console.log(`   ${insertedItems.length} barang berhasil disimpan`);

  // 3. Build name -> id map
  const nameToId = {};
  for (const item of insertedItems) {
    nameToId[item.name] = item.id;
  }

  // 4. Insert transaksi (batch 50)
  console.log('3. Menyimpan transaksi...');
  const validTxs = TRANSACTIONS.filter(tx => nameToId[tx.name]);
  const BATCH = 50;
  let totalTx = 0;
  let batchNum = 0;

  for (let i = 0; i < validTxs.length; i += BATCH) {
    batchNum++;
    const batch = validTxs.slice(i, i + BATCH);
    const { error: txErr } = await sb
      .from('stock_transactions')
      .insert(batch.map(tx => ({
        item_id: nameToId[tx.name],
        type: tx.type,
        quantity: tx.qty,
        transaction_date: `2025-07-${pad(tx.day)}`,
        notes: tx.notes,
        reference: tx.ref,
      })));

    if (txErr) {
      console.error(`   Batch ${batchNum} error: ${txErr.message}`);
    } else {
      totalTx += batch.length;
      process.stdout.write(`\r   Batch ${batchNum}: ${totalTx}/${validTxs.length} transaksi`);
    }
  }
  console.log(`\n   Total: ${totalTx} transaksi disimpan`);

  // 5. Hitung dan update stock_qty final
  console.log('4. Menghitung stok akhir...');
  const stockCalc = {};
  for (const item of STOCK_ITEMS) stockCalc[item.name] = 0;
  for (const tx of validTxs) {
    if (tx.type === 'Masuk') stockCalc[tx.name] += tx.qty;
    else stockCalc[tx.name] -= tx.qty;
  }

  let updatedCount = 0;
  for (const [name, qty] of Object.entries(stockCalc)) {
    const id = nameToId[name];
    if (!id) continue;
    const finalQty = Math.max(0, qty);
    const { error: updErr } = await sb.from('stock_items').update({ stock_qty: finalQty }).eq('id', id);
    if (updErr) console.error(`   Update ${name} gagal: ${updErr.message}`);
    else updatedCount++;
  }
  console.log(`   ${updatedCount} stok akhir diperbarui`);

  // 6. Summary
  const masukCount = validTxs.filter(t => t.type === 'Masuk').length;
  const keluarCount = validTxs.filter(t => t.type === 'Keluar').length;
  console.log('');
  console.log('=== SEED SELESAI ===');
  console.log(`Barang: ${insertedItems.length} item`);
  console.log(`Transaksi Masuk: ${masukCount}`);
  console.log(`Transaksi Keluar: ${keluarCount}`);
  console.log(`Total Transaksi: ${totalTx}`);
  console.log(`Periode: 1-31 Juli 2025`);

  // Show some items with low stock
  console.log('');
  console.log('=== PERINGATAN STOK RENDAH ===');
  for (const [name, qty] of Object.entries(stockCalc)) {
    const item = STOCK_ITEMS.find(i => i.name === name);
    if (item && item.min_stock > 0 && qty <= item.min_stock) {
      console.log(`  ! ${name}: ${Math.max(0,qty).toFixed(1)} ${item.unit} (min: ${item.min_stock})`);
    }
  }
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
