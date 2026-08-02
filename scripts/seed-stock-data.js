const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zwbspstsbpzsnphdohko.supabase.co',
  'sb_publishable_IBx9PYkqJPg77OZmISs_Rg_NWDtJDLw'
);

// =============================================
// DATA SIMULASI 1 BULAN - DAPUR SPPG BGN
// Periode: 1 Juli 2025 - 31 Juli 2025
// =============================================

const SIMULATION_MONTH = '2025-07';

// Helper: random integer between min and max (inclusive)
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function pad(n) { return String(n).padStart(2, '0'); }
function dateStr(day) { return `${SIMULATION_MONTH}-${pad(day)}`; }

// =============================================
// 1. DAFTAR BARANG (STOCK ITEMS)
// =============================================
const stockItems = [
  // --- BAHAN MAKANAN ---
  { name: 'Beras Premium', category: 'Bahan Makanan', unit: 'kg', stock_qty: 150, min_stock: 50, location: 'Rak A-1', description: 'Beras IR64 kualitas premium' },
  { name: 'Minyak Goreng Curah', category: 'Bahan Makanan', unit: 'liter', stock_qty: 45, min_stock: 20, location: 'Rak A-2', description: 'Minyak goreng kelapa sawit curah' },
  { name: 'Telur Ayam', category: 'Bahan Makanan', unit: 'kg', stock_qty: 30, min_stock: 10, location: 'Kulkas 1', description: 'Telur ayam negeri segar' },
  { name: 'Tahu Putih', category: 'Bahan Makanan', unit: 'kg', stock_qty: 12, min_stock: 5, location: 'Kulkas 2', description: 'Tahu putih segar' },
  { name: 'Tempe', category: 'Bahan Makanan', unit: 'kg', stock_qty: 10, min_stock: 5, location: 'Kulkas 2', description: 'Tempe kedelai segar' },
  { name: 'Ikan Tongkol', category: 'Bahan Makanan', unit: 'kg', stock_qty: 25, min_stock: 10, location: 'Freezer 1', description: 'Tongkol segar/beku' },
  { name: 'Ikan Teri', category: 'Bahan Makanan', unit: 'kg', stock_qty: 8, min_stock: 3, location: 'Rak B-1', description: 'Teri medan kering' },
  { name: 'Ayam Potong', category: 'Bahan Makanan', unit: 'kg', stock_qty: 40, min_stock: 15, location: 'Freezer 2', description: 'Ayam potong segar' },
  { name: 'Daging Sapi', category: 'Bahan Makanan', unit: 'kg', stock_qty: 15, min_stock: 5, location: 'Freezer 2', description: 'Daging sapi has dalam' },
  { name: 'Sayur Bayam', category: 'Bahan Makanan', unit: 'kg', stock_qty: 5, min_stock: 3, location: 'Kulkas 3', description: 'Bayam hijau segar' },
  { name: 'Sayur Kangkung', category: 'Bahan Makanan', unit: 'kg', stock_qty: 4, min_stock: 2, location: 'Kulkas 3', description: 'Kangkung darat segar' },
  { name: 'Wortel', category: 'Bahan Makanan', unit: 'kg', stock_qty: 8, min_stock: 3, location: 'Kulkas 3', description: 'Wortel lokal' },
  { name: 'Kentang', category: 'Bahan Makanan', unit: 'kg', stock_qty: 10, min_stock: 5, location: 'Rak A-3', description: 'Kentang konsumsi' },
  { name: 'Kacang Hijau', category: 'Bahan Makanan', unit: 'kg', stock_qty: 12, min_stock: 5, location: 'Rak B-2', description: 'Kacang hijau kering' },
  { name: 'Kacang Tanah', category: 'Bahan Makanan', unit: 'kg', stock_qty: 7, min_stock: 3, location: 'Rak B-2', description: 'Kacang tanah sangrai' },
  { name: 'Mie Instan', category: 'Bahan Makanan', unit: 'karton', stock_qty: 20, min_stock: 8, location: 'Rak C-1', description: 'Mie instan berbagai rasa' },
  { name: 'Tepung Terigu', category: 'Bahan Makanan', unit: 'kg', stock_qty: 25, min_stock: 10, location: 'Rak A-3', description: 'Tepung terigu segitiga biru' },
  { name: 'Gula Pasir', category: 'Bahan Makanan', unit: 'kg', stock_qty: 18, min_stock: 8, location: 'Rak A-2', description: 'Gula pasir putih' },
  { name: 'Susu UHT', category: 'Bahan Makanan', unit: 'karton', stock_qty: 10, min_stock: 5, location: 'Kulkas 1', description: 'Susu UHT full cream 1L' },
  { name: 'Makaroni', category: 'Bahan Makanan', unit: 'kg', stock_qty: 6, min_stock: 3, location: 'Rak C-2', description: 'Makaroni kering' },

  // --- BUMBU DAPUR ---
  { name: 'Bawang Merah', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 15, min_stock: 5, location: 'Rak D-1', description: 'Bawang merah lokal' },
  { name: 'Bawang Putih', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 10, min_stock: 4, location: 'Rak D-1', description: 'Bawang putih lokal' },
  { name: 'Cabai Merah Keriting', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 8, min_stock: 3, location: 'Kulkas 3', description: 'Cabai merah keriting segar' },
  { name: 'Cabai Rawit', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 3, min_stock: 1, location: 'Kulkas 3', description: 'Cabai rawit hijau/merah' },
  { name: 'Kunyit', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 4, min_stock: 2, location: 'Rak D-2', description: 'Kunyit segar' },
  { name: 'Jahe', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 3, min_stock: 1, location: 'Rak D-2', description: 'Jahe emprit segar' },
  { name: 'Lengkuas', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 2, min_stock: 1, location: 'Rak D-2', description: 'Lengkuas segar' },
  { name: 'Serai', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 2, min_stock: 1, location: 'Rak D-2', description: 'Serai segar' },
  { name: 'Daun Salam', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 1, min_stock: 0.5, location: 'Rak D-3', description: 'Daun salam kering' },
  { name: 'Daun Jeruk', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0.5, min_stock: 0.2, location: 'Rak D-3', description: 'Daun jeruk purut kering' },
  { name: 'Kecap Manis', category: 'Bumbu Dapur', unit: 'liter', stock_qty: 6, min_stock: 3, location: 'Rak D-4', description: 'Kecap manis ABC' },
  { name: 'Kecap Asin', category: 'Bumbu Dapur', unit: 'liter', stock_qty: 3, min_stock: 1, location: 'Rak D-4', description: 'Kecap asin' },
  { name: 'Saus Tomat', category: 'Bumbu Dapur', unit: 'liter', stock_qty: 4, min_stock: 2, location: 'Rak D-4', description: 'Saus tomat botolan' },
  { name: 'Garam Dapur', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 10, min_stock: 5, location: 'Rak D-1', description: 'Garam beryodium' },
  { name: 'Merica Bubuk', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 1.5, min_stock: 0.5, location: 'Rak D-3', description: 'Merica putih bubuk' },
  { name: 'Ketumbar Bubuk', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 1, min_stock: 0.3, location: 'Rak D-3', description: 'Ketumbar halus' },
  { name: 'Bawang Goreng', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 3, min_stock: 1, location: 'Rak D-5', description: 'Bawang goreng siap pakai' },
  { name: 'Terasi Udang', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 2, min_stock: 1, location: 'Rak D-5', description: 'Terasi udang bakar' },
  { name: 'Santan Kelapa', category: 'Bumbu Dapur', unit: 'liter', stock_qty: 8, min_stock: 4, location: 'Rak D-5', description: 'Santan kelapa kental' },
  { name: 'Penyedap Rasa', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 2.5, min_stock: 1, location: 'Rak D-4', description: 'MSG / penyedap masakan' },

  // --- PERALATAN MASAK ---
  { name: 'Panci Stainless 30cm', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 4, min_stock: 2, location: 'Lemari P-1', description: 'Panci stainless steel 30cm' },
  { name: 'Panci Stainless 50cm', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 2, min_stock: 1, location: 'Lemari P-1', description: 'Panci besar untuk rebus nasi' },
  { name: 'Wajan Besi 40cm', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 3, min_stock: 2, location: 'Lemari P-2', description: 'Wajan besi cor anti lengket' },
  { name: 'Wajan Besi 60cm', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 1, min_stock: 1, location: 'Lemari P-2', description: 'Wajan besar untuk tumis massal' },
  { name: 'Spatula Kayu', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 6, min_stock: 3, location: 'Laci P-1', description: 'Spatula pengaduk kayu' },
  { name: 'Sendok Sayur Besar', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 5, min_stock: 2, location: 'Laci P-1', description: 'Sendok sayur stainless' },
  { name: 'Ladle (Sendok Sup)', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 4, min_stock: 2, location: 'Laci P-1', description: 'Sendok sup berlubang' },
  { name: 'Pisau Dapur Chef', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 3, min_stock: 2, location: 'Laci P-2', description: 'Pisau chef 8 inch' },
  { name: 'Pisau Pemotong Sayur', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 4, min_stock: 2, location: 'Laci P-2', description: 'Pisau sayur stainless' },
  { name: 'Talenan Kayu', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 5, min_stock: 2, location: 'Lemari P-3', description: 'Talenan kayu jati' },
  { name: 'Talenan Plastik', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 8, min_stock: 4, location: 'Lemari P-3', description: 'Talenan plastik warna warni' },
  { name: 'Kompor Gas 2 Tungku', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 2, min_stock: 1, location: 'Area Masak', description: 'Kompor gas industri 2 tungku' },
  { name: 'Kompor Gas 4 Tungku', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 1, min_stock: 1, location: 'Area Masak', description: 'Kompor gas industri 4 tungku' },
  { name: 'Tabung Gas LPG 5.5kg', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 4, min_stock: 2, location: 'Luar Gedung', description: 'Tabung gas LPG 5.5 kg' },
  { name: 'Regulator Gas', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 3, min_stock: 1, location: 'Lemari P-4', description: 'Regulator gas + selang' },
  { name: 'Dandang (Kukusan Besar)', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 2, min_stock: 1, location: 'Lemari P-1', description: 'Dandang aluminium besar' },
  { name: 'Penggiling Bumbu', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 2, min_stock: 1, location: 'Lemari P-4', description: 'Blender bumbu industri' },
  { name: 'Timbangan Dapur', category: 'Peralatan Masak', unit: 'pcs', stock_qty: 2, min_stock: 1, location: 'Meja Kerja', description: 'Timbangan digital 30kg' },

  // --- BAHAN KEMASAN ---
  { name: 'Kotak Styrofoam 500ml', category: 'Bahan Kemasan', unit: 'lusin', stock_qty: 50, min_stock: 20, location: 'Gudang K-1', description: 'Kotak styrofoam 500ml untuk nasi kotak' },
  { name: 'Kotak Styrofoam 750ml', category: 'Bahan Kemasan', unit: 'lusin', stock_qty: 30, min_stock: 15, location: 'Gudang K-1', description: 'Kotak styrofoam 750ml' },
  { name: 'Plastik Kemasan Besar', category: 'Bahan Kemasan', unit: 'rim', stock_qty: 15, min_stock: 5, location: 'Gudang K-2', description: 'Plastik kresek besar untuk bungkus' },
  { name: 'Plastik Kemasan Kecil', category: 'Bahan Kemasan', unit: 'rim', stock_qty: 20, min_stock: 8, location: 'Gudang K-2', description: 'Plastik kecil untuk lauk' },
  { name: 'Gelas Plastik 220ml', category: 'Bahan Kemasan', unit: 'lusin', stock_qty: 40, min_stock: 15, location: 'Gudang K-3', description: 'Gelas plastik sekali pakai' },
  { name: 'Sendok Plastik', category: 'Bahan Kemasan', unit: 'lusin', stock_qty: 60, min_stock: 25, location: 'Gudang K-3', description: 'Sendok plastik sekali pakai' },
  { name: 'Tisu Makan', category: 'Bahan Kemasan', unit: 'rim', stock_qty: 10, min_stock: 4, location: 'Gudang K-4', description: 'Tisu makan / napkin' },
  { name: 'Lap Penutup Makanan', category: 'Bahan Kemasan', unit: 'pcs', stock_qty: 25, min_stock: 10, location: 'Gudang K-4', description: 'Penutup makanan plastik transparan' },

  // --- LAINNYA ---
  { name: 'Sabun Cuci Piring', category: 'Lainnya', unit: 'pcs', stock_qty: 8, min_stock: 3, location: 'Rak L-1', description: 'Sunlight / sabun cuci piring' },
  { name: 'Sabun Mandi', category: 'Lainnya', unit: 'pcs', stock_qty: 10, min_stock: 5, location: 'Rak L-1', description: 'Sabun mandi batangan' },
  { name: 'Deterjen Bubuk', category: 'Lainnya', unit: 'kg', stock_qty: 5, min_stock: 2, location: 'Rak L-2', description: 'Deterjen bubuk untuk cuci alat masak' },
  { name: 'Pembersih Lantai', category: 'Lainnya', unit: 'liter', stock_qty: 4, min_stock: 2, location: 'Rak L-2', description: 'Floor cleaner cair' },
  { name: 'Sapu Ijuk', category: 'Lainnya', unit: 'pcs', stock_qty: 3, min_stock: 1, location: 'Tempat Sapu', description: 'Sapu ijuk' },
  { name: 'Kain Lap Microfiber', category: 'Lainnya', unit: 'pcs', stock_qty: 12, min_stock: 5, location: 'Rak L-3', description: 'Kain lap serbaguna' },
  { name: 'Sarung Tangan Dapur', category: 'Lainnya', unit: 'pcs', stock_qty: 6, min_stock: 3, location: 'Rak L-1', description: 'Sarung tangan anti panas' },
  { name: 'Ember Plastik 20L', category: 'Lainnya', unit: 'pcs', stock_qty: 4, min_stock: 2, location: 'Rak L-3', description: 'Ember plastik besar' },
  { name: 'Bak Air Stainless', category: 'Lainnya', unit: 'pcs', stock_qty: 3, min_stock: 1, location: 'Area Cuci', description: 'Bak cuci piring stainless' },
  { name: 'Koran Bekas', category: 'Lainnya', unit: 'bundel', stock_qty: 5, min_stock: 2, location: 'Gudang K-5', description: 'Koran bekas untuk alas' },
];

