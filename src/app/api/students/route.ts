import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
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

    const body = await req.json()
    const { error } = await supabase.from('students').update({
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
    }).eq('id', id)

    if (error) throw error
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
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
