import { NextRequest, NextResponse } from 'next/server'
import { fetchAll, supabase } from '@/lib/supabase'

function auditLog(tableName: string, recordId: string, action: string, oldData?: any, newData?: any, changedFields?: string[]) {
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/pm-audit-log/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableName, recordId, action, oldData, newData, changedFields }),
  }).catch(() => {})
}

export async function GET() {
  try {
    const data = await fetchAll('beneficiaries_3b', {
      order: { column: 'created_at', ascending: true },
    })
    return NextResponse.json(data)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, error } = await supabase.from('beneficiaries_3b').insert([{
      posyandu_name: body.posyanduName,
      sub_category: body.subCategory,
      nik: body.nik || null,
      full_name: body.fullName,
      gender: body.gender,
      birth_date: body.birthDate || null,
      tempat_lahir: body.tempatLahir || null,
      alamat: body.alamat || null,
      nama_orang_tua: body.namaOrtu || null,
      berat_badan: body.beratBadan || 0,
      tinggi_badan: body.tinggiBadan || 0,
      lingkar_kepala: body.lingkarKepala || 0,
      lingkar_lengan: body.lingkarLengan || 0,
      has_allergy: body.hasAllergy || false,
      allergy_type: body.hasAllergy ? body.allergyType : null,
      status: 'Aktif',
    }]).select()

    if (error) throw error
    // Fire-and-forget audit logging
    auditLog('beneficiaries_3b', data[0]?.id, 'INSERT', undefined, data[0])
    return NextResponse.json(data[0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menyimpan data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    // Fetch old data before update
    const { data: oldRecord } = await supabase.from('beneficiaries_3b').select('*').eq('id', id).single()

    const body = await req.json()
    const newValues = {
      posyandu_name: body.posyanduName,
      sub_category: body.subCategory,
      nik: body.nik || null,
      full_name: body.fullName,
      gender: body.gender,
      birth_date: body.birthDate || null,
      tempat_lahir: body.tempatLahir || null,
      alamat: body.alamat || null,
      nama_orang_tua: body.namaOrtu || null,
      berat_badan: body.beratBadan || 0,
      tinggi_badan: body.tinggiBadan || 0,
      lingkar_kepala: body.lingkarKepala || 0,
      lingkar_lengan: body.lingkarLengan || 0,
      has_allergy: body.hasAllergy || false,
      allergy_type: body.hasAllergy ? body.allergyType : null,
    }

    const { error } = await supabase.from('beneficiaries_3b').update(newValues).eq('id', id)
    if (error) throw error

    // Calculate changed fields
    const changedFields = oldRecord
      ? Object.keys(newValues).filter(key => JSON.stringify(newValues[key as keyof typeof newValues]) !== JSON.stringify((oldRecord as any)[key]))
      : null

    // Fire-and-forget audit logging
    auditLog('beneficiaries_3b', id, 'UPDATE', oldRecord, newValues, changedFields || undefined)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memperbarui data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')
    const sub = searchParams.get('sub_category')

    if (all === 'true' && sub) {
      const { error } = await supabase.from('beneficiaries_3b').delete().eq('sub_category', sub)
      if (error) throw error
      return NextResponse.json({ success: true, deleted: 'all' })
    }

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    // Fetch old data before delete
    const { data: oldRecord } = await supabase.from('beneficiaries_3b').select('*').eq('id', id).single()

    const { error } = await supabase.from('beneficiaries_3b').delete().eq('id', id)
    if (error) throw error

    // Fire-and-forget audit logging
    auditLog('beneficiaries_3b', id, 'DELETE', oldRecord)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