// =============================================
// 2. TRANSAKSI STOK SIMULASI 1 BULAN
// =============================================
// Format: { itemName, type, quantity, day, reference, notes }
// quantity akan mengubah stock_qty via trigger
// Kita generate transaksi lalu hitung final stock_qty

function generateTransactions() {
  const txs = [];

  // --- PEMBELIAN BULK AWAL BULAN (1-3 Juli) ---
  const bulkPurchases = [
    // HARI 1: Pembelian besar dari Dinas Kesehatan
    { itemName: 'Beras Premium', type: 'Masuk', quantity: 200, day: 1, reference: 'Dinas Kesehatan Kab. Buteng', notes: 'Pengadaan bulanan Juli 2025' },
    { itemName: 'Minyak Goreng Curah', type: 'Masuk', quantity: 60, day: 1, reference: 'Dinas Kesehatan Kab. Buteng', notes: 'Pengadaan bulanan Juli 2025' },
    { itemName: 'Telur Ayam', type: 'Masuk', quantity: 40, day: 1, reference: 'Dinas Kesehatan Kab. Buteng', notes: 'Pengadaan bulanan Juli 2025' },
    { itemName: 'Ayam Potong', type: 'Masuk', quantity: 50, day: 1, reference: 'Distributor Ayam', notes: 'Pengiriman rutin mingguan' },
    { itemName: 'Ikan Tongkol', type: 'Masuk', quantity: 30, day: 1, reference: 'Nelayan Lokal', notes: 'Ikan hasil tangkapan nelayan' },
    { itemName: 'Gula Pasir', type: 'Masuk', quantity: 25, day: 1, reference: 'Dinas Kesehatan Kab. Buteng', notes: 'Pengadaan bulanan Juli 2025' },
    { itemName: 'Tepung Terigu', type: 'Masuk', quantity: 30, day: 1, reference: 'Toko Bahan Kue', notes: 'Pembelian tepung terigu' },
    { itemName: 'Mie Instan', type: 'Masuk', quantity: 25, day: 1, reference: 'Distributor Mie', notes: 'Pengadaan bulanan' },
    { itemName: 'Susu UHT', type: 'Masuk', quantity: 15, day: 1, reference: 'Distributor Susu', notes: 'Pengiriman susu UHT' },

    // HARI 2: Pembelian bumbu dari pasar
    { itemName: 'Bawang Merah', type: 'Masuk', quantity: 20, day: 2, reference: 'Pasar Tradisional Wakatobi', notes: 'Pembelian bumbu mingguan' },
    { itemName: 'Bawang Putih', type: 'Masuk', quantity: 15, day: 2, reference: 'Pasar Tradisional Wakatobi', notes: 'Pembelian bumbu mingguan' },
    { itemName: 'Cabai Merah Keriting', type: 'Masuk', quantity: 10, day: 2, reference: 'Pasar Tradisional Wakatobi', notes: 'Pembelian bumbu mingguan' },
    { itemName: 'Cabai Rawit', type: 'Masuk', quantity: 5, day: 2, reference: 'Pasar Tradisional Wakatobi', notes: 'Pembelian bumbu mingguan' },
    { itemName: 'Kunyit', type: 'Masuk', quantity: 5, day: 2, reference: 'Pasar Tradisional Wakatobi', notes: 'Pembelian bumbu mingguan' },
    { itemName: 'Jahe', type: 'Masuk', quantity: 4, day: 2, reference: 'Pasar Tradisional Wakatobi', notes: 'Pembelian bumbu mingguan' },
    { itemName: 'Lengkuas', type: 'Masuk', quantity: 3, day: 2, reference: 'Pasar Tradisional Wakatobi', notes: 'Pembelian bumbu mingguan' },
    { itemName: 'Serai', type: 'Masuk', quantity: 3, day: 2, reference: 'Pasar Tradisional Wakatobi', notes: 'Pembelian bumbu mingguan' },
    { itemName: 'Tahu Putih', type: 'Masuk', quantity: 15, day: 2, reference: 'Produsen Tahu Lokal', notes: 'Pengiriman tahu' },
    { itemName: 'Tempe', type: 'Masuk', quantity: 12, day: 2, reference: 'Produsen Tempe Lokal', notes: 'Pengiriman tempe' },
    { itemName: 'Santan Kelapa', type: 'Masuk', quantity: 10, day: 2, reference: 'Pasar Tradisional Wakatobi', notes: 'Santan kelapa segar' },
    { itemName: 'Kecap Manis', type: 'Masuk', quantity: 8, day: 2, reference: 'Toko Sembako', notes: 'Restock kecap manis' },
    { itemName: 'Garam Dapur', type: 'Masuk', quantity: 15, day: 2, reference: 'Toko Sembako', notes: 'Restock garam' },

    // HARI 3: Pembelian sayur dan kemasan
    { itemName: 'Sayur Bayam', type: 'Masuk', quantity: 8, day: 3, reference: 'Petani Lokal', notes: 'Sayur segar dari kebun' },
    { itemName: 'Sayur Kangkung', type: 'Masuk', quantity: 6, day: 3, reference: 'Petani Lokal', notes: 'Sayur segar dari kebun' },
    { itemName: 'Wortel', type: 'Masuk', quantity: 10, day: 3, reference: 'Pasar Tradisional Wakatobi', notes: 'Pembelian sayur' },
    { itemName: 'Kentang', type: 'Masuk', quantity: 12, day: 3, reference: 'Pasar Tradisional Wakatobi', notes: 'Pembelian sayur' },
    { itemName: 'Ikan Teri', type: 'Masuk', quantity: 10, day: 3, reference: 'Nelayan Lokal', notes: 'Teri nelayan' },
    { itemName: 'Daging Sapi', type: 'Masuk', quantity: 20, day: 3, reference: 'RPH Buton Tengah', notes: 'Pengadaan daging untuk acara' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Masuk', quantity: 60, day: 3, reference: 'Toko Plastik', notes: 'Restock kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Masuk', quantity: 50, day: 3, reference: 'Toko Plastik', notes: 'Restock gelas' },
    { itemName: 'Sendok Plastik', type: 'Masuk', quantity: 80, day: 3, reference: 'Toko Plastik', notes: 'Restock sendok' },

    // --- PEMAKAIAN MINGGU 1 (4-7 Juli) ---
    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 4, reference: 'Distribusi Hari Senin', notes: 'Memasak untuk 200 porsi siswa' },
    { itemName: 'Minyak Goreng Curah', type: 'Keluar', quantity: 8, day: 4, reference: 'Distribusi Hari Senin', notes: 'Untuk menumis dan menggoreng' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 3, day: 4, reference: 'Distribusi Hari Senin', notes: 'Bumbu masakan' },
    { itemName: 'Bawang Putih', type: 'Keluar', quantity: 2, day: 4, reference: 'Distribusi Hari Senin', notes: 'Bumbu masakan' },
    { itemName: 'Cabai Merah Keriting', type: 'Keluar', quantity: 1.5, day: 4, reference: 'Distribusi Hari Senin', notes: 'Sambal dan bumbu' },
    { itemName: 'Ayam Potong', type: 'Keluar', quantity: 12, day: 4, reference: 'Distribusi Hari Senin', notes: 'Ayam goreng untuk lauk' },
    { itemName: 'Telur Ayam', type: 'Keluar', quantity: 8, day: 4, reference: 'Distribusi Hari Senin', notes: 'Telur dadar/balado' },
    { itemName: 'Tahu Putih', type: 'Keluar', quantity: 4, day: 4, reference: 'Distribusi Hari Senin', notes: 'Tahu goreng' },
    { itemName: 'Tempe', type: 'Keluar', quantity: 3, day: 4, reference: 'Distribusi Hari Senin', notes: 'Tempe goreng' },
    { itemName: 'Sayur Bayam', type: 'Keluar', quantity: 2, day: 4, reference: 'Distribusi Hari Senin', notes: 'Sayur bening' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 20, day: 4, reference: 'Distribusi Hari Senin', notes: 'Kemasan nasi kotak' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 20, day: 4, reference: 'Distribusi Hari Senin', notes: 'Gelas minum' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 20, day: 4, reference: 'Distribusi Hari Senin', notes: 'Sendok makan' },
    { itemName: 'Plastik Kemasan Kecil', type: 'Keluar', quantity: 2, day: 4, reference: 'Distribusi Hari Senin', notes: 'Plastik bungkus lauk' },
    { itemName: 'Garam Dapur', type: 'Keluar', quantity: 1, day: 4, reference: 'Distribusi Hari Senin', notes: 'Bumbu masakan' },
    { itemName: 'Gula Pasir', type: 'Keluar', quantity: 2, day: 4, reference: 'Distribusi Hari Senin', notes: 'Pemanis masakan/minuman' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Memasak untuk 200 porsi' },
    { itemName: 'Ikan Tongkol', type: 'Keluar', quantity: 8, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Pindang tongkol' },
    { itemName: 'Minyak Goreng Curah', type: 'Keluar', quantity: 7, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Untuk memasak' },
    { itemName: 'Kunyit', type: 'Keluar', quantity: 1, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Bumbu kuning' },
    { itemName: 'Jahe', type: 'Keluar', quantity: 0.5, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Bumbu' },
    { itemName: 'Serai', type: 'Keluar', quantity: 0.5, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Bumbu' },
    { itemName: 'Santan Kelapa', type: 'Keluar', quantity: 2, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Untuk sayur santan' },
    { itemName: 'Sayur Kangkung', type: 'Keluar', quantity: 2, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Plecing kangkung' },
    { itemName: 'Kecap Manis', type: 'Keluar', quantity: 1, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Bumbu' },
    { itemName: 'Tisu Makan', type: 'Keluar', quantity: 1, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Tisu untuk makan' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 18, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 18, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Gelas minum' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 18, day: 5, reference: 'Distribusi Hari Selasa', notes: 'Sendok' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 40, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Memasak untuk 220 porsi' },
    { itemName: 'Daging Sapi', type: 'Keluar', quantity: 8, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Rendang daging' },
    { itemName: 'Kentang', type: 'Keluar', quantity: 3, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Kentang kecap' },
    { itemName: 'Wortel', type: 'Keluar', quantity: 2, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Sayur sop' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 2.5, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Bumbu rendang' },
    { itemName: 'Bawang Putih', type: 'Keluar', quantity: 2, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Bumbu' },
    { itemName: 'Cabai Rawit', type: 'Keluar', quantity: 0.5, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Sambal' },
    { itemName: 'Santan Kelapa', type: 'Keluar', quantity: 3, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Rendang dan gulai' },
    { itemName: 'Kecap Manis', type: 'Keluar', quantity: 1.5, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Kentang kecap' },
    { itemName: 'Lengkuas', type: 'Keluar', quantity: 0.5, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Bumbu rendang' },
    { itemName: 'Daun Salam', type: 'Keluar', quantity: 0.2, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Bumbu rendang' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 22, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 22, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 22, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Sendok' },
    { itemName: 'Plastik Kemasan Besar', type: 'Keluar', quantity: 2, day: 7, reference: 'Distribusi Hari Kamis', notes: 'Plastik bungkus besar' },

    // --- RESTOCK MINGGU 2 (8-10 Juli) ---
    { itemName: 'Ayam Potong', type: 'Masuk', quantity: 40, day: 8, reference: 'Distributor Ayam', notes: 'Pengiriman mingguan' },
    { itemName: 'Telur Ayam', type: 'Masuk', quantity: 25, day: 8, reference: 'Peternakan Ayam', notes: 'Restock telur' },
    { itemName: 'Bawang Merah', type: 'Masuk', quantity: 10, day: 8, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock bumbu mingguan' },
    { itemName: 'Bawang Putih', type: 'Masuk', quantity: 8, day: 8, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock bumbu mingguan' },
    { itemName: 'Cabai Merah Keriting', type: 'Masuk', quantity: 6, day: 8, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock cabai' },
    { itemName: 'Cabai Rawit', type: 'Masuk', quantity: 3, day: 8, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock cabai rawit' },
    { itemName: 'Sayur Bayam', type: 'Masuk', quantity: 6, day: 8, reference: 'Petani Lokal', notes: 'Sayur segar' },
    { itemName: 'Sayur Kangkung', type: 'Masuk', quantity: 5, day: 8, reference: 'Petani Lokal', notes: 'Sayur segar' },
    { itemName: 'Tahu Putih', type: 'Masuk', quantity: 10, day: 9, reference: 'Produsen Tahu Lokal', notes: 'Restock tahu' },
    { itemName: 'Tempe', type: 'Masuk', quantity: 8, day: 9, reference: 'Produsen Tempe Lokal', notes: 'Restock tempe' },
    { itemName: 'Ikan Tongkol', type: 'Masuk', quantity: 20, day: 9, reference: 'Nelayan Lokal', notes: 'Restock ikan' },
    { itemName: 'Minyak Goreng Curah', type: 'Masuk', quantity: 30, day: 9, reference: 'Toko Sembako', notes: 'Restock minyak goreng' },
    { itemName: 'Tabung Gas LPG 5.5kg', type: 'Masuk', quantity: 4, day: 10, reference: 'Pangkalan Gas', notes: 'Penggantian tabung gas' },
    { itemName: 'Sabun Cuci Piring', type: 'Masuk', quantity: 5, day: 10, reference: 'Toko Sembako', notes: 'Restock sabun' },
    { itemName: 'Kotak Styrofoam 750ml', type: 'Masuk', quantity: 40, day: 10, reference: 'Toko Plastik', notes: 'Stok kemasan besar' },

    // --- PEMAKAIAN MINGGU 2 (8-14 Juli) ---
    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 8, reference: 'Distribusi Hari Selasa', notes: 'Memasak 200 porsi' },
    { itemName: 'Telur Ayam', type: 'Keluar', quantity: 10, day: 8, reference: 'Distribusi Hari Selasa', notes: 'Telur balado' },
    { itemName: 'Tempe', type: 'Keluar', quantity: 4, day: 8, reference: 'Distribusi Hari Selasa', notes: 'Tempe bacem' },
    { itemName: 'Sambal (Cabai Rawit)', type: 'Keluar', quantity: 0, day: 8, reference: '-', notes: '' }, // skip invalid

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 9, reference: 'Distribusi Hari Rabu', notes: 'Memasak 200 porsi' },
    { itemName: 'Ayam Potong', type: 'Keluar', quantity: 10, day: 9, reference: 'Distribusi Hari Rabu', notes: 'Ayam goreng kunyit' },
    { itemName: 'Tahu Putih', type: 'Keluar', quantity: 4, day: 9, reference: 'Distribusi Hari Rabu', notes: 'Tahu goreng' },
    { itemName: 'Sayur Bayam', type: 'Keluar', quantity: 2.5, day: 9, reference: 'Distribusi Hari Rabu', notes: 'Sayur bening bayam' },
    { itemName: 'Kunyit', type: 'Keluar', quantity: 0.5, day: 9, reference: 'Distribusi Hari Rabu', notes: 'Bumbu ayam goreng' },
    { itemName: 'Bawang Putih', type: 'Keluar', quantity: 1.5, day: 9, reference: 'Distribusi Hari Rabu', notes: 'Bumbu' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 20, day: 9, reference: 'Distribusi Hari Rabu', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 20, day: 9, reference: 'Distribusi Hari Rabu', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 20, day: 9, reference: 'Distribusi Hari Rabu', notes: 'Sendok' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 40, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Memasak 220 porsi' },
    { itemName: 'Ikan Tongkol', type: 'Keluar', quantity: 10, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Pindang tongkol' },
    { itemName: 'Kacang Hijau', type: 'Keluar', quantity: 3, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Bubur kacang hijau' },
    { itemName: 'Gula Pasir', type: 'Keluar', quantity: 2, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Untuk bubur dan minuman' },
    { itemName: 'Santan Kelapa', type: 'Keluar', quantity: 2, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Gulai ikan' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 2, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Bumbu gulai' },
    { itemName: 'Kecap Manis', type: 'Keluar', quantity: 1, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Bumbu' },
    { itemName: 'Kotak Styrofoam 750ml', type: 'Keluar', quantity: 22, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Kemasan besar untuk menu komplit' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 22, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 22, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Sendok' },
    { itemName: 'Tisu Makan', type: 'Keluar', quantity: 1, day: 11, reference: 'Distribusi Hari Jumat', notes: 'Tisu makan' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 14, reference: 'Distribusi Hari Senin', notes: 'Memasak 200 porsi' },
    { itemName: 'Ayam Potong', type: 'Keluar', quantity: 12, day: 14, reference: 'Distribusi Hari Senin', notes: 'Ayam penyet' },
    { itemName: 'Tempe', type: 'Keluar', quantity: 5, day: 14, reference: 'Distribusi Hari Senin', notes: 'Tempe penyet' },
    { itemName: 'Cabai Rawit', type: 'Keluar', quantity: 1, day: 14, reference: 'Distribusi Hari Senin', notes: 'Sambal penyet' },
    { itemName: 'Tahu Putih', type: 'Keluar', quantity: 5, day: 14, reference: 'Distribusi Hari Senin', notes: 'Tahu penyet' },
    { itemName: 'Sayur Kangkung', type: 'Keluar', quantity: 3, day: 14, reference: 'Distribusi Hari Senin', notes: 'Plecing kangkung' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 20, day: 14, reference: 'Distribusi Hari Senin', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 20, day: 14, reference: 'Distribusi Hari Senin', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 20, day: 14, reference: 'Distribusi Hari Senin', notes: 'Sendok' },
    { itemName: 'Sabun Cuci Piring', type: 'Keluar', quantity: 1, day: 14, reference: 'Keperluan Dapur', notes: 'Cuci peralatan masak' },

    // --- RESTOCK MINGGU 3 (15-17 Juli) ---
    { itemName: 'Beras Premium', type: 'Masuk', quantity: 100, day: 15, reference: 'Dinas Kesehatan Kab. Buteng', notes: 'Pengadaan tambahan pertengahan bulan' },
    { itemName: 'Minyak Goreng Curah', type: 'Masuk', quantity: 20, day: 15, reference: 'Toko Sembako', notes: 'Restock minyak' },
    { itemName: 'Ayam Potong', type: 'Masuk', quantity: 45, day: 15, reference: 'Distributor Ayam', notes: 'Pengiriman mingguan' },
    { itemName: 'Ikan Tongkol', type: 'Masuk', quantity: 25, day: 15, reference: 'Nelayan Lokal', notes: 'Restock ikan' },
    { itemName: 'Telur Ayam', type: 'Masuk', quantity: 30, day: 16, reference: 'Peternakan Ayam', notes: 'Restock telur' },
    { itemName: 'Bawang Merah', type: 'Masuk', quantity: 12, day: 16, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock bumbu' },
    { itemName: 'Bawang Putih', type: 'Masuk', quantity: 8, day: 16, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock bumbu' },
    { itemName: 'Cabai Merah Keriting', type: 'Masuk', quantity: 5, day: 16, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock cabai' },
    { itemName: 'Sayur Bayam', type: 'Masuk', quantity: 5, day: 16, reference: 'Petani Lokal', notes: 'Sayur segar' },
    { itemName: 'Wortel', type: 'Masuk', quantity: 8, day: 16, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock sayur' },
    { itemName: 'Kacang Hijau', type: 'Masuk', quantity: 5, day: 16, reference: 'Toko Sembako', notes: 'Restock kacang hijau' },
    { itemName: 'Tahu Putih', type: 'Masuk', quantity: 12, day: 17, reference: 'Produsen Tahu Lokal', notes: 'Restock tahu' },
    { itemName: 'Tempe', type: 'Masuk', quantity: 10, day: 17, reference: 'Produsen Tempe Lokal', notes: 'Restock tempe' },
    { itemName: 'Santan Kelapa', type: 'Masuk', quantity: 5, day: 17, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock santan' },
    { itemName: 'Ikan Teri', type: 'Masuk', quantity: 5, day: 17, reference: 'Nelayan Lokal', notes: 'Restock teri' },
    { itemName: 'Mie Instan', type: 'Masuk', quantity: 15, day: 17, reference: 'Distributor Mie', notes: 'Restock mie' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Masuk', quantity: 40, day: 17, reference: 'Toko Plastik', notes: 'Restock kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Masuk', quantity: 30, day: 17, reference: 'Toko Plastik', notes: 'Restock gelas' },
    { itemName: 'Sendok Plastik', type: 'Masuk', quantity: 50, day: 17, reference: 'Toko Plastik', notes: 'Restock sendok' },
    { itemName: 'Plastik Kemasan Besar', type: 'Masuk', quantity: 5, day: 17, reference: 'Toko Plastik', notes: 'Restock plastik' },
    { itemName: 'Plastik Kemasan Kecil', type: 'Masuk', quantity: 5, day: 17, reference: 'Toko Plastik', notes: 'Restock plastik kecil' },

    // --- PEMAKAIAN MINGGU 3 (15-21 Juli) ---
    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 15, reference: 'Distribusi Hari Selasa', notes: 'Memasak 200 porsi' },
    { itemName: 'Ikan Tongkol', type: 'Keluar', quantity: 8, day: 15, reference: 'Distribusi Hari Selasa', notes: 'Gulai ikan tongkol' },
    { itemName: 'Kentang', type: 'Keluar', quantity: 3, day: 15, reference: 'Distribusi Hari Selasa', notes: 'Goreng kentang' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 2, day: 15, reference: 'Distribusi Hari Selasa', notes: 'Bumbu gulai' },
    { itemName: 'Bawang Putih', type: 'Keluar', quantity: 1.5, day: 15, reference: 'Distribusi Hari Selasa', notes: 'Bumbu' },
    { itemName: 'Santan Kelapa', type: 'Keluar', quantity: 2.5, day: 15, reference: 'Distribusi Hari Selasa', notes: 'Gulai' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 20, day: 15, reference: 'Distribusi Hari Selasa', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 20, day: 15, reference: 'Distribusi Hari Selasa', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 20, day: 15, reference: 'Distribusi Hari Selasa', notes: 'Sendok' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 40, day: 16, reference: 'Distribusi Hari Rabu', notes: 'Memasak 220 porsi (tambah penerima)' },
    { itemName: 'Ayam Potong', type: 'Keluar', quantity: 14, day: 16, reference: 'Distribusi Hari Rabu', notes: 'Ayam goreng' },
    { itemName: 'Telur Ayam', type: 'Keluar', quantity: 10, day: 16, reference: 'Distribusi Hari Rabu', notes: 'Telur dadar' },
    { itemName: 'Tahu Putih', type: 'Keluar', quantity: 5, day: 16, reference: 'Distribusi Hari Rabu', notes: 'Tahu goreng' },
    { itemName: 'Sayur Bayam', type: 'Keluar', quantity: 2.5, day: 16, reference: 'Distribusi Hari Rabu', notes: 'Sayur bening' },
    { itemName: 'Cabai Rawit', type: 'Keluar', quantity: 0.5, day: 16, reference: 'Distribusi Hari Rabu', notes: 'Sambal' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 2.5, day: 16, reference: 'Distribusi Hari Rabu', notes: 'Bumbu' },
    { itemName: 'Kotak Styrofoam 750ml', type: 'Keluar', quantity: 22, day: 16, reference: 'Distribusi Hari Rabu', notes: 'Kemasan menu komplit' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 22, day: 16, reference: 'Distribusi Hari Rabu', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 22, day: 16, reference: 'Distribusi Hari Rabu', notes: 'Sendok' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Memasak 200 porsi' },
    { itemName: 'Daging Sapi', type: 'Keluar', quantity: 5, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Semur daging' },
    { itemName: 'Kentang', type: 'Keluar', quantity: 3, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Semur kentang daging' },
    { itemName: 'Kecap Manis', type: 'Keluar', quantity: 2, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Bumbu semur' },
    { itemName: 'Bawang Putih', type: 'Keluar', quantity: 2, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Bumbu' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 2, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Bumbu' },
    { itemName: 'Wortel', type: 'Keluar', quantity: 3, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Sayur sop' },
    { itemName: 'Mie Instan', type: 'Keluar', quantity: 3, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Mie goreng tambahan' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 20, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 20, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 20, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Sendok' },
    { itemName: 'Tisu Makan', type: 'Keluar', quantity: 1, day: 18, reference: 'Distribusi Hari Jumat', notes: 'Tisu' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 21, reference: 'Distribusi Hari Senin', notes: 'Memasak 200 porsi' },
    { itemName: 'Ikan Tongkol', type: 'Keluar', quantity: 8, day: 21, reference: 'Distribusi Hari Senin', notes: 'Pindang tongkol' },
    { itemName: 'Tempe', type: 'Keluar', quantity: 5, day: 21, reference: 'Distribusi Hari Senin', notes: 'Tempe goreng' },
    { itemName: 'Ikan Teri', type: 'Keluar', quantity: 2, day: 21, reference: 'Distribusi Hari Senin', notes: 'Peyek teri' },
    { itemName: 'Kacang Tanah', type: 'Keluar', quantity: 2, day: 21, reference: 'Distribusi Hari Senin', notes: 'Peyek teri' },
    { itemName: 'Tepung Terigu', type: 'Keluar', quantity: 3, day: 21, reference: 'Distribusi Hari Senin', notes: 'Adonan peyek' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 2, day: 21, reference: 'Distribusi Hari Senin', notes: 'Bumbu' },
    { itemName: 'Cabai Merah Keriting', type: 'Keluar', quantity: 1.5, day: 21, reference: 'Distribusi Hari Senin', notes: 'Sambal' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 20, day: 21, reference: 'Distribusi Hari Senin', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 20, day: 21, reference: 'Distribusi Hari Senin', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 20, day: 21, reference: 'Distribusi Hari Senin', notes: 'Sendok' },
    { itemName: 'Sabun Cuci Piring', type: 'Keluar', quantity: 1, day: 21, reference: 'Keperluan Dapur', notes: 'Cuci alat masak' },

    // --- RESTOCK MINGGU 4 (22-24 Juli) ---
    { itemName: 'Ayam Potong', type: 'Masuk', quantity: 50, day: 22, reference: 'Distributor Ayam', notes: 'Pengiriman mingguan' },
    { itemName: 'Telur Ayam', type: 'Masuk', quantity: 20, day: 22, reference: 'Peternakan Ayam', notes: 'Restock telur' },
    { itemName: 'Bawang Merah', type: 'Masuk', quantity: 10, day: 22, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock bumbu' },
    { itemName: 'Bawang Putih', type: 'Masuk', quantity: 6, day: 22, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock bumbu' },
    { itemName: 'Cabai Merah Keriting', type: 'Masuk', quantity: 4, day: 22, reference: 'Pasar Tradisional Wakatobi', notes: 'Restock cabai' },
    { itemName: 'Sayur Kangkung', type: 'Masuk', quantity: 5, day: 22, reference: 'Petani Lokal', notes: 'Sayur segar' },
    { itemName: 'Sayur Bayam', type: 'Masuk', quantity: 5, day: 22, reference: 'Petani Lokal', notes: 'Sayur segar' },
    { itemName: 'Tahu Putih', type: 'Masuk', quantity: 10, day: 23, reference: 'Produsen Tahu Lokal', notes: 'Restock tahu' },
    { itemName: 'Tempe', type: 'Masuk', quantity: 8, day: 23, reference: 'Produsen Tempe Lokal', notes: 'Restock tempe' },
    { itemName: 'Ikan Tongkol', type: 'Masuk', quantity: 15, day: 23, reference: 'Nelayan Lokal', notes: 'Restock ikan' },
    { itemName: 'Susu UHT', type: 'Masuk', quantity: 10, day: 24, reference: 'Distributor Susu', notes: 'Restock susu' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Masuk', quantity: 30, day: 24, reference: 'Toko Plastic', notes: 'Restock kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Masuk', quantity: 25, day: 24, reference: 'Toko Plastik', notes: 'Restock gelas' },
    { itemName: 'Sendok Plastik', type: 'Masuk', quantity: 40, day: 24, reference: 'Toko Plastik', notes: 'Restock sendok' },
    { itemName: 'Deterjen Bubuk', type: 'Masuk', quantity: 3, day: 24, reference: 'Toko Sembako', notes: 'Restock deterjen' },
    { itemName: 'Kain Lap Microfiber', type: 'Masuk', quantity: 6, day: 24, reference: 'Toko Alat Kebersihan', notes: 'Restock kain lap' },

    // --- PEMAKAIAN MINGGU 4 (22-28 Juli) ---
    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 22, reference: 'Distribusi Hari Selasa', notes: 'Memasak 200 porsi' },
    { itemName: 'Ayam Potong', type: 'Keluar', quantity: 12, day: 22, reference: 'Distribusi Hari Selasa', notes: 'Ayam goreng lengkuas' },
    { itemName: 'Tahu Putih', type: 'Keluar', quantity: 4, day: 22, reference: 'Distribusi Hari Selasa', notes: 'Tahu goreng' },
    { itemName: 'Lengkuas', type: 'Keluar', quantity: 0.5, day: 22, reference: 'Distribusi Hari Selasa', notes: 'Bumbu ayam' },
    { itemName: 'Jahe', type: 'Keluar', quantity: 0.5, day: 22, reference: 'Distribusi Hari Selasa', notes: 'Bumbu ayam' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 2, day: 22, reference: 'Distribusi Hari Selasa', notes: 'Bumbu' },
    { itemName: 'Sayur Kangkung', type: 'Keluar', quantity: 2, day: 22, reference: 'Distribusi Hari Selasa', notes: 'Plecing kangkung' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 20, day: 22, reference: 'Distribusi Hari Selasa', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 20, day: 22, reference: 'Distribusi Hari Selasa', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 20, day: 22, reference: 'Distribusi Hari Selasa', notes: 'Sendok' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 40, day: 23, reference: 'Distribusi Hari Rabu', notes: 'Memasak 220 porsi' },
    { itemName: 'Telur Ayam', type: 'Keluar', quantity: 10, day: 23, reference: 'Distribusi Hari Rabu', notes: 'Telur goreng/balado' },
    { itemName: 'Tempe', type: 'Keluar', quantity: 4, day: 23, reference: 'Distribusi Hari Rabu', notes: 'Tempe orek' },
    { itemName: 'Cabai Merah Keriting', type: 'Keluar', quantity: 1.5, day: 23, reference: 'Distribusi Hari Rabu', notes: 'Sambal' },
    { itemName: 'Bawang Putih', type: 'Keluar', quantity: 1.5, day: 23, reference: 'Distribusi Hari Rabu', notes: 'Bumbu' },
    { itemName: 'Kecap Manis', type: 'Keluar', quantity: 1, day: 23, reference: 'Distribusi Hari Rabu', notes: 'Bumbu tempe orek' },
    { itemName: 'Wortel', type: 'Keluar', quantity: 2, day: 23, reference: 'Distribusi Hari Rabu', notes: 'Sayur sop' },
    { itemName: 'Kotak Styrofoam 750ml', type: 'Keluar', quantity: 22, day: 23, reference: 'Distribusi Hari Rabu', notes: 'Kemasan menu komplit' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 22, day: 23, reference: 'Distribusi Hari Rabu', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 22, day: 23, reference: 'Distribusi Hari Rabu', notes: 'Sendok' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 25, reference: 'Distribusi Hari Jumat', notes: 'Memasak 200 porsi' },
    { itemName: 'Ikan Tongkol', type: 'Keluar', quantity: 7, day: 25, reference: 'Distribusi Hari Jumat', notes: 'Gulai ikan' },
    { itemName: 'Santan Kelapa', type: 'Keluar', quantity: 2, day: 25, reference: 'Distribusi Hari Jumat', notes: 'Gulai' },
    { itemName: 'Sayur Bayam', type: 'Keluar', quantity: 2, day: 25, reference: 'Distribusi Hari Jumat', notes: 'Sayur bening' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 2, day: 25, reference: 'Distribusi Hari Jumat', notes: 'Bumbu' },
    { itemName: 'Serai', type: 'Keluar', quantity: 0.5, day: 25, reference: 'Distribusi Hari Jumat', notes: 'Bumbu gulai' },
    { itemName: 'Daun Salam', type: 'Keluar', quantity: 0.1, day: 25, reference: 'Distribusi Hari Jumat', notes: 'Bumbu gulai' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 20, day: 25, reference: 'Distribusi Hari Jumat', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 20, day: 25, reference: 'Distribusi Hari Jumat', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 20, day: 25, reference: 'Distribusi Hari Jumat', notes: 'Sendok' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 28, reference: 'Distribusi Hari Senin', notes: 'Memasak 200 porsi' },
    { itemName: 'Ayam Potong', type: 'Keluar', quantity: 12, day: 28, reference: 'Distribusi Hari Senin', notes: 'Ayam pop/goreng' },
    { itemName: 'Telur Ayam', type: 'Keluar', quantity: 8, day: 28, reference: 'Distribusi Hari Senin', notes: 'Telur dadar' },
    { itemName: 'Tempe', type: 'Keluar', quantity: 4, day: 28, reference: 'Distribusi Hari Senin', notes: 'Tempe goreng' },
    { itemName: 'Sayur Kangkung', type: 'Keluar', quantity: 2.5, day: 28, reference: 'Distribusi Hari Senin', notes: 'Plecing kangkung' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 2.5, day: 28, reference: 'Distribusi Hari Senin', notes: 'Bumbu' },
    { itemName: 'Cabai Rawit', type: 'Keluar', quantity: 0.5, day: 28, reference: 'Distribusi Hari Senin', notes: 'Sambal' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 20, day: 28, reference: 'Distribusi Hari Senin', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 20, day: 28, reference: 'Distribusi Hari Senin', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 20, day: 28, reference: 'Distribusi Hari Senin', notes: 'Sendok' },
    { itemName: 'Sabun Cuci Piring', type: 'Keluar', quantity: 1, day: 28, reference: 'Keperluan Dapur', notes: 'Cuci alat masak' },
    { itemName: 'Deterjen Bubuk', type: 'Keluar', quantity: 1, day: 28, reference: 'Keperluan Dapur', notes: 'Cuci lap dan seragam' },

    // --- RESTOCK AKHIR BULAN (29-31 Juli) ---
    { itemName: 'Beras Premium', type: 'Masuk', quantity: 80, day: 29, reference: 'Dinas Kesehatan Kab. Buteng', notes: 'Persiapan Agustus' },
    { itemName: 'Minyak Goreng Curah', type: 'Masuk', quantity: 25, day: 29, reference: 'Toko Sembako', notes: 'Restock akhir bulan' },
    { itemName: 'Gula Pasir', type: 'Masuk', quantity: 15, day: 29, reference: 'Toko Sembako', notes: 'Restock' },
    { itemName: 'Tepung Terigu', type: 'Masuk', quantity: 10, day: 29, reference: 'Toko Bahan Kue', notes: 'Restock' },
    { itemName: 'Kacang Hijau', type: 'Masuk', quantity: 5, day: 29, reference: 'Toko Sembako', notes: 'Restock' },

    // --- PEMAKAIAN AKHIR BULAN (29-31 Juli) ---
    { itemName: 'Beras Premium', type: 'Keluar', quantity: 40, day: 29, reference: 'Distribusi Hari Selasa', notes: 'Memasak 220 porsi' },
    { itemName: 'Ikan Tongkol', type: 'Keluar', quantity: 8, day: 29, reference: 'Distribusi Hari Selasa', notes: 'Pindang tongkol' },
    { itemName: 'Tahu Putih', type: 'Keluar', quantity: 4, day: 29, reference: 'Distribusi Hari Selasa', notes: 'Tahu goreng' },
    { itemName: 'Sayur Bayam', type: 'Keluar', quantity: 2, day: 29, reference: 'Distribusi Hari Selasa', notes: 'Sayur bening' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 22, day: 29, reference: 'Distribusi Hari Selasa', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 22, day: 29, reference: 'Distribusi Hari Selasa', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 22, day: 29, reference: 'Distribusi Hari Selasa', notes: 'Sendok' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 35, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Memasak 200 porsi' },
    { itemName: 'Daging Sapi', type: 'Keluar', quantity: 7, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Rendang daging (persiapan HUT RI)' },
    { itemName: 'Santan Kelapa', type: 'Keluar', quantity: 3, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Rendang' },
    { itemName: 'Bawang Merah', type: 'Keluar', quantity: 3, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Bumbu rendang' },
    { itemName: 'Bawang Putih', type: 'Keluar', quantity: 2, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Bumbu rendang' },
    { itemName: 'Cabai Merah Keriting', type: 'Keluar', quantity: 2, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Bumbu rendang' },
    { itemName: 'Lengkuas', type: 'Keluar', quantity: 0.5, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Bumbu rendang' },
    { itemName: 'Daun Salam', type: 'Keluar', quantity: 0.2, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Bumbu rendang' },
    { itemName: 'Serai', type: 'Keluar', quantity: 0.5, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Bumbu rendang' },
    { itemName: 'Kentang', type: 'Keluar', quantity: 3, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Lauk pendamping' },
    { itemName: 'Kotak Styrofoam 750ml', type: 'Keluar', quantity: 22, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Kemasan menu spesial' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 22, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 22, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Sendok' },
    { itemName: 'Tisu Makan', type: 'Keluar', quantity: 1, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Tisu' },
    { itemName: 'Plastik Kemasan Besar', type: 'Keluar', quantity: 2, day: 30, reference: 'Distribusi Hari Rabu', notes: 'Bungkus lauk tambahan' },

    { itemName: 'Beras Premium', type: 'Keluar', quantity: 30, day: 31, reference: 'Distribusi Hari Kamis', notes: 'Memasak 180 porsi (hari terakhir)' },
    { itemName: 'Ayam Potong', type: 'Keluar', quantity: 10, day: 31, reference: 'Distribusi Hari Kamis', notes: 'Ayam goreng' },
    { itemName: 'Telur Ayam', type: 'Keluar', quantity: 8, day: 31, reference: 'Distribusi Hari Kamis', notes: 'Telur dadar' },
    { itemName: 'Mie Instan', type: 'Keluar', quantity: 2, day: 31, reference: 'Distribusi Hari Kamis', notes: 'Mie goreng tambahan' },
    { itemName: 'Sayur Kangkung', type: 'Keluar', quantity: 2, day: 31, reference: 'Distribusi Hari Kamis', notes: 'Plecing kangkung' },
    { itemName: 'Kotak Styrofoam 500ml', type: 'Keluar', quantity: 18, day: 31, reference: 'Distribusi Hari Kamis', notes: 'Kemasan' },
    { itemName: 'Gelas Plastik 220ml', type: 'Keluar', quantity: 18, day: 31, reference: 'Distribusi Hari Kamis', notes: 'Gelas' },
    { itemName: 'Sendok Plastik', type: 'Keluar', quantity: 18, day: 31, reference: 'Distribusi Hari Kamis', notes: 'Sendok' },
  ];

  // Filter out invalid transactions (quantity 0 or empty)
  return bulkPurchases.filter(tx => tx.quantity > 0);
}

// =============================================
// 3. MAIN: SEED DATA
// =============================================
async function main() {
  console.log('=== SEED DATA SIMULASI STOCK & GUDANG ===');
  console.log(`Periode: ${SIMULATION_MONTH} (1 bulan)`);
  console.log('');

  // Step 1: Clean existing data
  console.log('Step 1: Membersihkan data lama...');
  const { error: delTxErr } = await supabase.from('stock_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delTxErr) console.log('  Warning (transactions):', delTxErr.message);
  else console.log('  ✓ Transaksi lama dihapus');

  const { error: delItemErr } = await supabase.from('stock_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delItemErr) console.log('  Warning (items):', delItemErr.message);
  else console.log('  ✓ Barang lama dihapus');

  // Step 2: Calculate final stock_qty from transactions
  console.log('\nStep 2: Menghitung stok akhir dari transaksi...');
  const transactions = generateTransactions();
  const itemStockMap = {}; // name -> { masuk: total, keluar: total }

  // Initialize from stockItems
  for (const item of stockItems) {
    itemStockMap[item.name] = { masuk: 0, keluar: 0 };
  }

  for (const tx of transactions) {
    if (!itemStockMap[tx.itemName]) {
      console.log(`  Warning: Transaksi untuk item tidak terdaftar: ${tx.itemName}`);
      continue;
    }
    if (tx.type === 'Masuk') {
      itemStockMap[tx.itemName].masuk += tx.quantity;
    } else {
      itemStockMap[tx.itemName].keluar += tx.quantity;
    }
  }

  // Calculate final stock
  const finalItems = stockItems.map(item => {
    const balance = itemStockMap[item.name];
    const finalQty = (item.stock_qty || 0) + (balance?.masuk || 0) - (balance?.keluar || 0);
    return {
      ...item,
      stock_qty: Math.max(0, parseFloat(finalQty.toFixed(1)))
    };
  });

  console.log(`  Total item: ${finalItems.length}`);
  console.log(`  Total transaksi: ${transactions.length}`);

  // Step 3: Insert stock_items (with final stock_qty, WITHOUT trigger interference)
  console.log('\nStep 3: Menyimpan data barang...');
  // We need to insert items first, then insert transactions
  // But the trigger will auto-update stock_qty on transaction insert
  // So we need to: insert items with stock_qty=0, then insert all transactions (trigger will calculate), then update final stock_qty

  // Actually, the better approach: disable trigger, insert items with correct stock_qty, then insert transactions but manually prevent trigger
  // Since we can't easily disable triggers, let's:
  // 1. Insert items with stock_qty = 0
  // 2. The transactions will be inserted and trigger will update stock
  // 3. Then we update stock_items to set the correct final stock_qty

  const { data: insertedItems, error: insertErr } = await supabase
    .from('stock_items')
    .insert(finalItems.map(i => ({
      name: i.name,
      category: i.category,
      unit: i.unit,
      stock_qty: 0, // Will be updated after transactions
      min_stock: i.min_stock,
      location: i.location,
      description: i.description,
    })))
    .select('id, name');

  if (insertErr) {
    console.error('  ✗ Gagal insert barang:', insertErr.message);
    process.exit(1);
  }
  console.log(`  ✓ ${insertedItems.length} barang berhasil disimpan`);

  // Build name -> id map
  const nameToId = {};
  for (const item of insertedItems) {
    nameToId[item.name] = item.id;
  }

  // Step 4: Insert transactions (trigger will update stock_qty)
  console.log('\nStep 4: Menyimpan transaksi stok...');
  const validTxs = transactions.filter(tx => nameToId[tx.itemName]);

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  let totalInserted = 0;
  for (let i = 0; i < validTxs.length; i += BATCH_SIZE) {
    const batch = validTxs.slice(i, i + BATCH_SIZE);
    const { error: txErr } = await supabase
      .from('stock_transactions')
      .insert(batch.map(tx => ({
        item_id: nameToId[tx.itemName],
        type: tx.type,
        quantity: tx.quantity,
        transaction_date: dateStr(tx.day),
        notes: tx.notes,
        reference: tx.reference,
      })));

    if (txErr) {
      console.error(`  ✗ Gagal insert batch ${Math.floor(i/BATCH_SIZE)+1}:`, txErr.message);
    } else {
      totalInserted += batch.length;
    }
  }
  console.log(`  ✓ ${totalInserted} transaksi berhasil disimpan`);

  // Step 5: Update stock_qty to correct final values (override trigger-calculated values)
  console.log('\nStep 5: Memperbarui stok akhir...');
  let updatedCount = 0;
  for (const item of finalItems) {
    const id = nameToId[item.name];
    if (!id) continue;
    const { error: updErr } = await supabase
      .from('stock_items')
      .update({ stock_qty: item.stock_qty })
      .eq('id', id);
    if (updErr) {
      console.error(`  ✗ Gagal update ${item.name}:`, updErr.message);
    } else {
      updatedCount++;
    }
  }
  console.log(`  ✓ ${updatedCount} stok akhir diperbarui`);

  // Step 6: Summary
  console.log('\n=== RINGKASAN DATA SIMULASI ===');
  console.log(`Total Barang: ${finalItems.length} item`);
  console.log(`Total Transaksi: ${totalInserted} transaksi`);
  console.log(`  - Stok Masuk: ${validTxs.filter(t => t.type === 'Masuk').length} transaksi`);
  console.log(`  - Stok Keluar: ${validTxs.filter(t => t.type === 'Keluar').length} transaksi`);

  const categories = {};
  for (const item of finalItems) {
    if (!categories[item.category]) categories[item.category] = 0;
    categories[item.category]++;
  }
  console.log('\nPer Kategori:');
  for (const [cat, count] of Object.entries(categories)) {
    console.log(`  - ${cat}: ${count} item`);
  }

  const lowStock = finalItems.filter(i => i.min_stock > 0 && i.stock_qty <= i.min_stock);
  if (lowStock.length > 0) {
    console.log(`\n⚠ Stok Menipis (${lowStock.length} item):`);
    for (const item of lowStock) {
      console.log(`  - ${item.name}: ${item.stock_qty}/${item.min_stock} ${item.unit}`);
    }
  }

  console.log('\n✅ Seed data simulasi 1 bulan berhasil!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
