import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const SETUP_SQL = `CREATE TABLE IF NOT EXISTS menu_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL,
  hari TEXT NOT NULL,
  kategori_penerima TEXT DEFAULT 'Umum',
  nasi TEXT NOT NULL DEFAULT 'Nasi Putih',
  lauk_pauk TEXT NOT NULL,
  sayur TEXT NOT NULL,
  buah TEXT,
  minuman TEXT,
  kalori_est NUMERIC,
  protein_g NUMERIC,
  catatan TEXT,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE menu_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on menu_plans" ON menu_plans FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_menu_plans_tanggal ON menu_plans(tanggal DESC);`

const SEED_DATA = [
  { tanggal:'2025-07-28', hari:'Senin', kategori_penerima:'Umum', nasi:'Nasi Putih', lauk_pauk:'Ayam Goreng Kunyit', sayur:'Sayur Bayam Bening', buah:'Pisang Raja', minuman:'Air Mineral', kalori_est:580, protein_g:28, catatan:'Menu pembuka minggu, tinggi protein' },
  { tanggal:'2025-07-28', hari:'Senin', kategori_penerima:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Ayam Bakar + Telur Dadar', sayur:'Sup Wortel Kentang', buah:'Pisang Raja', minuman:'Susu UHT', kalori_est:720, protein_g:38, catatan:'Extra protein untuk ibu hamil' },
  { tanggal:'2025-07-28', hari:'Senin', kategori_penerima:'Balita', nasi:'Nasi Tim Ayam', lauk_pauk:'Tempe Goreng', sayur:'Bubur Bayam Wortel', buah:'Pisang Susu', minuman:'Susu UHT', kalori_est:450, protein_g:22, catatan:'Tekstur mudah dikunyah balita' },
  { tanggal:'2025-07-29', hari:'Selasa', kategori_penerima:'Umum', nasi:'Nasi Putih', lauk_pauk:'Rendang Daging Sapi', sayur:'Sayur Nangka Muda', buah:'Jeruk Manis', minuman:'Teh Manis Hangat', kalori_est:650, protein_g:32, catatan:'Rendang dengan bumbu rempah lengkap' },
  { tanggal:'2025-07-29', hari:'Selasa', kategori_penerima:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Rendang Daging + Ikan Tongkol', sayur:'Sayur Nangka + Tahu Bacem', buah:'Jeruk Manis', minuman:'Jus Jambu', kalori_est:780, protein_g:42, catatan:'Double protein hewani dan nabati' },
  { tanggal:'2025-07-29', hari:'Selasa', kategori_penerima:'Balita', nasi:'Nasi Goreng Telur', lauk_pauk:'Sosis Ayam', sayur:'Sup Makaroni Sayur', buah:'Jeruk Manis', minuman:'Susu UHT', kalori_est:480, protein_g:24, catatan:'Nasi goreng lembut untuk balita' },
  { tanggal:'2025-07-30', hari:'Rabu', kategori_penerima:'Umum', nasi:'Nasi Putih', lauk_pauk:'Ikan Tongkol Pindang', sayur:'Plecing Kangkung', buah:'Pepaya Matang', minuman:'Air Mineral', kalori_est:520, protein_g:26, catatan:'Ikan lokal segar dari nelayan' },
  { tanggal:'2025-07-30', hari:'Rabu', kategori_penerima:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Ikan Tongkol + Telur Balado', sayur:'Plecing Kangkung + Tahu Goreng', buah:'Pepaya Matang', minuman:'Susu UHT', kalori_est:700, protein_g:40, catatan:'Asam folat dari pepaya untuk janin' },
  { tanggal:'2025-07-30', hari:'Rabu', kategori_penerima:'Balita', nasi:'Bubur Ayam Sayur', lauk_pauk:'Perkedel Kentang', sayur:'Bubur Labu Kuning', buah:'Pepaya Matang', minuman:'Susu UHT', kalori_est:420, protein_g:20, catatan:'Bubur lembut bergizi tinggi' },
  { tanggal:'2025-07-31', hari:'Kamis', kategori_penerima:'Umum', nasi:'Nasi Putih', lauk_pauk:'Ayam Pop + Telur Dadar', sayur:'Sayur Sop Bakso', buah:'Apel Hijau', minuman:'Es Teh Manis', kalori_est:600, protein_g:30, catatan:'Ayam pop khas Padang' },
  { tanggal:'2025-07-31', hari:'Kamis', kategori_penerima:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Ayam Pop + Daging Sapi Masak Cabai', sayur:'Sayur Sop + Tempe Bacem', buah:'Apel Hijau', minuman:'Susu UHT', kalori_est:750, protein_g:44, catatan:'Menu tinggi zat besi' },
  { tanggal:'2025-07-31', hari:'Kamis', kategori_penerima:'Balita', nasi:'Nasi Tim Ikan', lauk_pauk:'Tempe Goreng', sayur:'Sup Kentang Wortel', buah:'Apel Hijau', minuman:'Susu UHT', kalori_est:440, protein_g:23, catatan:'Omega-3 dari ikan untuk perkembangan otak' },
  { tanggal:'2025-08-01', hari:'Jumat', kategori_penerima:'Umum', nasi:'Nasi Putih', lauk_pauk:'Gulai Ayam Santan', sayur:'Sayur Nangka Muda', buah:'Semangka', minuman:'Air Mineral', kalori_est:620, protein_g:27, catatan:'Gulai santan khas Sulawesi' },
  { tanggal:'2025-08-01', hari:'Jumat', kategori_penerima:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Gulai Ayam + Telur Rebus', sayur:'Sayur Nangka + Daun Singkong Rebus', buah:'Semangka', minuman:'Jus Alpukat', kalori_est:760, protein_g:40, catatan:'Alpukat untuk asam lemak esensial' },
  { tanggal:'2025-08-01', hari:'Jumat', kategori_penerima:'Balita', nasi:'Nasi Tim Ayam Santan', lauk_pauk:'Perkedel Jagung', sayur:'Bubur Kacang Hijau', buah:'Semangka', minuman:'Susu UHT', kalori_est:460, protein_g:21, catatan:'Kacang hijau sumber protein nabati' },
  { tanggal:'2025-08-02', hari:'Sabtu', kategori_penerima:'Umum', nasi:'Nasi Putih', lauk_pauk:'Bakso Ikan Tongkol', sayur:'Sayur Kol Goreng', buah:'Pisang Ambon', minuman:'Teh Manis Hangat', kalori_est:540, protein_g:25, catatan:'Bakso ikan homemade' },
  { tanggal:'2025-08-02', hari:'Sabtu', kategori_penerima:'Bumil', nasi:'Nasi Putih', lauk_pauk:'Bakso Ikan + Ayam Suwir', sayur:'Sayur Kol + Tumis Tahu', buah:'Pisang Ambon', minuman:'Susu UHT', kalori_est:710, protein_g:39, catatan:'Variasi lauk tinggi protein' },
  { tanggal:'2025-08-02', hari:'Sabtu', kategori_penerima:'Balita', nasi:'Mie Goreng Telur', lauk_pauk:'Nugget Ayam', sayur:'Sup Sayur Makaroni', buah:'Pisang Ambon', minuman:'Susu UHT', kalori_est:470, protein_g:22, catatan:'Mie goreng bertelur favorit anak' },
  { tanggal:'2025-08-03', hari:'Minggu', kategori_penerima:'Umum', nasi:'Nasi Kuning', lauk_pauk:'Ayam Goreng + Ikan Teri Medan', sayur:'Sayur Labu Siam', buah:'Mangga Harum Manis', minuman:'Air Jeruk Nipis', kalori_est:610, protein_g:29, catatan:'Nasi kuning tradisional Sulawesi' },
  { tanggal:'2025-08-03', hari:'Minggu', kategori_penerima:'Bumil', nasi:'Nasi Kuning', lauk_pauk:'Ayam Goreng + Daging Sapi Suwir', sayur:'Sayur Labu + Urap', buah:'Mangga Harum Manis', minuman:'Jus Mangga', kalori_est:770, protein_g:43, catatan:'Vitamin C dari mangga dan jeruk' },
  { tanggal:'2025-08-03', hari:'Minggu', kategori_penerima:'Balita', nasi:'Nasi Kuning Telur', lauk_pauk:'Suwiran Ayam', sayur:'Sup Makaroni Wortel', buah:'Mangga Potong', minuman:'Susu UHT', kalori_est:450, protein_g:24, catatan:'Nasi kuning lembut, porsi balita' },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'check') {
      const { error } = await supabase.from('menu_plans').select('id').limit(1)
      return NextResponse.json({ exists: !error, sql: SETUP_SQL })
    }

    if (action === 'seed') {
      const { error: chk } = await supabase.from('menu_plans').select('id').limit(1)
      if (chk) return NextResponse.json({ error: 'Tabel belum ada. Jalankan SQL di Supabase SQL Editor.', sql: SETUP_SQL }, { status: 400 })
      await supabase.from('menu_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      const { data, error } = await supabase.from('menu_plans').insert(SEED_DATA).select()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: `Menu 1 minggu berhasil (${data.length} menu)` })
    }

    const { searchParams: sp } = new URL(req.url)
    const kategori = sp.get('kategori')
    let q = supabase.from('menu_plans').select('*').order('tanggal', { ascending: true }).order('kategori_penerima')
    if (kategori) q = q.eq('kategori_penerima', kategori)
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
    const { data, error } = await supabase.from('menu_plans').insert([{
      tanggal: body.tanggal, hari: body.hari, kategori_penerima: body.kategori_penerima || 'Umum',
      nasi: body.nasi || 'Nasi Putih', lauk_pauk: body.lauk_pauk, sayur: body.sayur,
      buah: body.buah || null, minuman: body.minuman || null,
      kalori_est: body.kalori_est || null, protein_g: body.protein_g || null,
      catatan: body.catatan || null, status: 'Aktif',
    }]).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data[0], { status: 201 })
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
    const { error } = await supabase.from('menu_plans').update({
      tanggal: body.tanggal, hari: body.hari, kategori_penerima: body.kategori_penerima,
      nasi: body.nasi, lauk_pauk: body.lauk_pauk, sayur: body.sayur,
      buah: body.buah, minuman: body.minuman,
      kalori_est: body.kalori_est, protein_g: body.protein_g,
      catatan: body.catatan, status: body.status,
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
    const all = searchParams.get('all')
    if (all === 'true') {
      const { error } = await supabase.from('menu_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    const { error } = await supabase.from('menu_plans').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus menu'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
