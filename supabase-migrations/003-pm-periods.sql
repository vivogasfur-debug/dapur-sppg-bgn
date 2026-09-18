-- Migration 003: Add pm_periods table and period_id to data tables
-- This enables per-biweekly-period data separation

-- 1. Create pm_periods table
CREATE TABLE IF NOT EXISTS pm_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(period_start, period_end)
);

-- 2. Add period_id to students (nullable first for backward compat)
ALTER TABLE students ADD COLUMN IF NOT EXISTS period_id UUID NULL REFERENCES pm_periods(id) ON DELETE SET NULL;

-- 3. Add period_id to teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS period_id UUID NULL REFERENCES pm_periods(id) ON DELETE SET NULL;

-- 4. Add period_id to beneficiaries_3b
ALTER TABLE beneficiaries_3b ADD COLUMN IF NOT EXISTS period_id UUID NULL REFERENCES pm_periods(id) ON DELETE SET NULL;

-- 5. Index for fast period-based queries
CREATE INDEX IF NOT EXISTS idx_students_period ON students(period_id);
CREATE INDEX IF NOT EXISTS idx_teachers_period ON teachers(period_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_3b_period ON beneficiaries_3b(period_id);

-- 6. Enable RLS
ALTER TABLE pm_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for pm_periods" ON pm_periods FOR ALL USING (true) WITH CHECK (true);
