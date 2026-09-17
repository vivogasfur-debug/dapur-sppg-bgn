-- ============================================================
-- PM Snapshots & Audit Log
-- Membekukan data rekapitulasi per periode 2 minggu
-- + mencatat semua perubahan data PM (audit trail)
-- ============================================================

-- 1. TABEL PM_SNAPSHOTS
CREATE TABLE IF NOT EXISTS pm_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_label TEXT NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  -- Totals ringkasan (mudah di-query)
  students_total INTEGER DEFAULT 0,
  teachers_total INTEGER DEFAULT 0,
  b3b_total INTEGER DEFAULT 0,
  porsi_kecil INTEGER DEFAULT 0,
  porsi_besar INTEGER DEFAULT 0,
  total_porsi INTEGER DEFAULT 0,
  -- Gizi ringkasan
  gizi_kurang INTEGER DEFAULT 0,
  gizi_normal INTEGER DEFAULT 0,
  gizi_lebih INTEGER DEFAULT 0,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT DEFAULT 'system',
  notes TEXT,
  UNIQUE(period_start, period_end)
);

-- 2. TABEL PM_AUDIT_LOG
CREATE TABLE IF NOT EXISTS pm_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,        -- 'students', 'teachers', 'beneficiaries_3b'
  record_id TEXT NOT NULL,         -- id record yang diubah
  action TEXT NOT NULL,            -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,                  -- data sebelum perubahan
  new_data JSONB,                  -- data setelah perubahan
  changed_fields TEXT[],           -- field mana saja yang berubah
  performed_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_audit_table_time ON pm_audit_log(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_time ON pm_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshot_period ON pm_snapshots(period_start DESC);

-- 3. RLS Policies
ALTER TABLE pm_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read write snapshots" ON pm_snapshots
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read write audit" ON pm_audit_log
  FOR ALL USING (true) WITH CHECK (true);
