import { NextRequest, NextResponse } from 'next/server'
import { fetchAll, supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'summary'
    const month = searchParams.get('month') || ''
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    const dateFilter = month
      ? `${year}-${month.padStart(2, '0')}`
      : ''

    // === SUMMARY ===
    if (type === 'summary') {
      const [students, teachers, b3b, dRes] = await Promise.all([
        fetchAll('students', { select: 'id, jk, kelas, school_name, has_allergy, berat_badan, tinggi_badan' }),
        fetchAll('teachers', { select: 'id, jk, school_name, jenis_tendik, has_allergy' }),
        fetchAll('beneficiaries_3b', { select: 'id, gender, sub_category, posyandu_name, has_allergy, status' }),
        dateFilter
          ? supabase.from('distributions').select('id, distribution_date, destination_type, destination_name, status, pic_name, distribution_items(jumlah_porsi, menu_name)').ilike('distribution_date', `${dateFilter}%`)
          : supabase.from('distributions').select('id, distribution_date, destination_type, destination_name, status, pic_name, distribution_items(jumlah_porsi, menu_name)'),
      ])

      const distributions = dRes.data || []

      // Distribusi stats
      const distByMonth: Record<string, { total: number; dikirim: number; porsi: number }> = {}
      distributions.forEach((d: any) => {
        const m = (d.distribution_date || '').toString().slice(0, 7)
        if (!m) return
        if (!distByMonth[m]) distByMonth[m] = { total: 0, dikirim: 0, porsi: 0 }
        distByMonth[m].total++
        if (d.status === 'Dikirim' || d.status === 'Diterima') distByMonth[m].dikirim++
        const items = d.distribution_items || []
        items.forEach((item: any) => { distByMonth[m].porsi += item.jumlah_porsi || 0 })
      })

      const distByDest: Record<string, number> = {}
      distributions.forEach((d: any) => { distByDest[d.destination_name] = (distByDest[d.destination_name] || 0) + 1 })

      return NextResponse.json({
        students, teachers, beneficiaries3b: b3b, distributions,
        distByMonth, distByDest,
        summary: {
          totalSiswa: students.length,
          totalGuru: teachers.length,
          total3b: b3b.length,
          totalDistribusi: distributions.length,
          totalPorsi: distributions.reduce((sum: number, d: any) => sum + (d.distribution_items || []).reduce((s2: number, i: any) => s2 + (i.jumlah_porsi || 0), 0), 0),
        }
      })
    }

    // === DISTRIBUSI DETAIL ===
    if (type === 'distribusi') {
      const q = supabase.from('distributions').select('id, distribution_date, destination_type, destination_name, pic_name, status, notes, created_at, distribution_items(menu_name, nasi, lauk_pauk, sayur, buah, minuman, jumlah_porsi, tipe_porsi)').order('distribution_date', { ascending: false })
      if (dateFilter) q.ilike('distribution_date', `${dateFilter}%`)
      const { data, error } = await q
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data || [])
    }

    // === PENERIMA DETAIL ===
    if (type === 'penerima') {
      const [students, teachers, b3b] = await Promise.all([
        fetchAll('students', { select: 'id, nama, school_name, jk, kelas, tanggal_lahir, berat_badan, tinggi_badan, has_allergy, alamat' }),
        fetchAll('teachers', { select: 'id, full_name, school_name, jk, jenis_tendik, has_allergy, alamat' }),
        fetchAll('beneficiaries_3b', { select: 'id, full_name, sub_category, posyandu_name, gender, birth_date, has_allergy, status' }),
      ])
      return NextResponse.json({
        students, teachers, beneficiaries3b: b3b
      })
    }

    // === STOK SUMMARY ===
    if (type === 'stok') {
      const { data, error } = await supabase.from('stock_items').select('id, item_name, category, unit, current_stock, min_stock').order('category')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data || [])
    }

    return NextResponse.json({ error: 'Tipe laporan tidak valid' }, { status: 400 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data laporan'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
