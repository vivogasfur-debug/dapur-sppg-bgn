import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const SEED_DATA = [
  // === PORSI BESAR (10 menu) ===
  { nama_menu: 'Nasi + Ayam Goreng Kunyit + Bayam Bening', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Ayam Goreng Kunyit (100g)', sayur: 'Sayur Bayam Bening', buah: 'Pisang Raja (1 buah)', minuman: 'Air Mineral (300ml)', kalori_est: 580, protein_g: 28, catatan: 'Tinggi protein, cocok untuk dewasa dan anak besar' },
  { nama_menu: 'Nasi + Rendang Daging + Sayur Nangka', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Rendang Daging Sapi (80g)', sayur: 'Sayur Nangka Muda', buah: 'Jeruk Manis (1 buah)', minuman: 'Teh Manis Hangat (250ml)', kalori_est: 650, protein_g: 32, catatan: 'Rendang dengan rempah lengkap' },
  { nama_menu: 'Nasi + Ikan Tongkol Pindang + Plecing Kangkung', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Ikan Tongkol Pindang (100g)', sayur: 'Plecing Kangkung', buah: 'Pepaya Matang (100g)', minuman: 'Air Mineral (300ml)', kalori_est: 520, protein_g: 26, catatan: 'Ikan lokal segar dari nelayan' },
  { nama_menu: 'Nasi + Ayam Pop + Telur Dadar + Sop Bakso', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Ayam Pop + Telur Dadar (80g)', sayur: 'Sayur Sop Bakso', buah: 'Apel Hijau (1 buah)', minuman: 'Es Teh Manis (250ml)', kalori_est: 600, protein_g: 30, catatan: 'Ayam pop khas Padang, double protein' },
  { nama_menu: 'Nasi + Gulai Ayam + Sayur Nangka', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Gulai Ayam Santan (100g)', sayur: 'Sayur Nangka Muda', buah: 'Semangka (150g)', minuman: 'Air Mineral (300ml)', kalori_est: 620, protein_g: 27, catatan: 'Gulai santan khas Sulawesi' },
  { nama_menu: 'Nasi + Bakso Ikan + Sayur Kol', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Bakso Ikan Tongkol (120g)', sayur: 'Sayur Kol Goreng', buah: 'Pisang Ambon (1 buah)', minuman: 'Teh Manis Hangat (250ml)', kalori_est: 540, protein_g: 25, catatan: 'Bakso ikan homemade' },
  { nama_menu: 'Nasi Kuning + Ayam Goreng + Teri Medan', tipe_porsi: 'porsi_besar', nasi: 'Nasi Kuning (200g)', lauk_pauk: 'Ayam Goreng + Ikan Teri Medan (90g)', sayur: 'Sayur Labu Siam', buah: 'Mangga Harum Manis (1 buah)', minuman: 'Air Jeruk Nipis (250ml)', kalori_est: 610, protein_g: 29, catatan: 'Nasi kuning tradisional Sulawesi' },
  { nama_menu: 'Nasi + Daging Sapi Masak Cabai + Sayur Sop', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Daging Sapi Masak Cabai (80g)', sayur: 'Sayur Sop Kentang Wortel', buah: 'Jeruk Ponkam (1 buah)', minuman: 'Air Mineral (300ml)', kalori_est: 630, protein_g: 34, catatan: 'Tinggi zat besi dari daging sapi' },
  { nama_menu: 'Nasi + Ikan Tongkol Balado + Tahu Tempe', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Ikan Tongkol Balado (100g) + Tahu Tempe (60g)', sayur: 'Sayur Asem', buah: 'Pepaya Matang (100g)', minuman: 'Teh Manis Hangat (250ml)', kalori_est: 560, protein_g: 27, catatan: 'Double protein ikan + nabati' },
  { nama_menu: 'Nasi + Ayam Suwir + Perkedel Kentang', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih (200g)', lauk_pauk: 'Ayam Suwir Pedas (90g) + Perkedel Kentang (50g)', sayur: 'Tumis Kangkung', buah: 'Pisang Raja (1 buah)', minuman: 'Air Mineral (300ml)', kalori_est: 590, protein_g: 26, catatan: 'Ayam suwir bumbu pedas' },
  // === PORSI KECIL (10 menu) ===
  { nama_menu: 'Nasi + Ayam Goreng Kecil + Bayam', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Ayam Goreng Kunyit (60g)', sayur: 'Sayur Bayam Bening', buah: 'Pisang Raja (1/2 buah)', minuman: 'Air Mineral (200ml)', kalori_est: 380, protein_g: 18, catatan: 'Porsi anak SD-SMP' },
  { nama_menu: 'Nasi + Rendang Daging Kecil + Nangka', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Rendang Daging (50g)', sayur: 'Sayur Nangka Muda', buah: 'Jeruk Manis (1/2 buah)', minuman: 'Teh Manis Hangat (200ml)', kalori_est: 420, protein_g: 20, catatan: 'Rendang porsi kecil untuk anak' },
  { nama_menu: 'Nasi + Ikan Tongkol Kecil + Kangkung', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Ikan Tongkol Pindang (60g)', sayur: 'Plecing Kangkung', buah: 'Pepaya Potong (50g)', minuman: 'Air Mineral (200ml)', kalori_est: 340, protein_g: 16, catatan: 'Ikan porsi anak, omega-3 untuk otak' },
  { nama_menu: 'Nasi + Ayam Pop Kecil + Sop Bakso', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Ayam Pop + Telur Dadar (50g)', sayur: 'Sayur Sop Bakso', buah: 'Apel Potong (50g)', minuman: 'Es Teh Manis (200ml)', kalori_est: 390, protein_g: 19, catatan: 'Ayam pop porsi anak' },
  { nama_menu: 'Nasi + Gulai Ayam Kecil + Nangka', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Gulai Ayam (60g)', sayur: 'Sayur Nangka Muda', buah: 'Semangka Potong (80g)', minuman: 'Air Mineral (200ml)', kalori_est: 400, protein_g: 17, catatan: 'Gulai santan porsi anak' },
  { nama_menu: 'Nasi + Bakso Ikan Kecil + Sayur Kol', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Bakso Ikan (70g)', sayur: 'Sayur Kol Goreng', buah: 'Pisang Ambon (1/2 buah)', minuman: 'Teh Manis Hangat (200ml)', kalori_est: 360, protein_g: 16, catatan: 'Bakso ikan porsi anak' },
  { nama_menu: 'Nasi Kuning Kecil + Ayam Goreng + Teri', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Kuning (120g)', lauk_pauk: 'Ayam Goreng + Teri (55g)', sayur: 'Sayur Labu Siam', buah: 'Mangga Potong (50g)', minuman: 'Air Jeruk Nipis (200ml)', kalori_est: 410, protein_g: 18, catatan: 'Nasi kuning porsi anak' },
  { nama_menu: 'Nasi + Daging Cabai Kecil + Sop', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Daging Masak Cabai (50g)', sayur: 'Sayur Sop Kentang Wortel', buah: 'Jeruk Ponkam (1/2 buah)', minuman: 'Air Mineral (200ml)', kalori_est: 415, protein_g: 22, catatan: 'Daging porsi kecil, tinggi zat besi' },
  { nama_menu: 'Nasi + Telur Balado + Tempe Goreng', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Telur Balado (1 butir) + Tempe Goreng (40g)', sayur: 'Sayur Asem', buah: 'Pepaya Potong (50g)', minuman: 'Teh Manis Hangat (200ml)', kalori_est: 370, protein_g: 17, catatan: 'Protein telur + tempe nabati' },
  { nama_menu: 'Nasi + Nugget Ayam + Sup Sayur', tipe_porsi: 'porsi_kecil', nasi: 'Nasi Putih (120g)', lauk_pauk: 'Nugget Ayam (3 pcs)', sayur: 'Sup Makaroni Sayur', buah: 'Pisang Raja (1/2 buah)', minuman: 'Susu UHT (200ml)', kalori_est: 430, protein_g: 19, catatan: 'Nugget favorit anak-anak' },
  // === PORSI BAYI 6-12 BULAN (10 menu) ===
  { nama_menu: 'Bubur Nasi Ayam + Wortel Bayam', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Suwiran Ayam Rebus (30g)', sayur: 'Puree Wortel + Bayam (40g)', buah: 'Pisang Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 180, protein_g: 8, catatan: 'Tekstur lumat, mudah dicerna bayi 6-9 bulan' },
  { nama_menu: 'Bubur Nasi Rendang + Labu Kuning', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Rendang Daging Cincang (25g)', sayur: 'Puree Labu Kuning (40g)', buah: 'Pisang Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 190, protein_g: 9, catatan: 'Rendang cincang halus untuk bayi' },
  { nama_menu: 'Bubur Nasi Ikan + Kentang Wortel', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Ikan Tongkol Suwir Halus (25g)', sayur: 'Puree Kentang + Wortel (40g)', buah: 'Pepaya Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 175, protein_g: 8, catatan: 'Omega-3 ikan untuk perkembangan otak bayi' },
  { nama_menu: 'Bubur Nasi Ayam + Sup Kentang', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Suwiran Ayam Pop (30g)', sayur: 'Sup Kentang Wortel Halus (50g)', buah: 'Apel Rebus Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 185, protein_g: 9, catatan: 'Sup kentang hangat untuk bayi' },
  { nama_menu: 'Bubur Santan Ayam + Kacang Hijau', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Santan Halus (80g)', lauk_pauk: 'Suwiran Ayam Gulai (25g)', sayur: 'Bubur Kacang Hijau (30g)', buah: 'Semangka Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 195, protein_g: 8, catatan: 'Santan dan kacang hijau untuk kalori ekstra' },
  { nama_menu: 'Bubur Nasi Ikan + Makaroni Wortel', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Bakso Ikan Cincang (25g)', sayur: 'Makaroni Rebus + Wortel (40g)', buah: 'Pisang Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 180, protein_g: 7, catatan: 'Makaroni lunak untuk bayi belajar mengunyah' },
  { nama_menu: 'Bubur Nasi Kuning + Ayam Suwir', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Kuning (80g)', lauk_pauk: 'Suwiran Ayam Rebus (30g)', sayur: 'Puree Labu Siam (40g)', buah: 'Mangga Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 185, protein_g: 8, catatan: 'Bubur kuning aromatik untuk bayi' },
  { nama_menu: 'Bubur Nasi Hati Ayam + Brokoli', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Hati Ayam Cincang (25g)', sayur: 'Puree Brokoli + Kentang (40g)', buah: 'Pepaya Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 190, protein_g: 10, catatan: 'Hati ayam sumber zat besi tinggi' },
  { nama_menu: 'Bubur Nasi Tempe + Bayam Wortel', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Tempe Cincang Halus (25g)', sayur: 'Puree Bayam + Wortel (40g)', buah: 'Pisang Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 170, protein_g: 7, catatan: 'Protein nabati dari tempe' },
  { nama_menu: 'Bubur Nasi Telur + Makaroni Sayur', tipe_porsi: 'porsi_bayi', nasi: 'Bubur Nasi Halus (80g)', lauk_pauk: 'Telur Rebus Cincang (1/2 butir)', sayur: 'Makaroni + Wortel Rebus (40g)', buah: 'Apel Rebus Lumat (30g)', minuman: 'Susu Bayi / ASI', kalori_est: 185, protein_g: 9, catatan: 'Telur sumber protein hewani ekonomis' },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const tipe = searchParams.get('tipe_porsi')

    // Seed action
    if (action === 'seed') {
      const { error: chk } = await supabase.from('nutrition_menu_db').select('id').limit(1)
      if (chk) return NextResponse.json({ error: 'Tabel nutrition_menu_db belum ada.', step: 'Buat tabel dulu di Supabase SQL Editor.' }, { status: 400 })
      await supabase.from('nutrition_menu_db').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      const { data, error } = await supabase.from('nutrition_menu_db').insert(SEED_DATA).select('id,nama_menu,tipe_porsi')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: `${data!.length} menu database berhasil disimpan`, count: data!.length })
    }

    // Get all menus (with optional filter)
    let q = supabase.from('nutrition_menu_db').select('*').eq('aktif', true).order('tipe_porsi').order('nama_menu')
    if (tipe) q = q.eq('tipe_porsi', tipe)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data menu'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, error } = await supabase.from('nutrition_menu_db').insert([{
      nama_menu: body.nama_menu,
      tipe_porsi: body.tipe_porsi,
      nasi: body.nasi || 'Nasi Putih',
      lauk_pauk: body.lauk_pauk,
      sayur: body.sayur,
      buah: body.buah || null,
      minuman: body.minuman || null,
      kalori_est: body.kalori_est || null,
      protein_g: body.protein_g || null,
      catatan: body.catatan || null,
      gambar_url: body.gambar_url || null,
      aktif: true,
    }]).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data![0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menyimpan menu'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    const body = await req.json()
    const { error } = await supabase.from('nutrition_menu_db').update({
      nama_menu: body.nama_menu, tipe_porsi: body.tipe_porsi,
      nasi: body.nasi, lauk_pauk: body.lauk_pauk, sayur: body.sayur,
      buah: body.buah, minuman: body.minuman,
      kalori_est: body.kalori_est, protein_g: body.protein_g,
      catatan: body.catatan, gambar_url: body.gambar_url,
      aktif: body.aktif,
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memperbarui menu'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    const { error } = await supabase.from('nutrition_menu_db').update({ aktif: false }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus menu'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
