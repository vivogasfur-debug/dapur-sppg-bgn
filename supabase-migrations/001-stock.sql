-- ============================================
-- MODUL GUDANG & STOK - Dapur SPPG BGN
-- ============================================

-- Tabel Barang/Item Stok
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

-- Tabel Transaksi Stok (Masuk/Keluar)
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

-- Enable RLS
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (anon full access)
CREATE POLICY "Allow all on stock_items" ON stock_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock_transactions" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_id ON stock_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(transaction_date DESC);

-- Trigger: auto-update stok saat transaksi masuk/keluar
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
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_transaction();