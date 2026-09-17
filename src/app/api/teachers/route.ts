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

export async function GET() {
  try {
    const data = await fetchAll('teachers', {
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
    const { data, error } = await supabase.from('teachers').insert([{
      full_name: body.fullName,
      school_name: body.schoolName,
      nuptk: body.nuptk || null,
      nip: body.nip || null,
      jk: body.jk,
      tempat_lahir: body.tempatLahir || null,
      tanggal_lahir: body.tanggalLahir || null,
      nik: body.nik || null,
      jenis_tendik: body.jenisTendik || 'Guru',
      alamat: body.alamat || null,
      has_allergy: body.hasAllergy || false,
      allergy_type: body.hasAllergy ? body.allergyType : null,
      status: 'Aktif',
    }]).select()

    if (error) throw error
    // Fire-and-forget audit logging
    auditLog('teachers', data[0]?.id, 'INSERT', undefined, data[0])
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
    const { data: oldRecord } = await supabase.from('teachers').select('*').eq('id', id).single()

    const body = await req.json()
    const newValues = {
      full_name: body.fullName,
      school_name: body.schoolName,
      nuptk: body.nuptk || null,
      nip: body.nip || null,
      jk: body.jk,
      tempat_lahir: body.tempatLahir || null,
      tanggal_lahir: body.tanggalLahir || null,
      nik: body.nik || null,
      jenis_tendik: body.jenisTendik || 'Guru',
      alamat: body.alamat || null,
      has_allergy: body.hasAllergy || false,
      allergy_type: body.hasAllergy ? body.allergyType : null,
    }

    const { error } = await supabase.from('teachers').update(newValues).eq('id', id)
    if (error) throw error

    // Calculate changed fields
    const changedFields = oldRecord
      ? Object.keys(newValues).filter(key => JSON.stringify(newValues[key as keyof typeof newValues]) !== JSON.stringify((oldRecord as any)[key]))
      : null

    // Fire-and-forget audit logging
    auditLog('teachers', id, 'UPDATE', oldRecord, newValues, changedFields || undefined)
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

    if (all === 'true') {
      const { error } = await supabase.from('teachers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      return NextResponse.json({ success: true, deleted: 'all' })
    }

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    // Fetch old data before delete
    const { data: oldRecord } = await supabase.from('teachers').select('*').eq('id', id).single()

    const { error } = await supabase.from('teachers').delete().eq('id', id)
    if (error) throw error

    // Fire-and-forget audit logging
    auditLog('teachers', id, 'DELETE', oldRecord)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
