import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MIGRATION_SQL = `-- MODUL GUDANG & STOK - Dapur SPPG BGN
CREATE TABLE IF NOT EXISTS stock_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Lainnya',
  unit TEXT DEFAULT 'pcs',
  stock_qty NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 0,
  location TEXT DEFAULT '-',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Masuk', 'Keluar')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  transaction_date DATE NOT NULL,
  notes TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on stock_items" ON stock_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock_transactions" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_id ON stock_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(transaction_date DESC);

CREATE OR REPLACE FUNCTION update_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'Masuk' THEN
    UPDATE stock_items SET stock_qty = stock_qty + NEW.quantity WHERE id = NEW.item_id;
  ELSIF NEW.type = 'Keluar' THEN
    UPDATE stock_items SET stock_qty = stock_qty - NEW.quantity WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_transaction ON stock_transactions;
CREATE TRIGGER trg_stock_transaction
  AFTER INSERT ON stock_transactions
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_transaction();`

// Stock items data
const STOCK_ITEMS = [
  // Bahan Makanan
  { name: 'Beras Premium', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 50, location: 'Rak A-1', description: 'Beras IR64 kualitas premium' },
  { name: 'Minyak Goreng Curah', category: 'Bahan Makanan', unit: 'liter', stock_qty: 0, min_stock: 20, location: 'Rak A-2', description: 'Minyak goreng kelapa sawit curah' },
  { name: 'Telur Ayam', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 10, location: 'Kulkas 1', description: 'Telur ayam negeri segar' },
  { name: 'Tahu Putih', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 5, location: 'Kulkas 2', description: 'Tahu putih segar' },
  { name: 'Tempe', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 5, location: 'Kulkas 2', description: 'Tempe kedelai segar' },
  { name: 'Ikan Tongkol', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 10, location: 'Freezer 1', description: 'Tongkol segar/beku' },
  { name: 'Ikan Teri', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 3, location: 'Rak B-1', description: 'Teri medan kering' },
  { name: 'Ayam Potong', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 15, location: 'Freezer 2', description: 'Ayam potong segar' },
  { name: 'Daging Sapi', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 5, location: 'Freezer 2', description: 'Daging sapi has dalam' },
  { name: 'Sayur Bayam', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 3, location: 'Kulkas 3', description: 'Bayam hijau segar' },
  { name: 'Sayur Kangkung', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 2, location: 'Kulkas 3', description: 'Kangkung darat segar' },
  { name: 'Wortel', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 3, location: 'Kulkas 3', description: 'Wortel lokal' },
  { name: 'Kentang', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 5, location: 'Rak A-3', description: 'Kentang konsumsi' },
  { name: 'Kacang Hijau', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 5, location: 'Rak B-2', description: 'Kacang hijau kering' },
  { name: 'Kacang Tanah', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 3, location: 'Rak B-2', description: 'Kacang tanah sangrai' },
  { name: 'Mie Instan', category: 'Bahan Makanan', unit: 'karton', stock_qty: 0, min_stock: 8, location: 'Rak C-1', description: 'Mie instan berbagai rasa' },
  { name: 'Tepung Terigu', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 10, location: 'Rak A-3', description: 'Tepung terigu segitiga biru' },
  { name: 'Gula Pasir', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 8, location: 'Rak A-2', description: 'Gula pasir putih' },
  { name: 'Susu UHT', category: 'Bahan Makanan', unit: 'karton', stock_qty: 0, min_stock: 5, location: 'Kulkas 1', description: 'Susu UHT full cream 1L' },
  { name: 'Makaroni', category: 'Bahan Makanan', unit: 'kg', stock_qty: 0, min_stock: 3, location: 'Rak C-2', description: 'Makaroni kering' },
  // Bumbu Dapur
  { name: 'Bawang Merah', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 5, location: 'Rak D-1', description: 'Bawang merah lokal' },
  { name: 'Bawang Putih', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 4, location: 'Rak D-1', description: 'Bawang putih lokal' },
  { name: 'Cabai Merah Keriting', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 3, location: 'Kulkas 3', description: 'Cabai merah keriting segar' },
  { name: 'Cabai Rawit', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 1, location: 'Kulkas 3', description: 'Cabai rawit hijau/merah' },
  { name: 'Kunyit', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 2, location: 'Rak D-2', description: 'Kunyit segar' },
  { name: 'Jahe', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 1, location: 'Rak D-2', description: 'Jahe emprit segar' },
  { name: 'Lengkuas', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 1, location: 'Rak D-2', description: 'Lengkuas segar' },
  { name: 'Serai', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 1, location: 'Rak D-2', description: 'Serai segar' },
  { name: 'Daun Salam', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 0.5, location: 'Rak D-3', description: 'Daun salam kering' },
  { name: 'Daun Jeruk', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 0.2, location: 'Rak D-3', description: 'Daun jeruk purut kering' },
  { name: 'Kecap Manis', category: 'Bumbu Dapur', unit: 'liter', stock_qty: 0, min_stock: 3, location: 'Rak D-4', description: 'Kecap manis ABC' },
  { name: 'Kecap Asin', category: 'Bumbu Dapur', unit: 'liter', stock_qty: 0, min_stock: 1, location: 'Rak D-4', description: 'Kecap asin' },
  { name: 'Saus Tomat', category: 'Bumbu Dapur', unit: 'liter', stock_qty: 0, min_stock: 2, location: 'Rak D-4', description: 'Saus tomat botolan' },
  { name: 'Garam Dapur', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 5, location: 'Rak D-1', description: 'Garam beryodium' },
  { name: 'Merica Bubuk', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 0.5, location: 'Rak D-3', description: 'Merica putih bubuk' },
  { name: 'Ketumbar Bubuk', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 0.3, location: 'Rak D-3', description: 'Ketumbar halus' },
  { name: 'Bawang Goreng', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 1, location: 'Rak D-5', description: 'Bawang goreng siap pakai' },
  { name: 'Terasi Udang', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 1, location: 'Rak D-5', description: 'Terasi udang bakar' },
  { name: 'Santan Kelapa', category: 'Bumbu Dapur', unit: 'liter', stock_qty: 0, min_stock: 4, location: 'Rak D-5', description: 'Santan kelapa kental' },
  { name: 'Penyedap Rasa', category: 'Bumbu Dapur', unit: 'kg', stock_qty: 0, min_stock: 1, location: 'Rak D-4', description: 'MSG / penyedap masakan' },
  // Peralatan Masak
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
  // Bahan Kemasan
  { name: 'Kotak Styrofoam 500ml', category: 'Bahan Kemasan', unit: 'lusin', stock_qty: 0, min_stock: 20, location: 'Gudang K-1', description: 'Kotak styrofoam 500ml' },
  { name: 'Kotak Styrofoam 750ml', category: 'Bahan Kemasan', unit: 'lusin', stock_qty: 0, min_stock: 15, location: 'Gudang K-1', description: 'Kotak styrofoam 750ml' },
  { name: 'Plastik Kemasan Besar', category: 'Bahan Kemasan', unit: 'rim', stock_qty: 0, min_stock: 5, location: 'Gudang K-2', description: 'Plastik kresek besar' },
  { name: 'Plastik Kemasan Kecil', category: 'Bahan Kemasan', unit: 'rim', stock_qty: 0, min_stock: 8, location: 'Gudang K-2', description: 'Plastik kecil untuk lauk' },
  { name: 'Gelas Plastik 220ml', category: 'Bahan Kemasan', unit: 'lusin', stock_qty: 0, min_stock: 15, location: 'Gudang K-3', description: 'Gelas plastik sekali pakai' },
  { name: 'Sendok Plastik', category: 'Bahan Kemasan', unit: 'lusin', stock_qty: 0, min_stock: 25, location: 'Gudang K-3', description: 'Sendok plastik sekali pakai' },
  { name: 'Tisu Makan', category: 'Bahan Kemasan', unit: 'rim', stock_qty: 0, min_stock: 4, location: 'Gudang K-4', description: 'Tisu makan / napkin' },
  { name: 'Lap Penutup Makanan', category: 'Bahan Kemasan', unit: 'pcs', stock_qty: 0, min_stock: 10, location: 'Gudang K-4', description: 'Penutup makanan plastik' },
  // Lainnya
  { name: 'Sabun Cuci Piring', category: 'Lainnya', unit: 'pcs', stock_qty: 0, min_stock: 3, location: 'Rak L-1', description: 'Sunlight / sabun cuci piring' },
  { name: 'Sabun Mandi', category: 'Lainnya', unit: 'pcs', stock_qty: 0, min_stock: 5, location: 'Rak L-1', description: 'Sabun mandi batangan' },
  { name: 'Deterjen Bubuk', category: 'Lainnya', unit: 'kg', stock_qty: 0, min_stock: 2, location: 'Rak L-2', description: 'Deterjen bubuk' },
  { name: 'Pembersih Lantai', category: 'Lainnya', unit: 'liter', stock_qty: 0, min_stock: 2, location: 'Rak L-2', description: 'Floor cleaner cair' },
  { name: 'Sapu Ijuk', category: 'Lainnya', unit: 'pcs', stock_qty: 0, min_stock: 1, location: 'Tempat Sapu', description: 'Sapu ijuk' },
  { name: 'Kain Lap Microfiber', category: 'Lainnya', unit: 'pcs', stock_qty: 0, min_stock: 5, location: 'Rak L-3', description: 'Kain lap serbaguna' },
  { name: 'Sarung Tangan Dapur', category: 'Lainnya', unit: 'pcs', stock_qty: 0, min_stock: 3, location: 'Rak L-1', description: 'Sarung tangan anti panas' },
  { name: 'Ember Plastik 20L', category: 'Lainnya', unit: 'pcs', stock_qty: 0, min_stock: 2, location: 'Rak L-3', description: 'Ember plastik besar' },
  { name: 'Bak Air Stainless', category: 'Lainnya', unit: 'pcs', stock_qty: 0, min_stock: 1, location: 'Area Cuci', description: 'Bak cuci piring stainless' },
  { name: 'Koran Bekas', category: 'Lainnya', unit: 'bundel', stock_qty: 0, min_stock: 2, location: 'Gudang K-5', description: 'Koran bekas untuk alas' },
]

