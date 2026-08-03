import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const SETUP_SQL = `
CREATE TABLE IF NOT EXISTS distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('Sekolah', 'Posyandu')),
  destination_name TEXT NOT NULL,
  pic_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Dikirim', 'Diterima', 'Dibatalkan')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS distribution_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  distribution_id UUID NOT NULL REFERENCES distributions(id) ON DELETE CASCADE,
  weekly_plan_id UUID REFERENCES weekly_menu_plans(id) ON DELETE SET NULL,
  menu_name TEXT NOT NULL,
  tipe_porsi TEXT NOT NULL DEFAULT 'porsi_besar',
  nasi TEXT,
  lauk_pauk TEXT,
  sayur TEXT,
  buah TEXT,
  minuman TEXT,
  jumlah_porsi INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_distributions_date ON distributions(distribution_date DESC);
CREATE INDEX IF NOT EXISTS idx_distributions_dest ON distributions(destination_type, destination_name);
CREATE INDEX IF NOT EXISTS idx_dist_items_dist ON distribution_items(distribution_id);

CREATE OR REPLACE FUNCTION update_distributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_distributions_updated_at ON distributions;
CREATE TRIGGER trg_distributions_updated_at
  BEFORE UPDATE ON distributions
  FOR EACH ROW EXECUTE FUNCTION update_distributions_updated_at();

ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on distributions" ON distributions
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on distribution_items" ON distribution_items
  FOR ALL USING (true) WITH CHECK (true);
`

