import { NextRequest, NextResponse } from 'next/server'
import { fetchAll, supabase } from '@/lib/supabase'

function auditLog(tableName: string, recordId: string, action: string, oldData?: any, newData?: any, changedFields?: string[]) {
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/pm-audit-log/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableName, recordId, action, oldData, newData, changedFields }),
  }).catch(() => {})
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

    const data = await fetchAll('teachers', options)
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
      period_id: body.period_id || null,
    }]).select()

    if (error) throw error
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

    const changedFields = oldRecord
      ? Object.keys(newValues).filter(key => JSON.stringify(newValues[key as keyof typeof newValues]) !== JSON.stringify((oldRecord as any)[key]))
      : null

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
    const periodId = searchParams.get('period_id')

    if (all === 'true') {
      let query = supabase.from('teachers').delete()
      if (periodId) {
        query = query.eq('period_id', periodId)
      } else {
        query = query.neq('id', '00000000-0000-0000-0000-000000000000')
      }
      const { error } = await query
      if (error) throw error
      return NextResponse.json({ success: true, deleted: 'all' })
    }

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const { data: oldRecord } = await supabase.from('teachers').select('*').eq('id', id).single()
    const { error } = await supabase.from('teachers').delete().eq('id', id)
    if (error) throw error

    auditLog('teachers', id, 'DELETE', oldRecord)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
