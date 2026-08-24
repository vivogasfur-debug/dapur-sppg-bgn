import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Check if Balita columns exist
export async function GET() {
  try {
    const { error } = await supabase.from('beneficiaries_3b').select('tempat_lahir').limit(1)
    if (!error) return NextResponse.json({ migrated: true, message: 'Kolom Balita sudah ada' })
    return NextResponse.json({ 
      migrated: false, 
      message: 'Kolom belum ada. Jalankan SQL di Supabase SQL Editor',
      sql: `ALTER TABLE beneficiaries_3b
  ADD COLUMN IF NOT EXISTS tempat_lahir text,
  ADD COLUMN IF NOT EXISTS alamat text,
  ADD COLUMN IF NOT EXISTS nama_orang_tua text,
  ADD COLUMN IF NOT EXISTS berat_badan numeric(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tinggi_badan numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lingkar_kepala numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lingkar_lengan numeric(5,2) DEFAULT 0;`
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal cek migrasi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
