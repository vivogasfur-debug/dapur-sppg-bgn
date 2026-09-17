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
    const data = await fetchAll('students', {
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
    const { data, error } = await supabase.from('students').insert([{
      nama: body.nama,
      school_name: body.schoolName,
      nipd: body.nipd || null,
      jk: body.jk,
      nisn: body.nisn || null,
      tempat_lahir: body.tempatLahir || null,
      tanggal_lahir: body.tanggalLahir || null,
      nik: body.nik || null,
      agama: body.agama || 'Islam',
      alamat: body.alamat || null,
      kelas: body.kelas,
      berat_badan: body.beratBadan || 0,
      tinggi_badan: body.tinggiBadan || 0,
      nama_ayah: body.namaAyah || null,
      nama_ibu: body.namaIbu || null,
      has_allergy: body.hasAllergy || false,
      allergy_type: body.hasAllergy ? body.allergyType : null,
    }]).select()

    if (error) throw error
    // Fire-and-forget audit logging
    auditLog('students', data[0]?.id, 'INSERT', undefined, data[0])
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
    const { data: oldRecord } = await supabase.from('students').select('*').eq('id', id).single()

    const body = await req.json()
    const newValues = {
      nama: body.nama,
      school_name: body.schoolName,
      nipd: body.nipd || null,
      jk: body.jk,
      nisn: body.nisn || null,
      tempat_lahir: body.tempatLahir || null,
      tanggal_lahir: body.tanggalLahir || null,
      nik: body.nik || null,
      agama: body.agama || 'Islam',
      alamat: body.alamat || null,
      kelas: body.kelas,
      berat_badan: body.beratBadan || 0,
      tinggi_badan: body.tinggiBadan || 0,
      nama_ayah: body.namaAyah || null,
      nama_ibu: body.namaIbu || null,
      has_allergy: body.hasAllergy || false,
      allergy_type: body.hasAllergy ? body.allergyType : null,
    }

    const { error } = await supabase.from('students').update(newValues).eq('id', id)
    if (error) throw error

    // Calculate changed fields
    const changedFields = oldRecord
      ? Object.keys(newValues).filter(key => JSON.stringify(newValues[key as keyof typeof newValues]) !== JSON.stringify((oldRecord as any)[key]))
      : null

    // Fire-and-forget audit logging
    auditLog('students', id, 'UPDATE', oldRecord, newValues, changedFields || undefined)
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
      const { error } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      return NextResponse.json({ success: true, deleted: 'all' })
    }

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    // Fetch old data before delete
    const { data: oldRecord } = await supabase.from('students').select('*').eq('id', id).single()

    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) throw error

    // Fire-and-forget audit logging
    auditLog('students', id, 'DELETE', oldRecord)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
