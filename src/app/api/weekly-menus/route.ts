import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const WEEKLY_SEED = [
  { tanggal:'2025-07-28', hari:'Senin', menu_nama:'Nasi + Ayam Goreng Kunyit + Bayam Bening', tipe_porsi:'porsi_besar' },
  { tanggal:'2025-07-28', hari:'Senin', menu_nama:'Nasi + Ayam Goreng Kecil + Bayam', tipe_porsi:'porsi_kecil' },
  { tanggal:'2025-07-28', hari:'Senin', menu_nama:'Bubur Nasi Ayam + Wortel Bayam', tipe_porsi:'porsi_bayi' },
  { tanggal:'2025-07-29', hari:'Selasa', menu_nama:'Nasi + Rendang Daging + Sayur Nangka', tipe_porsi:'porsi_besar' },
  { tanggal:'2025-07-29', hari:'Selasa', menu_nama:'Nasi + Rendang Daging Kecil + Nangka', tipe_porsi:'porsi_kecil' },
  { tanggal:'2025-07-29', hari:'Selasa', menu_nama:'Bubur Nasi Rendang + Labu Kuning', tipe_porsi:'porsi_bayi' },
  { tanggal:'2025-07-30', hari:'Rabu', menu_nama:'Nasi + Ikan Tongkol Pindang + Plecing Kangkung', tipe_porsi:'porsi_besar' },
  { tanggal:'2025-07-30', hari:'Rabu', menu_nama:'Nasi + Ikan Tongkol Kecil + Kangkung', tipe_porsi:'porsi_kecil' },
  { tanggal:'2025-07-30', hari:'Rabu', menu_nama:'Bubur Nasi Ikan + Kentang Wortel', tipe_porsi:'porsi_bayi' },
  { tanggal:'2025-07-31', hari:'Kamis', menu_nama:'Nasi + Ayam Pop + Telur Dadar + Sop Bakso', tipe_porsi:'porsi_besar' },
  { tanggal:'2025-07-31', hari:'Kamis', menu_nama:'Nasi + Ayam Pop Kecil + Sop Bakso', tipe_porsi:'porsi_kecil' },
  { tanggal:'2025-07-31', hari:'Kamis', menu_nama:'Bubur Nasi Ayam + Sup Kentang', tipe_porsi:'porsi_bayi' },
  { tanggal:'2025-08-01', hari:'Jumat', menu_nama:'Nasi + Gulai Ayam + Sayur Nangka', tipe_porsi:'porsi_besar' },
  { tanggal:'2025-08-01', hari:'Jumat', menu_nama:'Nasi + Gulai Ayam Kecil + Nangka', tipe_porsi:'porsi_kecil' },
  { tanggal:'2025-08-01', hari:'Jumat', menu_nama:'Bubur Santan Ayam + Kacang Hijau', tipe_porsi:'porsi_bayi' },
  { tanggal:'2025-08-02', hari:'Sabtu', menu_nama:'Nasi + Bakso Ikan + Sayur Kol', tipe_porsi:'porsi_besar' },
  { tanggal:'2025-08-02', hari:'Sabtu', menu_nama:'Nasi + Bakso Ikan Kecil + Sayur Kol', tipe_porsi:'porsi_kecil' },
  { tanggal:'2025-08-02', hari:'Sabtu', menu_nama:'Bubur Nasi Ikan + Makaroni Wortel', tipe_porsi:'porsi_bayi' },
  { tanggal:'2025-08-03', hari:'Minggu', menu_nama:'Nasi Kuning + Ayam Goreng + Teri Medan', tipe_porsi:'porsi_besar' },
  { tanggal:'2025-08-03', hari:'Minggu', menu_nama:'Nasi Kuning Kecil + Ayam Goreng + Teri', tipe_porsi:'porsi_kecil' },
  { tanggal:'2025-08-03', hari:'Minggu', menu_nama:'Bubur Nasi Kuning + Ayam Suwir', tipe_porsi:'porsi_bayi' },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const tanggal = searchParams.get('tanggal')
    const tipe = searchParams.get('tipe_porsi')

    // Seed action
    if (action === 'seed') {
      const { error: chk } = await supabase.from('weekly_menu_plans').select('id').limit(1)
      if (chk) return NextResponse.json({ error: 'Tabel weekly_menu_plans belum ada.', step: 'Buat tabel dulu.' }, { status: 400 })
      // Get menu_db IDs
      const allMenus = await supabase.from('nutrition_menu_db').select('id,nama_menu').eq('aktif', true)
      if (allMenus.error) return NextResponse.json({ error: allMenus.error.message }, { status: 500 })
      const menuMap = new Map(allMenus.data.map(function(m) { return [m.nama_menu, m.id] }))
      // Clear existing
      await supabase.from('weekly_menu_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      // Insert with menu_db_id
      const plans = WEEKLY_SEED.map(function(p) {
        return {
          tanggal: p.tanggal, hari: p.hari,
          menu_db_id: menuMap.get(p.menu_nama) || null,
          tipe_porsi: p.tipe_porsi,
          penerima: p.tipe_porsi === 'porsi_bayi' ? 'Bayi' : 'Umum',
          catatan: null, status: 'Aktif',
        }
      })
      const { data, error } = await supabase.from('weekly_menu_plans').insert(plans).select('id,hari,tipe_porsi')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: `${data!.length} rencana menu mingguan tersimpan`, count: data!.length })
    }

    // Get weekly plans joined with menu_db
    let q = supabase.from('weekly_menu_plans').select(`
      id, tanggal, hari, menu_db_id, tipe_porsi, penerima, catatan, status, created_at,
      nutrition_menu_db:nutrition_menu_db(id, nama_menu, nasi, lauk_pauk, sayur, buah, minuman, kalori_est, protein_g, catatan, tipe_porsi)
    `).order('tanggal', { ascending: true }).order('tipe_porsi')
    if (tanggal) q = q.eq('tanggal', tanggal)
    if (tipe) q = q.eq('tipe_porsi', tipe)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, error } = await supabase.from('weekly_menu_plans').insert([{
      tanggal: body.tanggal, hari: body.hari,
      menu_db_id: body.menu_db_id || null,
      tipe_porsi: body.tipe_porsi,
      penerima: body.penerima || 'Umum',
      catatan: body.catatan || null, status: 'Aktif',
    }]).select(`
      id, tanggal, hari, tipe_porsi, penerima, catatan, status,
      nutrition_menu_db:nutrition_menu_db(id, nama_menu, nasi, lauk_pauk, sayur, buah, minuman, kalori_est, protein_g, catatan)
    `)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data![0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menyimpan'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')
    if (all === 'true') {
      const { error } = await supabase.from('weekly_menu_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    const { error } = await supabase.from('weekly_menu_plans').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
