import { NextRequest, NextResponse } from 'next/server'
import { fetchAll, supabase } from '@/lib/supabase'

function auditLog(tableName: string, recordId: string, action: string, oldData?: any, newData?: any, changedFields?: string[]) {
  supabase.from('pm_audit_log').insert([{
    table_name: tableName,
    record_id: String(recordId),
    action,
    old_data: oldData || null,
    new_data: newData || null,
    changed_fields: changedFields || null,
    performed_by: 'user',
  }]).then(() => {}).catch(() => {})
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const periodId = searchParams.get('period_id')

    const options: any = {
      order: { column: 'created_at', ascending: true },
    }
    if (periodId) {
      options.filter = { column: 'period_id', operator: 'eq', value: periodId }
    }

    const data = await fetchAll('beneficiaries_3b', options)
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
      period_id: body.period_id || null,
    }]).select()

    if (error) throw error
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

    const changedFields = oldRecord
      ? Object.keys(newValues).filter(key => JSON.stringify(newValues[key as keyof typeof newValues]) !== JSON.stringify((oldRecord as any)[key]))
      : null

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
    const periodId = searchParams.get('period_id')

    if (all === 'true' && sub) {
      let query = supabase.from('beneficiaries_3b').delete().eq('sub_category', sub)
      if (periodId) query = query.eq('period_id', periodId)
      const { error } = await query
      if (error) throw error
      return NextResponse.json({ success: true, deleted: 'all' })
    }

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const { data: oldRecord } = await supabase.from('beneficiaries_3b').select('*').eq('id', id).single()
    const { error } = await supabase.from('beneficiaries_3b').delete().eq('id', id)
    if (error) throw error

    auditLog('beneficiaries_3b', id, 'DELETE', oldRecord)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