function pad(n: number) { return String(n).padStart(2, '0') }

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
  { name: 'Tahu Putih', type: 'Masuk', qty: 15, day: 2, ref: 'Produsen Tahu Lokal', notes: 'Pengiriman tahu' },
  { name: 'Tempe', type: 'Masuk', qty: 12, day: 2, ref: 'Produsen Tempe Lokal', notes: 'Pengiriman tempe' },
  { name: 'Santan Kelapa', type: 'Masuk', qty: 10, day: 2, ref: 'Pasar Tradisional Wakatobi', notes: 'Santan kelapa segar' },
  { name: 'Kecap Manis', type: 'Masuk', qty: 8, day: 2, ref: 'Toko Sembako', notes: 'Restock kecap manis' },
  { name: 'Garam Dapur', type: 'Masuk', qty: 15, day: 2, ref: 'Toko Sembako', notes: 'Restock garam' },
  { name: 'Sayur Bayam', type: 'Masuk', qty: 8, day: 3, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Sayur Kangkung', type: 'Masuk', qty: 6, day: 3, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Wortel', type: 'Masuk', qty: 10, day: 3, ref: 'Pasar Tradisional Wakatobi', notes: 'Pembelian sayur' },
  { name: 'Kentang', type: 'Masuk', qty: 12, day: 3, ref: 'Pasar Tradisional Wakatobi', notes: 'Pembelian sayur' },
  { name: 'Ikan Teri', type: 'Masuk', qty: 10, day: 3, ref: 'Nelayan Lokal', notes: 'Teri nelayan' },
  { name: 'Daging Sapi', type: 'Masuk', qty: 20, day: 3, ref: 'RPH Buton Tengah', notes: 'Pengadaan daging' },
  { name: 'Kotak Styrofoam 500ml', type: 'Masuk', qty: 60, day: 3, ref: 'Toko Plastik', notes: 'Restock kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Masuk', qty: 50, day: 3, ref: 'Toko Plastik', notes: 'Restock gelas' },
  { name: 'Sendok Plastik', type: 'Masuk', qty: 80, day: 3, ref: 'Toko Plastik', notes: 'Restock sendok' },
  // PEMAKAIAN MINGGU 1
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 4, ref: 'Distribusi Senin', notes: '200 porsi siswa' },
  { name: 'Minyak Goreng Curah', type: 'Keluar', qty: 8, day: 4, ref: 'Distribusi Senin', notes: 'Tumis dan goreng' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 3, day: 4, ref: 'Distribusi Senin', notes: 'Bumbu masakan' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 2, day: 4, ref: 'Distribusi Senin', notes: 'Bumbu masakan' },
  { name: 'Cabai Merah Keriting', type: 'Keluar', qty: 1.5, day: 4, ref: 'Distribusi Senin', notes: 'Sambal dan bumbu' },
  { name: 'Ayam Potong', type: 'Keluar', qty: 12, day: 4, ref: 'Distribusi Senin', notes: 'Ayam goreng' },
  { name: 'Telur Ayam', type: 'Keluar', qty: 8, day: 4, ref: 'Distribusi Senin', notes: 'Telur dadar/balado' },
  { name: 'Tahu Putih', type: 'Keluar', qty: 4, day: 4, ref: 'Distribusi Senin', notes: 'Tahu goreng' },
  { name: 'Tempe', type: 'Keluar', qty: 3, day: 4, ref: 'Distribusi Senin', notes: 'Tempe goreng' },
  { name: 'Sayur Bayam', type: 'Keluar', qty: 2, day: 4, ref: 'Distribusi Senin', notes: 'Sayur bening' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 4, ref: 'Distribusi Senin', notes: 'Kemasan nasi kotak' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 4, ref: 'Distribusi Senin', notes: 'Gelas minum' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 4, ref: 'Distribusi Senin', notes: 'Sendok makan' },
  { name: 'Plastik Kemasan Kecil', type: 'Keluar', qty: 2, day: 4, ref: 'Distribusi Senin', notes: 'Plastik bungkus lauk' },
  { name: 'Garam Dapur', type: 'Keluar', qty: 1, day: 4, ref: 'Distribusi Senin', notes: 'Bumbu masakan' },
  { name: 'Gula Pasir', type: 'Keluar', qty: 2, day: 4, ref: 'Distribusi Senin', notes: 'Pemanis' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 5, ref: 'Distribusi Selasa', notes: '200 porsi' },
  { name: 'Ikan Tongkol', type: 'Keluar', qty: 8, day: 5, ref: 'Distribusi Selasa', notes: 'Pindang tongkol' },
  { name: 'Minyak Goreng Curah', type: 'Keluar', qty: 7, day: 5, ref: 'Distribusi Selasa', notes: 'Memasak' },
  { name: 'Kunyit', type: 'Keluar', qty: 1, day: 5, ref: 'Distribusi Selasa', notes: 'Bumbu kuning' },
  { name: 'Jahe', type: 'Keluar', qty: 0.5, day: 5, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Serai', type: 'Keluar', qty: 0.5, day: 5, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Santan Kelapa', type: 'Keluar', qty: 2, day: 5, ref: 'Distribusi Selasa', notes: 'Sayur santan' },
  { name: 'Sayur Kangkung', type: 'Keluar', qty: 2, day: 5, ref: 'Distribusi Selasa', notes: 'Plecing kangkung' },
  { name: 'Kecap Manis', type: 'Keluar', qty: 1, day: 5, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Tisu Makan', type: 'Keluar', qty: 1, day: 5, ref: 'Distribusi Selasa', notes: 'Tisu makan' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 18, day: 5, ref: 'Distribusi Selasa', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 18, day: 5, ref: 'Distribusi Selasa', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 18, day: 5, ref: 'Distribusi Selasa', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 40, day: 7, ref: 'Distribusi Kamis', notes: '220 porsi' },
  { name: 'Daging Sapi', type: 'Keluar', qty: 8, day: 7, ref: 'Distribusi Kamis', notes: 'Rendang daging' },
  { name: 'Kentang', type: 'Keluar', qty: 3, day: 7, ref: 'Distribusi Kamis', notes: 'Kentang kecap' },
  { name: 'Wortel', type: 'Keluar', qty: 2, day: 7, ref: 'Distribusi Kamis', notes: 'Sayur sop' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2.5, day: 7, ref: 'Distribusi Kamis', notes: 'Bumbu rendang' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 2, day: 7, ref: 'Distribusi Kamis', notes: 'Bumbu' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 0.5, day: 7, ref: 'Distribusi Kamis', notes: 'Sambal' },
  { name: 'Santan Kelapa', type: 'Keluar', qty: 3, day: 7, ref: 'Distribusi Kamis', notes: 'Rendang dan gulai' },
  { name: 'Kecap Manis', type: 'Keluar', qty: 1.5, day: 7, ref: 'Distribusi Kamis', notes: 'Kentang kecap' },
  { name: 'Lengkuas', type: 'Keluar', qty: 0.5, day: 7, ref: 'Distribusi Kamis', notes: 'Bumbu rendang' },
  { name: 'Daun Salam', type: 'Keluar', qty: 0.2, day: 7, ref: 'Distribusi Kamis', notes: 'Bumbu rendang' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 22, day: 7, ref: 'Distribusi Kamis', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 22, day: 7, ref: 'Distribusi Kamis', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 22, day: 7, ref: 'Distribusi Kamis', notes: 'Sendok' },
  { name: 'Plastik Kemasan Besar', type: 'Keluar', qty: 2, day: 7, ref: 'Distribusi Kamis', notes: 'Bungkus besar' },
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
  { name: 'Ayam Potong', type: 'Keluar', qty: 12, day: 14, ref: 'Distribusi Senin', notes: 'Ayam penyet' },
  { name: 'Tempe', type: 'Keluar', qty: 5, day: 14, ref: 'Distribusi Senin', notes: 'Tempe penyet' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 1, day: 14, ref: 'Distribusi Senin', notes: 'Sambal penyet' },
  { name: 'Tahu Putih', type: 'Keluar', qty: 5, day: 14, ref: 'Distribusi Senin', notes: 'Tahu penyet' },
  { name: 'Sayur Kangkung', type: 'Keluar', qty: 3, day: 14, ref: 'Distribusi Senin', notes: 'Plecing kangkung' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 14, ref: 'Distribusi Senin', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 14, ref: 'Distribusi Senin', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 14, ref: 'Distribusi Senin', notes: 'Sendok' },
  { name: 'Sabun Cuci Piring', type: 'Keluar', qty: 1, day: 14, ref: 'Keperluan Dapur', notes: 'Cuci peralatan' },
  // RESTOCK MINGGU 3
  { name: 'Beras Premium', type: 'Masuk', qty: 100, day: 15, ref: 'Dinas Kesehatan', notes: 'Tambahan pertengahan bulan' },
  { name: 'Minyak Goreng Curah', type: 'Masuk', qty: 20, day: 15, ref: 'Toko Sembako', notes: 'Restock' },
  { name: 'Ayam Potong', type: 'Masuk', qty: 45, day: 15, ref: 'Distributor Ayam', notes: 'Pengiriman mingguan' },
  { name: 'Ikan Tongkol', type: 'Masuk', qty: 25, day: 15, ref: 'Nelayan Lokal', notes: 'Restock' },
  { name: 'Telur Ayam', type: 'Masuk', qty: 30, day: 16, ref: 'Peternakan Ayam', notes: 'Restock' },
  { name: 'Bawang Merah', type: 'Masuk', qty: 12, day: 16, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Bawang Putih', type: 'Masuk', qty: 8, day: 16, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Cabai Merah Keriting', type: 'Masuk', qty: 5, day: 16, ref: 'Pasar Tradisional', notes: 'Restock cabai' },
  { name: 'Sayur Bayam', type: 'Masuk', qty: 5, day: 16, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Wortel', type: 'Masuk', qty: 8, day: 16, ref: 'Pasar Tradisional', notes: 'Restock sayur' },
  { name: 'Kacang Hijau', type: 'Masuk', qty: 5, day: 16, ref: 'Toko Sembako', notes: 'Restock' },
  { name: 'Tahu Putih', type: 'Masuk', qty: 12, day: 17, ref: 'Produsen Tahu', notes: 'Restock' },
  { name: 'Tempe', type: 'Masuk', qty: 10, day: 17, ref: 'Produsen Tempe', notes: 'Restock' },
  { name: 'Santan Kelapa', type: 'Masuk', qty: 5, day: 17, ref: 'Pasar Tradisional', notes: 'Restock' },
  { name: 'Ikan Teri', type: 'Masuk', qty: 5, day: 17, ref: 'Nelayan Lokal', notes: 'Restock' },
  { name: 'Mie Instan', type: 'Masuk', qty: 15, day: 17, ref: 'Distributor Mie', notes: 'Restock' },
  { name: 'Kotak Styrofoam 500ml', type: 'Masuk', qty: 40, day: 17, ref: 'Toko Plastik', notes: 'Restock' },
  { name: 'Gelas Plastik 220ml', type: 'Masuk', qty: 30, day: 17, ref: 'Toko Plastik', notes: 'Restock' },
  { name: 'Sendok Plastik', type: 'Masuk', qty: 50, day: 17, ref: 'Toko Plastik', notes: 'Restock' },
  { name: 'Plastik Kemasan Besar', type: 'Masuk', qty: 5, day: 17, ref: 'Toko Plastik', notes: 'Restock' },
  { name: 'Plastik Kemasan Kecil', type: 'Masuk', qty: 5, day: 17, ref: 'Toko Plastik', notes: 'Restock' },
  // PEMAKAIAN MINGGU 3
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 15, ref: 'Distribusi Selasa', notes: '200 porsi' },
  { name: 'Ikan Tongkol', type: 'Keluar', qty: 8, day: 15, ref: 'Distribusi Selasa', notes: 'Gulai ikan' },
  { name: 'Kentang', type: 'Keluar', qty: 3, day: 15, ref: 'Distribusi Selasa', notes: 'Goreng kentang' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 15, ref: 'Distribusi Selasa', notes: 'Bumbu gulai' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 15, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Santan Kelapa', type: 'Keluar', qty: 2.5, day: 15, ref: 'Distribusi Selasa', notes: 'Gulai' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 15, ref: 'Distribusi Selasa', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 15, ref: 'Distribusi Selasa', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 15, ref: 'Distribusi Selasa', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 40, day: 16, ref: 'Distribusi Rabu', notes: '220 porsi' },
  { name: 'Ayam Potong', type: 'Keluar', qty: 14, day: 16, ref: 'Distribusi Rabu', notes: 'Ayam goreng' },
  { name: 'Telur Ayam', type: 'Keluar', qty: 10, day: 16, ref: 'Distribusi Rabu', notes: 'Telur dadar' },
  { name: 'Tahu Putih', type: 'Keluar', qty: 5, day: 16, ref: 'Distribusi Rabu', notes: 'Tahu goreng' },
  { name: 'Sayur Bayam', type: 'Keluar', qty: 2.5, day: 16, ref: 'Distribusi Rabu', notes: 'Sayur bening' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 0.5, day: 16, ref: 'Distribusi Rabu', notes: 'Sambal' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2.5, day: 16, ref: 'Distribusi Rabu', notes: 'Bumbu' },
  { name: 'Kotak Styrofoam 750ml', type: 'Keluar', qty: 22, day: 16, ref: 'Distribusi Rabu', notes: 'Menu komplit' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 22, day: 16, ref: 'Distribusi Rabu', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 22, day: 16, ref: 'Distribusi Rabu', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 18, ref: 'Distribusi Jumat', notes: '200 porsi' },
  { name: 'Daging Sapi', type: 'Keluar', qty: 5, day: 18, ref: 'Distribusi Jumat', notes: 'Semur daging' },
  { name: 'Kentang', type: 'Keluar', qty: 3, day: 18, ref: 'Distribusi Jumat', notes: 'Semur kentang' },
  { name: 'Kecap Manis', type: 'Keluar', qty: 2, day: 18, ref: 'Distribusi Jumat', notes: 'Bumbu semur' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 2, day: 18, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 18, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Wortel', type: 'Keluar', qty: 3, day: 18, ref: 'Distribusi Jumat', notes: 'Sayur sop' },
  { name: 'Mie Instan', type: 'Keluar', qty: 3, day: 18, ref: 'Distribusi Jumat', notes: 'Mie goreng' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 18, ref: 'Distribusi Jumat', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 18, ref: 'Distribusi Jumat', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 18, ref: 'Distribusi Jumat', notes: 'Sendok' },
  { name: 'Tisu Makan', type: 'Keluar', qty: 1, day: 18, ref: 'Distribusi Jumat', notes: 'Tisu' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 21, ref: 'Distribusi Senin', notes: '200 porsi' },
  { name: 'Ikan Tongkol', type: 'Keluar', qty: 8, day: 21, ref: 'Distribusi Senin', notes: 'Pindang' },
  { name: 'Tempe', type: 'Keluar', qty: 5, day: 21, ref: 'Distribusi Senin', notes: 'Tempe goreng' },
  { name: 'Ikan Teri', type: 'Keluar', qty: 2, day: 21, ref: 'Distribusi Senin', notes: 'Peyek teri' },
  { name: 'Kacang Tanah', type: 'Keluar', qty: 2, day: 21, ref: 'Distribusi Senin', notes: 'Peyek teri' },
  { name: 'Tepung Terigu', type: 'Keluar', qty: 3, day: 21, ref: 'Distribusi Senin', notes: 'Adonan peyek' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 21, ref: 'Distribusi Senin', notes: 'Bumbu' },
  { name: 'Cabai Merah Keriting', type: 'Keluar', qty: 1.5, day: 21, ref: 'Distribusi Senin', notes: 'Sambal' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 21, ref: 'Distribusi Senin', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 21, ref: 'Distribusi Senin', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 21, ref: 'Distribusi Senin', notes: 'Sendok' },
  { name: 'Sabun Cuci Piring', type: 'Keluar', qty: 1, day: 21, ref: 'Keperluan Dapur', notes: 'Cuci alat masak' },
  // RESTOCK MINGGU 4
  { name: 'Ayam Potong', type: 'Masuk', qty: 50, day: 22, ref: 'Distributor Ayam', notes: 'Pengiriman mingguan' },
  { name: 'Telur Ayam', type: 'Masuk', qty: 20, day: 22, ref: 'Peternakan Ayam', notes: 'Restock' },
  { name: 'Bawang Merah', type: 'Masuk', qty: 10, day: 22, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Bawang Putih', type: 'Masuk', qty: 6, day: 22, ref: 'Pasar Tradisional', notes: 'Bumbu mingguan' },
  { name: 'Cabai Merah Keriting', type: 'Masuk', qty: 4, day: 22, ref: 'Pasar Tradisional', notes: 'Restock' },
  { name: 'Sayur Kangkung', type: 'Masuk', qty: 5, day: 22, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Sayur Bayam', type: 'Masuk', qty: 5, day: 22, ref: 'Petani Lokal', notes: 'Sayur segar' },
  { name: 'Tahu Putih', type: 'Masuk', qty: 10, day: 23, ref: 'Produsen Tahu', notes: 'Restock' },
  { name: 'Tempe', type: 'Masuk', qty: 8, day: 23, ref: 'Produsen Tempe', notes: 'Restock' },
  { name: 'Ikan Tongkol', type: 'Masuk', qty: 15, day: 23, ref: 'Nelayan Lokal', notes: 'Restock' },
  { name: 'Susu UHT', type: 'Masuk', qty: 10, day: 24, ref: 'Distributor Susu', notes: 'Restock' },
  { name: 'Kotak Styrofoam 500ml', type: 'Masuk', qty: 30, day: 24, ref: 'Toko Plastik', notes: 'Restock' },
  { name: 'Gelas Plastik 220ml', type: 'Masuk', qty: 25, day: 24, ref: 'Toko Plastik', notes: 'Restock' },
  { name: 'Sendok Plastik', type: 'Masuk', qty: 40, day: 24, ref: 'Toko Plastik', notes: 'Restock' },
  { name: 'Deterjen Bubuk', type: 'Masuk', qty: 3, day: 24, ref: 'Toko Sembako', notes: 'Restock' },
  { name: 'Kain Lap Microfiber', type: 'Masuk', qty: 6, day: 24, ref: 'Toko Alat Kebersihan', notes: 'Restock' },
  // PEMAKAIAN MINGGU 4
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 22, ref: 'Distribusi Selasa', notes: '200 porsi' },
  { name: 'Ayam Potong', type: 'Keluar', qty: 12, day: 22, ref: 'Distribusi Selasa', notes: 'Ayam goreng lengkuas' },
  { name: 'Tahu Putih', type: 'Keluar', qty: 4, day: 22, ref: 'Distribusi Selasa', notes: 'Tahu goreng' },
  { name: 'Lengkuas', type: 'Keluar', qty: 0.5, day: 22, ref: 'Distribusi Selasa', notes: 'Bumbu ayam' },
  { name: 'Jahe', type: 'Keluar', qty: 0.5, day: 22, ref: 'Distribusi Selasa', notes: 'Bumbu ayam' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 22, ref: 'Distribusi Selasa', notes: 'Bumbu' },
  { name: 'Sayur Kangkung', type: 'Keluar', qty: 2, day: 22, ref: 'Distribusi Selasa', notes: 'Plecing kangkung' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 22, ref: 'Distribusi Selasa', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 22, ref: 'Distribusi Selasa', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 22, ref: 'Distribusi Selasa', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 40, day: 23, ref: 'Distribusi Rabu', notes: '220 porsi' },
  { name: 'Telur Ayam', type: 'Keluar', qty: 10, day: 23, ref: 'Distribusi Rabu', notes: 'Telur goreng' },
  { name: 'Tempe', type: 'Keluar', qty: 4, day: 23, ref: 'Distribusi Rabu', notes: 'Tempe orek' },
  { name: 'Cabai Merah Keriting', type: 'Keluar', qty: 1.5, day: 23, ref: 'Distribusi Rabu', notes: 'Sambal' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 1.5, day: 23, ref: 'Distribusi Rabu', notes: 'Bumbu' },
  { name: 'Kecap Manis', type: 'Keluar', qty: 1, day: 23, ref: 'Distribusi Rabu', notes: 'Bumbu tempe' },
  { name: 'Wortel', type: 'Keluar', qty: 2, day: 23, ref: 'Distribusi Rabu', notes: 'Sayur sop' },
  { name: 'Kotak Styrofoam 750ml', type: 'Keluar', qty: 22, day: 23, ref: 'Distribusi Rabu', notes: 'Menu komplit' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 22, day: 23, ref: 'Distribusi Rabu', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 22, day: 23, ref: 'Distribusi Rabu', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 25, ref: 'Distribusi Jumat', notes: '200 porsi' },
  { name: 'Ikan Tongkol', type: 'Keluar', qty: 7, day: 25, ref: 'Distribusi Jumat', notes: 'Gulai ikan' },
  { name: 'Santan Kelapa', type: 'Keluar', qty: 2, day: 25, ref: 'Distribusi Jumat', notes: 'Gulai' },
  { name: 'Sayur Bayam', type: 'Keluar', qty: 2, day: 25, ref: 'Distribusi Jumat', notes: 'Sayur bening' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2, day: 25, ref: 'Distribusi Jumat', notes: 'Bumbu' },
  { name: 'Serai', type: 'Keluar', qty: 0.5, day: 25, ref: 'Distribusi Jumat', notes: 'Bumbu gulai' },
  { name: 'Daun Salam', type: 'Keluar', qty: 0.1, day: 25, ref: 'Distribusi Jumat', notes: 'Bumbu gulai' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 25, ref: 'Distribusi Jumat', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 25, ref: 'Distribusi Jumat', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 25, ref: 'Distribusi Jumat', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 28, ref: 'Distribusi Senin', notes: '200 porsi' },
  { name: 'Ayam Potong', type: 'Keluar', qty: 12, day: 28, ref: 'Distribusi Senin', notes: 'Ayam pop' },
  { name: 'Telur Ayam', type: 'Keluar', qty: 8, day: 28, ref: 'Distribusi Senin', notes: 'Telur dadar' },
  { name: 'Tempe', type: 'Keluar', qty: 4, day: 28, ref: 'Distribusi Senin', notes: 'Tempe goreng' },
  { name: 'Sayur Kangkung', type: 'Keluar', qty: 2.5, day: 28, ref: 'Distribusi Senin', notes: 'Plecing' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 2.5, day: 28, ref: 'Distribusi Senin', notes: 'Bumbu' },
  { name: 'Cabai Rawit', type: 'Keluar', qty: 0.5, day: 28, ref: 'Distribusi Senin', notes: 'Sambal' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 20, day: 28, ref: 'Distribusi Senin', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 20, day: 28, ref: 'Distribusi Senin', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 20, day: 28, ref: 'Distribusi Senin', notes: 'Sendok' },
  { name: 'Sabun Cuci Piring', type: 'Keluar', qty: 1, day: 28, ref: 'Keperluan Dapur', notes: 'Cuci alat' },
  { name: 'Deterjen Bubuk', type: 'Keluar', qty: 1, day: 28, ref: 'Keperluan Dapur', notes: 'Cuci lap' },
  // AKHIR BULAN
  { name: 'Beras Premium', type: 'Masuk', qty: 80, day: 29, ref: 'Dinas Kesehatan', notes: 'Persiapan Agustus' },
  { name: 'Minyak Goreng Curah', type: 'Masuk', qty: 25, day: 29, ref: 'Toko Sembako', notes: 'Restock' },
  { name: 'Gula Pasir', type: 'Masuk', qty: 15, day: 29, ref: 'Toko Sembako', notes: 'Restock' },
  { name: 'Tepung Terigu', type: 'Masuk', qty: 10, day: 29, ref: 'Toko Bahan Kue', notes: 'Restock' },
  { name: 'Kacang Hijau', type: 'Masuk', qty: 5, day: 29, ref: 'Toko Sembako', notes: 'Restock' },
  { name: 'Beras Premium', type: 'Keluar', qty: 40, day: 29, ref: 'Distribusi Selasa', notes: '220 porsi' },
  { name: 'Ikan Tongkol', type: 'Keluar', qty: 8, day: 29, ref: 'Distribusi Selasa', notes: 'Pindang' },
  { name: 'Tahu Putih', type: 'Keluar', qty: 4, day: 29, ref: 'Distribusi Selasa', notes: 'Tahu goreng' },
  { name: 'Sayur Bayam', type: 'Keluar', qty: 2, day: 29, ref: 'Distribusi Selasa', notes: 'Sayur bening' },
  { name: 'Kotak Styrofoam 500ml', type: 'Keluar', qty: 22, day: 29, ref: 'Distribusi Selasa', notes: 'Kemasan' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 22, day: 29, ref: 'Distribusi Selasa', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 22, day: 29, ref: 'Distribusi Selasa', notes: 'Sendok' },
  { name: 'Beras Premium', type: 'Keluar', qty: 35, day: 30, ref: 'Distribusi Rabu', notes: '200 porsi' },
  { name: 'Daging Sapi', type: 'Keluar', qty: 7, day: 30, ref: 'Distribusi Rabu', notes: 'Rendang HUT RI' },
  { name: 'Santan Kelapa', type: 'Keluar', qty: 3, day: 30, ref: 'Distribusi Rabu', notes: 'Rendang' },
  { name: 'Bawang Merah', type: 'Keluar', qty: 3, day: 30, ref: 'Distribusi Rabu', notes: 'Bumbu rendang' },
  { name: 'Bawang Putih', type: 'Keluar', qty: 2, day: 30, ref: 'Distribusi Rabu', notes: 'Bumbu rendang' },
  { name: 'Cabai Merah Keriting', type: 'Keluar', qty: 2, day: 30, ref: 'Distribusi Rabu', notes: 'Bumbu rendang' },
  { name: 'Lengkuas', type: 'Keluar', qty: 0.5, day: 30, ref: 'Distribusi Rabu', notes: 'Bumbu rendang' },
  { name: 'Daun Salam', type: 'Keluar', qty: 0.2, day: 30, ref: 'Distribusi Rabu', notes: 'Bumbu rendang' },
  { name: 'Serai', type: 'Keluar', qty: 0.5, day: 30, ref: 'Distribusi Rabu', notes: 'Bumbu rendang' },
  { name: 'Kentang', type: 'Keluar', qty: 3, day: 30, ref: 'Distribusi Rabu', notes: 'Lauk pendamping' },
  { name: 'Kotak Styrofoam 750ml', type: 'Keluar', qty: 22, day: 30, ref: 'Distribusi Rabu', notes: 'Menu spesial' },
  { name: 'Gelas Plastik 220ml', type: 'Keluar', qty: 22, day: 30, ref: 'Distribusi Rabu', notes: 'Gelas' },
  { name: 'Sendok Plastik', type: 'Keluar', qty: 22, day: 30, ref: 'Distribusi Rabu', notes: 'Sendok' },
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
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // Check if tables exist
    if (action === 'check') {
      const { error } = await supabase.from('stock_items').select('id').limit(1)
      if (error) {
        return NextResponse.json({ exists: false, sql: MIGRATION_SQL })
      }
      return NextResponse.json({ exists: true })
    }

    // Seed data
    if (action === 'seed') {
      // Check tables first
      const { error: checkErr } = await supabase.from('stock_items').select('id').limit(1)
      if (checkErr) {
        return NextResponse.json({ error: 'Tabel stock_items belum ada. Buat tabel terlebih dahulu.', sql: MIGRATION_SQL }, { status: 400 })
      }

      // Clean existing data
      await supabase.from('stock_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('stock_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 1. Insert all items (stock_qty=0, trigger will update)
      const { data: insertedItems, error: insertErr } = await supabase
        .from('stock_items')
        .insert(STOCK_ITEMS.map(i => ({
          name: i.name, category: i.category, unit: i.unit,
          stock_qty: 0, min_stock: i.min_stock,
          location: i.location, description: i.description,
        })))
        .select('id, name')

      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

      // Build name -> id map
      const nameToId: Record<string, string> = {}
      for (const item of (insertedItems || [])) {
        nameToId[item.name] = item.id
      }

      // 2. Insert transactions (trigger auto-updates stock_qty)
      const validTxs = TRANSACTIONS.filter(tx => nameToId[tx.name])
      const BATCH = 50
      let totalTx = 0
      for (let i = 0; i < validTxs.length; i += BATCH) {
        const batch = validTxs.slice(i, i + BATCH)
        const { error: txErr } = await supabase
          .from('stock_transactions')
          .insert(batch.map(tx => ({
            item_id: nameToId[tx.name], type: tx.type, quantity: tx.qty,
            transaction_date: `2025-07-${pad(tx.day)}`, notes: tx.notes, reference: tx.ref,
          })))
        if (txErr) console.error('Batch error:', txErr.message)
        else totalTx += batch.length
      }

      // 3. Calculate final stock_qty and update
      const stockCalc: Record<string, number> = {}
      for (const item of STOCK_ITEMS) stockCalc[item.name] = 0
      for (const tx of validTxs) {
        if (tx.type === 'Masuk') stockCalc[tx.name] += tx.qty
        else stockCalc[tx.name] -= tx.qty
      }

      for (const [name, qty] of Object.entries(stockCalc)) {
        const id = nameToId[name]
        if (!id) continue
        await supabase.from('stock_items').update({ stock_qty: Math.max(0, qty) }).eq('id', id)
      }

      const masukCount = validTxs.filter(t => t.type === 'Masuk').length
      const keluarCount = validTxs.filter(t => t.type === 'Keluar').length

      return NextResponse.json({
        success: true,
        message: `Data simulasi 1 bulan berhasil! ${STOCK_ITEMS.length} barang, ${totalTx} transaksi (${masukCount} masuk, ${keluarCount} keluar)`
      })
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
