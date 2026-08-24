import { NextRequest, NextResponse } from 'next/server'
import { fetchAll, supabase } from '@/lib/supabase'

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
      usia_kandungan: body.usiaKandungan || null,
      has_allergy: body.hasAllergy || false,
      allergy_type: body.hasAllergy ? body.allergyType : null,
      status: 'Aktif',
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
    const { error } = await supabase.from('beneficiaries_3b').update({
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
      usia_kandungan: body.usiaKandungan || null,
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
    const all = searchParams.get('all')
    const sub = searchParams.get('sub_category')

    if (all === 'true' && sub) {
      const { error } = await supabase.from('beneficiaries_3b').delete().eq('sub_category', sub)
      if (error) throw error
      return NextResponse.json({ success: true, deleted: 'all' })
    }

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    const { error } = await supabase.from('beneficiaries_3b').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
