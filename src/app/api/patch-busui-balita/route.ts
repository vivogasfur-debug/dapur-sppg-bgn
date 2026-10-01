import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * PATCH /api/patch-busui-balita
 * 
 * Migrates existing Busui/Balita records where nama_balita and tanggal_lahir_balita are NULL.
 * For Busui: copies full_name → nama_orang_tua if nama_orang_tua is NULL
 * This endpoint is meant to be called once after code fix deployment.
 */
export async function PATCH() {
  try {
    // Get all Busui/Balita records where nama_balita is NULL
    const { data: records, error: fetchErr } = await supabase
      .from('beneficiaries_3b')
      .select('id, sub_category, full_name, nama_balita, tanggal_lahir_balita, nama_orang_tua')
      .in('sub_category', ['Busui', 'Balita'])
      .is('nama_balita', null)

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ message: 'Tidak ada record yang perlu di-patch', patched: 0 })
    }

    let patched = 0
    const errors: string[] = []

    for (const rec of records) {
      const updates: Record<string, any> = {}

      // For Busui: if nama_orang_tua is NULL and full_name exists, set nama_orang_tua = full_name
      if (!rec.nama_orang_tua && rec.full_name && rec.full_name !== '-') {
        updates.nama_orang_tua = rec.full_name
      }

      // Only update if there are fields to patch
      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from('beneficiaries_3b')
          .update(updates)
          .eq('id', rec.id)

        if (updateErr) {
          errors.push(`ID ${rec.id}: ${updateErr.message}`)
        } else {
          patched++
        }
      }
    }

    return NextResponse.json({
      message: `Patch selesai: ${patched} record diupdate dari ${records.length} total`,
      patched,
      total: records.length,
      errors: errors.length > 0 ? errors : undefined,
      note: 'Record yang nama_balita-nya NULL perlu di-reimport CSV dengan kolom Nama Balita/Busui dan Tgl Lahir Balita untuk mengisi data lengkap.'
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal patch data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
