/**
 * Run the PM Snapshots & Audit Log migration on Supabase
 * Creates pm_snapshots and pm_audit_log tables with indexes and RLS policies
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zwbspstsbpzsnphdohko.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IBx9PYkqJPg77OZmISs_Rg_NWDtJDLw';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration() {
  console.log('=== PM Snapshots & Audit Log Migration ===\n');

  // The Supabase JS client doesn't support raw SQL directly.
  // We need to use the REST API or tell the user to run it manually.
  // Let's check if tables exist first, then provide instructions.

  // Check if tables already exist
  const { error: e1 } = await sb.from('pm_snapshots').select('id').limit(1);
  const { error: e2 } = await sb.from('pm_audit_log').select('id').limit(1);

  if (!e1 && !e2) {
    console.log('✅ Both tables already exist!');
    
    // Show current data
    const { count: snapCount } = await sb.from('pm_snapshots').select('*', { count: 'exact', head: true });
    const { count: auditCount } = await sb.from('pm_audit_log').select('*', { count: 'exact', head: true });
    console.log(`   pm_snapshots: ${snapCount} rows`);
    console.log(`   pm_audit_log: ${auditCount} rows`);
    return;
  }

  console.log('❌ Tables do not exist yet. Need to run SQL migration.');
  console.log('\nPlease run the following SQL in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/zwbspstsbpzsnphdohko/sql\n');
  console.log('--- SQL START ---');
  console.log(`
-- 1. TABEL PM_SNAPSHOTS
CREATE TABLE IF NOT EXISTS pm_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_label TEXT NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  students_total INTEGER DEFAULT 0,
  teachers_total INTEGER DEFAULT 0,
  b3b_total INTEGER DEFAULT 0,
  porsi_kecil INTEGER DEFAULT 0,
  porsi_besar INTEGER DEFAULT 0,
  total_porsi INTEGER DEFAULT 0,
  gizi_kurang INTEGER DEFAULT 0,
  gizi_normal INTEGER DEFAULT 0,
  gizi_lebih INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT DEFAULT 'system',
  notes TEXT,
  UNIQUE(period_start, period_end)
);

-- 2. TABEL PM_AUDIT_LOG
CREATE TABLE IF NOT EXISTS pm_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  performed_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_table_time ON pm_audit_log(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_time ON pm_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshot_period ON pm_snapshots(period_start DESC);

-- RLS Policies
ALTER TABLE pm_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read write snapshots" ON pm_snapshots
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read write audit" ON pm_audit_log
  FOR ALL USING (true) WITH CHECK (true);
  `);
  console.log('--- SQL END ---\n');
}

runMigration().catch(console.error);
