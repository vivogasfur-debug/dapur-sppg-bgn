import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Check if the period migration (003-pm-periods.sql) has been applied
export async function GET() {
  try {
    // Try to select from pm_periods table — if it fails, migration hasn't been applied
    const { data, error } = await supabase
      .from('pm_periods')
      .select('id')
      .limit(1)

    if (error) {
      // Table doesn't exist or RLS issue
      return NextResponse.json({
        applied: false,
        error: error.message,
        migration_needed: '003-pm-periods',
        sql: `-- Migration 003: Add pm_periods table and period_id to data tables
-- Jalankan ini di Supabase Dashboard → SQL Editor

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
CREATE POLICY "Allow all for pm_periods" ON pm_periods FOR ALL USING (true) WITH CHECK (true);`
      })
    }

    // Table exists — also check if period_id columns exist on data tables
    const checks: Record<string, boolean> = { pm_periods: true }

    // Check students has period_id by trying a select that includes it
    const { error: studentErr } = await supabase
      .from('students')
      .select('id,period_id')
      .limit(1)
    checks.students_period_id = !studentErr

    const { error: teacherErr } = await supabase
      .from('teachers')
      .select('id,period_id')
      .limit(1)
    checks.teachers_period_id = !teacherErr

    const { error: benErr } = await supabase
      .from('beneficiaries_3b')
      .select('id,period_id')
      .limit(1)
    checks.beneficiaries_3b_period_id = !benErr

    const allApplied = checks.pm_periods && checks.students_period_id && checks.teachers_period_id && checks.beneficiaries_3b_period_id

    return NextResponse.json({
      applied: allApplied,
      checks,
      period_count: data?.length || 0,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal cek migrasi'
    return NextResponse.json({ applied: false, error: msg }, { status: 500 })
  }
}