const RLS_FIX_SQL = `ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on distributions" ON distributions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on distribution_items" ON distribution_items FOR ALL USING (true) WITH CHECK (true);
`

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'check') {
      const { error } = await supabase.from('distributions').select('id').limit(1)
      if (error) {
        const errMsg = error.message || ''
        const isMissing = errMsg.includes('does not exist') || errMsg.includes('relation')
        const isRls = errMsg.includes('permission denied') || errMsg.includes('policy') || errMsg.includes('42501')
        return NextResponse.json({ needsSetup: isMissing, needsRlsFix: isRls, sql: isRls ? RLS_FIX_SQL : SETUP_SQL, error: errMsg })
      }
      return NextResponse.json({ needsSetup: false, needsRlsFix: false })
    }

    if (action === 'setup') {
      return NextResponse.json({ sql: SETUP_SQL })
    }

    if (action === 'summary') {
      const { data: allDist, error: errAll } = await supabase.from('distributions').select('*')
      if (errAll) throw errAll
      const draft = allDist?.filter(d => d.status === 'Draft').length || 0
      const dikirim = allDist?.filter(d => d.status === 'Dikirim').length || 0
      const diterima = allDist?.filter(d => d.status === 'Diterima').length || 0
      const dibatalkan = allDist?.filter(d => d.status === 'Dibatalkan').length || 0
      return NextResponse.json({ total: allDist?.length || 0, draft, dikirim, diterima, dibatalkan })
    }

    // Ambil daftar sekolah dari students
    if (action === 'schools') {
      const { data, error } = await supabase.from('students').select('school_name').not('school_name', 'is', null)
      if (error) throw error
      const schools = [...new Set(data?.map(d => d.school_name).filter(Boolean) || [])] as string[]
      return NextResponse.json(schools.sort())
    }

    // Ambil daftar posyandu dari beneficiaries_3b
    if (action === 'posyandu') {
      const { data, error } = await supabase.from('beneficiaries_3b').select('posyandu_name').not('posyandu_name', 'is', null)
      if (error) throw error
      const posyandu = [...new Set(data?.map(d => d.posyandu_name).filter(Boolean) || [])] as string[]
      return NextResponse.json(posyandu.sort())
    }

    // Ambil menu harian dari weekly_menu_plans untuk tanggal tertentu
    // Pertama coba cocokkan tanggal persis, jika kosong fallback ke hari (day_of_week)
    if (action === 'menu-by-date') {
      const tanggal = searchParams.get('tanggal')
      if (!tanggal) return NextResponse.json([])

      // Coba tanggal persis dulu
      let { data, error } = await supabase
        .from('weekly_menu_plans')
        .select(`id, tanggal, hari, tipe_porsi, penerima, gambar, status,
          nutrition_menu_db(id, nama_menu, nasi, lauk_pauk, sayur, buah, minuman, kalori_est, protein_g, tipe_porsi)
        `)
        .eq('tanggal', tanggal)
        .order('tipe_porsi')
      if (error) throw error

      // Fallback: jika tidak ketemu tanggal persis, cocokkan berdasarkan hari
      if (!data || data.length === 0) {
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        const dayName = dayNames[new Date(tanggal + 'T00:00:00').getDay()]
        const fallback = await supabase
          .from('weekly_menu_plans')
          .select(`id, tanggal, hari, tipe_porsi, penerima, gambar, status,
            nutrition_menu_db(id, nama_menu, nasi, lauk_pauk, sayur, buah, minuman, kalori_est, protein_g, tipe_porsi)
          `)
          .eq('hari', dayName)
          .order('tipe_porsi')
        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          data = fallback.data
        }
      }

      return NextResponse.json(data || [])
    }

    // Ambil semua menu minggu ini (untuk referensi)
    if (action === 'menu-week') {
      const { data, error } = await supabase
        .from('weekly_menu_plans')
        .select(`id, tanggal, hari, tipe_porsi, penerima,
          nutrition_menu_db(id, nama_menu, nasi, lauk_pauk, sayur, buah, minuman, kalori_est, protein_g)
        `)
        .order('tanggal', { ascending: true })
        .order('tipe_porsi')
      if (error) throw error
      return NextResponse.json(data || [])
    }

    // Seed simulasi 1 minggu
    if (action === 'seed') {
      const { error: checkErr } = await supabase.from('distributions').select('id').limit(1)
      if (checkErr) {
        const errMsg = checkErr.message || ''
        const isMissing = errMsg.includes('does not exist') || errMsg.includes('relation')
        const isRls = errMsg.includes('permission denied') || errMsg.includes('policy')
        return NextResponse.json({
          message: isRls ? 'RLS menghalangi. Jalankan SQL fix di Supabase SQL Editor.' : 'Tabel belum dibuat. Jalankan SQL setup.',
          seeded: false, needsSetup: isMissing, needsRlsFix: isRls,
          sql: isRls ? RLS_FIX_SQL : SETUP_SQL,
        })
      }

      // Hapus data lama
      await supabase.from('distribution_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('distributions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // Ambil menu mingguan yang tersedia
      const { data: menus } = await supabase
        .from('weekly_menu_plans')
        .select(`id, tanggal, hari, tipe_porsi,
          nutrition_menu_db(id, nama_menu, nasi, lauk_pauk, sayur, buah, minuman, kalori_est)
        `)
        .order('tanggal', { ascending: true })

      const menuByDate: Record<string, typeof menus> = {}
      for (const m of menus || []) {
        if (!menuByDate[m.tanggal]) menuByDate[m.tanggal] = []
        menuByDate[m.tanggal].push(m)
      }

      const sekolahList = ['SDN 1 Sangia', 'SDN 2 Wambulu', 'SDN 3 Borong', 'SDN 4 Tambada']
      const posyanduList = ['Posyandu Melati', 'Posyandu Mawar', 'Posyandu Dahlia', 'Posyandu Anggrek']
      const picSekolah = ['Pak Budi Santoso', 'Bu Sari Wulandari', 'Pak Andi Pratama', 'Bu Dewi Lestari']
      const picPosyandu = ['Bu Ratna Sari', 'Bu Nurhaliza', 'Bu Hj. Aminah', 'Bu Kartika']

      const now = new Date()
      const dailyPlan = [
        null,                                       // Minggu
        ['Sekolah', 'Sekolah', 'Posyandu'],         // Senin
        ['Sekolah', 'Posyandu', 'Posyandu'],         // Selasa
        ['Sekolah', 'Sekolah', 'Posyandu'],         // Rabu
        ['Sekolah', 'Posyandu'],                     // Kamis
        ['Sekolah', 'Sekolah', 'Posyandu', 'Posyandu'], // Jumat
        ['Posyandu'],                               // Sabtu
      ]

      const sampleDists = []
      let distIdx = 0

      // Cari tanggal Senin minggu ini
      const today = now.getDay()
      const mondayOffset = today === 0 ? -6 : 1 - today
      const monday = new Date(now)
      monday.setDate(now.getDate() + mondayOffset - 7) // minggu lalu

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + dayOffset)
        const dateStr = d.toISOString().slice(0, 10)
        const dayOfWeek = d.getDay()
        const plan = dailyPlan[dayOfWeek]
        if (!plan) continue

        const dayMenus = menuByDate[dateStr] || []

        for (const type of plan) {
          const destList = type === 'Sekolah' ? sekolahList : posyanduList
          const picList = type === 'Sekolah' ? picSekolah : picPosyandu
          const destIdx = distIdx % destList.length

          let status: 'Draft' | 'Dikirim' | 'Diterima' | 'Dibatalkan'
          if (dayOffset >= 5) status = 'Draft' // Sabtu-Minggu draft
          else if (dayOffset >= 4) status = 'Dikirim' // Jumat dikirim
          else if (distIdx === 3) status = 'Dibatalkan'
          else status = 'Diterima'

          const notesList = [
            'Distribusi ompreng rutin', 'Tambahan porsi', null,
            'Pengganti kemarin', 'Menu spesial', null, null, 'Permintaan PIC', null, null, 'Rutin harian', null,
          ]

          sampleDists.push({
            distribution_date: dateStr,
            destination_type: type as 'Sekolah' | 'Posyandu',
            destination_name: destList[destIdx],
            pic_name: picList[destIdx],
            notes: notesList[distIdx % notesList.length],
            status,
            _menus: dayMenus, // sementara untuk buat items
          })
          distIdx++
        }
      }

      // Insert distribusi (tanpa _menus)
      const insertData = sampleDists.map(({ _menus, ...rest }) => rest)
      const { data: dists, error: distErr } = await supabase.from('distributions').insert(insertData).select()
      if (distErr) throw distErr

      // Buat distribution_items dari menu harian
      const distItems = []
      for (let di = 0; di < (dists || []).length; di++) {
        const dist = dists![di]
        const dayMenus = sampleDists[di]._menus || []

        if (dayMenus.length > 0) {
          // Gunakan menu dari Ahli Gizi
          for (const menu of dayMenus) {
            const menuDb = (menu as Record<string, unknown>).nutrition_menu_db as Record<string, unknown> | null
            distItems.push({
              distribution_id: dist.id,
              weekly_plan_id: menu.id,
              menu_name: menuDb?.nama_menu || `Menu ${menu.hari} ${menu.tipe_porsi}`,
              tipe_porsi: menu.tipe_porsi,
              nasi: menuDb?.nasi || null,
              lauk_pauk: menuDb?.lauk_pauk || null,
              sayur: menuDb?.sayur || null,
              buah: menuDb?.buah || null,
              minuman: menuDb?.minuman || null,
              jumlah_porsi: menu.tipe_porsi === 'porsi_bayi' ? 10 + Math.floor(Math.random() * 15) : 20 + Math.floor(Math.random() * 40),
              notes: null,
            })
          }
        } else {
          // Fallback: menu generik jika tidak ada menu dari Ahli Gizi
          const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date(dist.distribution_date + 'T00:00:00').getDay()]
          const genericMenus = [
            { tipe_porsi: 'porsi_besar', nama: `Menu ${hari} Porsi Besar` },
            { tipe_porsi: 'porsi_kecil', nama: `Menu ${hari} Porsi Kecil` },
          ]
          for (const gm of genericMenus) {
            distItems.push({
              distribution_id: dist.id,
              weekly_plan_id: null,
              menu_name: gm.nama,
              tipe_porsi: gm.tipe_porsi,
              nasi: 'Nasi Putih', lauk_pauk: '-', sayur: '-', buah: null, minuman: null,
              jumlah_porsi: gm.tipe_porsi === 'porsi_kecil' ? 30 : 25,
              notes: 'Menu belum diatur di Ahli Gizi',
            })
          }
        }
      }

      if (distItems.length > 0) {
        const { error: itemErr } = await supabase.from('distribution_items').insert(distItems)
        if (itemErr) throw itemErr
      }

      return NextResponse.json({
        message: `Simulasi 1 minggu: ${dists?.length} distribusi, ${distItems.length} menu ompreng`,
        seeded: true, count: dists?.length, items: distItems.length,
      })
    }

    // Default: list distribusi dengan items
    const destType = searchParams.get('destination_type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const month = searchParams.get('month')

    let query = supabase
      .from('distributions')
      .select('*, distribution_items(*)')
      .order('distribution_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (destType) query = query.eq('destination_type', destType)
    if (status) query = query.eq('status', status)
    if (month) {
      const [y, m] = month.split('-').map(Number)
      const start = `${y}-${String(m).padStart(2, '0')}-01`
      const end = `${y}-${String(m).padStart(2, '0')}-31`
      query = query.gte('distribution_date', start).lte('distribution_date', end)
    }

    const { data, error } = await query
    if (error) throw error

    let filtered = data || []
    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(d =>
        d.destination_name?.toLowerCase().includes(s) ||
        d.pic_name?.toLowerCase().includes(s) ||
        d.notes?.toLowerCase().includes(s)
      )
    }

    return NextResponse.json(filtered)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data distribusi'
    const isRls = msg.includes('permission denied') || msg.includes('policy') || msg.includes('42501')
    return NextResponse.json({ error: msg, needsRlsFix: isRls, sql: isRls ? RLS_FIX_SQL : undefined }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, ...distData } = body

    const { data: dist, error: distErr } = await supabase
      .from('distributions')
      .insert([{
        distribution_date: distData.distribution_date || new Date().toISOString().slice(0, 10),
        destination_type: distData.destination_type,
        destination_name: distData.destination_name,
        pic_name: distData.pic_name || null,
        notes: distData.notes || null,
        status: distData.status || 'Draft',
      }])
      .select()
    if (distErr) throw distErr

    const distId = dist[0].id

    if (items && items.length > 0) {
      const distItems = items.map((item: Record<string, unknown>) => ({
        distribution_id: distId,
        weekly_plan_id: item.weekly_plan_id || null,
        menu_name: item.menu_name,
        tipe_porsi: item.tipe_porsi || 'porsi_besar',
        nasi: item.nasi || null,
        lauk_pauk: item.lauk_pauk || null,
        sayur: item.sayur || null,
        buah: item.buah || null,
        minuman: item.minuman || null,
        jumlah_porsi: item.jumlah_porsi || 1,
        notes: item.notes || null,
      }))

      const { error: itemErr } = await supabase.from('distribution_items').insert(distItems)
      if (itemErr) throw itemErr
    }

    return NextResponse.json(dist[0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menyimpan distribusi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    if (action === 'status') {
      const body = await req.json()
      const { error: updateErr } = await supabase.from('distributions').update({ status: body.status }).eq('id', id)
      if (updateErr) throw updateErr
      return NextResponse.json({ success: true })
    }

    const body = await req.json()
    const { items, ...updateData } = body

    const { error: updateErr } = await supabase
      .from('distributions')
      .update({
        distribution_date: updateData.distribution_date,
        destination_type: updateData.destination_type,
        destination_name: updateData.destination_name,
        pic_name: updateData.pic_name || null,
        notes: updateData.notes || null,
      })
      .eq('id', id)
    if (updateErr) throw updateErr

    if (items) {
      await supabase.from('distribution_items').delete().eq('distribution_id', id)
      if (items.length > 0) {
        const distItems = items.map((item: Record<string, unknown>) => ({
          distribution_id: id,
          weekly_plan_id: item.weekly_plan_id || null,
          menu_name: item.menu_name,
          tipe_porsi: item.tipe_porsi || 'porsi_besar',
          nasi: item.nasi || null,
          lauk_pauk: item.lauk_pauk || null,
          sayur: item.sayur || null,
          buah: item.buah || null,
          minuman: item.minuman || null,
          jumlah_porsi: item.jumlah_porsi || 1,
          notes: item.notes || null,
        }))
        await supabase.from('distribution_items').insert(distItems)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memperbarui distribusi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    if (all === 'true') {
      await supabase.from('distribution_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      const { error } = await supabase.from('distributions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      return NextResponse.json({ success: true, deleted: 'all' })
    }

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    const { error } = await supabase.from('distributions').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus distribusi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
