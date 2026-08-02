import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const SETUP_SQL = `-- Tabel Database Menu (Master Dropdown)
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
CREATE INDEX IF NOT EXISTS idx_weekly_menu_porsi ON weekly_menu_plans(tipe_porsi);`

export async function GET() {
  try {
    const { error: e1 } = await supabase.from('nutrition_menu_db').select('id').limit(1)
    const { error: e2 } = await supabase.from('weekly_menu_plans').select('id').limit(1)
    const menuDbOk = !e1
    const weeklyOk = !e2
    return NextResponse.json({
      menuDbExists: menuDbOk,
      weeklyExists: weeklyOk,
      ready: menuDbOk && weeklyOk,
      sql: SETUP_SQL,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal cek tabel'
    return NextResponse.json({ error: msg, sql: SETUP_SQL }, { status: 500 })
  }
}
