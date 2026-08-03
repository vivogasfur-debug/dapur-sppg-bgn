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
  item_id UUID NOT NULL REFERENCES stock_items(id),
  item_name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
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
`

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'check') {
      const { error } = await supabase.from('distributions').select('id').limit(1)
      if (error) {
        return NextResponse.json({ needsSetup: true, sql: SETUP_SQL })
      }
      return NextResponse.json({ needsSetup: false })
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

    if (action === 'schools') {
      const { data, error } = await supabase
        .from('students')
        .select('school_name')
        .not('school_name', 'is', null)
      if (error) throw error
      const schools = [...new Set(data?.map(d => d.school_name).filter(Boolean) || [])] as string[]
      return NextResponse.json(schools.sort())
    }

    if (action === 'posyandu') {
      const { data, error } = await supabase
        .from('beneficiaries_3b')
        .select('posyandu_name')
        .not('posyandu_name', 'is', null)
      if (error) throw error
      const posyandu = [...new Set(data?.map(d => d.posyandu_name).filter(Boolean) || [])] as string[]
      return NextResponse.json(posyandu.sort())
    }

    if (action === 'stock-items') {
      const { data, error } = await supabase
        .from('stock_items')
        .select('id, name, unit, stock_qty, category')
        .gt('stock_qty', 0)
        .order('name')
      if (error) throw error
      return NextResponse.json(data)
    }

    if (action === 'seed') {
      const { data: existing } = await supabase.from('distributions').select('id').limit(1)
      if (existing && existing.length > 0) {
        return NextResponse.json({ message: 'Data distribusi sudah ada', seeded: false })
      }

      const { data: stockItems } = await supabase.from('stock_items').select('id, name, unit').limit(5)
      const items = stockItems || []

      const now = new Date()
      const sampleDists = []
      for (let i = 0; i < 8; i++) {
        const d = new Date(now)
        d.setDate(d.getDate() - i * 3)
        sampleDists.push({
          distribution_date: d.toISOString().slice(0, 10),
          destination_type: i % 2 === 0 ? 'Sekolah' : 'Posyandu',
          destination_name: i % 2 === 0
            ? ['SDN 1 Sangia', 'SDN 2 Wambulu', 'SDN 3 Borong', 'SDN 4 Tambada'][i % 4]
            : ['Posyandu Melati', 'Posyandu Mawar', 'Posyandu Dahlia', 'Posyandu Anggrek'][i % 4],
          pic_name: ['Pak Budi', 'Bu Sari', 'Pak Andi', 'Bu Dewi'][i % 4],
          notes: i === 0 ? 'Distribusi rutin mingguan' : null,
          status: (['Diterima', 'Dikirim', 'Draft', 'Diterima', 'Dikirim', 'Diterima', 'Draft', 'Dibatalkan'] as const)[i],
        })
      }

      const { data: dists, error: distErr } = await supabase
        .from('distributions')
        .insert(sampleDists)
        .select()
      if (distErr) throw distErr

      const distItems = []
      for (const dist of dists || []) {
        const numItems = 2 + Math.floor(Math.random() * 3)
        for (let j = 0; j < numItems && j < items.length; j++) {
          distItems.push({
            distribution_id: dist.id,
            item_id: items[j % items.length].id,
            item_name: items[j % items.length].name,
            quantity: (5 + Math.floor(Math.random() * 20)) * (j % 2 === 0 ? 1 : 0.5),
            unit: items[j % items.length].unit,
            notes: j === 0 ? 'Prioritas utama' : null,
          })
        }
      }

      if (distItems.length > 0) {
        const { error: itemErr } = await supabase.from('distribution_items').insert(distItems)
        if (itemErr) throw itemErr
      }

      return NextResponse.json({ message: 'Data distribusi berhasil disemai', seeded: true, count: dists?.length })
    }

    // Default: list distributions with items
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
    return NextResponse.json({ error: msg }, { status: 500 })
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
      const distItems = items.map((item: { item_id: string; item_name: string; quantity: number; unit: string; notes?: string }) => ({
        distribution_id: distId,
        item_id: item.item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes || null,
      }))

      const { error: itemErr } = await supabase.from('distribution_items').insert(distItems)
      if (itemErr) throw itemErr

      if (distData.status === 'Dikirim' || distData.status === 'Diterima') {
        for (const item of items) {
          const { data: stockItem } = await supabase
            .from('stock_items')
            .select('stock_qty')
            .eq('id', item.item_id)
            .single()
          if (stockItem) {
            const newQty = Number(stockItem.stock_qty) - Number(item.quantity)
            await supabase.from('stock_items').update({ stock_qty: Math.max(0, newQty) }).eq('id', item.item_id)
          }
          await supabase.from('stock_transactions').insert([{
            item_id: item.item_id,
            type: 'Keluar',
            quantity: item.quantity,
            transaction_date: distData.distribution_date || new Date().toISOString().slice(0, 10),
            notes: `Distribusi ke ${distData.destination_name} (${distData.destination_type})`,
            reference: `DIST-${distId.toString().slice(0, 8)}`,
          }])
        }
      }
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
      const { data: oldDist, error: fetchErr } = await supabase
        .from('distributions')
        .select('status')
        .eq('id', id)
        .single()
      if (fetchErr) throw fetchErr

      const oldStatus = oldDist.status
      const newStatus = body.status

      const { error: updateErr } = await supabase
        .from('distributions')
        .update({ status: newStatus })
        .eq('id', id)
      if (updateErr) throw updateErr

      if ((newStatus === 'Dikirim' || newStatus === 'Diterima') && oldStatus === 'Draft') {
        const { data: distItems } = await supabase
          .from('distribution_items')
          .select('item_id, item_name, quantity, unit')
          .eq('distribution_id', id)

        const { data: dist } = await supabase
          .from('distributions')
          .select('destination_name, destination_type, distribution_date')
          .eq('id', id)
          .single()

        for (const item of distItems || []) {
          const { data: stockItem } = await supabase
            .from('stock_items')
            .select('stock_qty')
            .eq('id', item.item_id)
            .single()
          if (stockItem) {
            const newQty = Number(stockItem.stock_qty) - Number(item.quantity)
            await supabase.from('stock_items').update({ stock_qty: Math.max(0, newQty) }).eq('id', item.item_id)
          }
          await supabase.from('stock_transactions').insert([{
            item_id: item.item_id,
            type: 'Keluar',
            quantity: item.quantity,
            transaction_date: dist?.distribution_date || new Date().toISOString().slice(0, 10),
            notes: `Distribusi ke ${dist?.destination_name} (${dist?.destination_type})`,
            reference: `DIST-${id.toString().slice(0, 8)}`,
          }])
        }
      }

      if ((oldStatus === 'Dikirim' || oldStatus === 'Diterima') && (newStatus === 'Draft' || newStatus === 'Dibatalkan')) {
        const { data: distItems } = await supabase
          .from('distribution_items')
          .select('item_id, quantity')
          .eq('distribution_id', id)

        for (const item of distItems || []) {
          const { data: stockItem } = await supabase
            .from('stock_items')
            .select('stock_qty')
            .eq('id', item.item_id)
            .single()
          if (stockItem) {
            const newQty = Number(stockItem.stock_qty) + Number(item.quantity)
            await supabase.from('stock_items').update({ stock_qty: newQty }).eq('id', item.item_id)
          }
        }
      }

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
        const distItems = items.map((item: { item_id: string; item_name: string; quantity: number; unit: string; notes?: string }) => ({
          distribution_id: id,
          item_id: item.item_id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
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
      const { data: allDist } = await supabase
        .from('distributions')
        .select('id, status')
      for (const d of allDist || []) {
        if (d.status === 'Dikirim' || d.status === 'Diterima') {
          const { data: dItems } = await supabase
            .from('distribution_items')
            .select('item_id, quantity')
            .eq('distribution_id', d.id)
          for (const item of dItems || []) {
            const { data: si } = await supabase.from('stock_items').select('stock_qty').eq('id', item.item_id).single()
            if (si) await supabase.from('stock_items').update({ stock_qty: Number(si.stock_qty) + Number(item.quantity) }).eq('id', item.item_id)
          }
        }
      }
      const { error } = await supabase.from('distributions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      return NextResponse.json({ success: true, deleted: 'all' })
    }

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const { data: dist } = await supabase.from('distributions').select('status').eq('id', id).single()
    if (dist && (dist.status === 'Dikirim' || dist.status === 'Diterima')) {
      const { data: dItems } = await supabase
        .from('distribution_items')
        .select('item_id, quantity')
        .eq('distribution_id', id)
      for (const item of dItems || []) {
        const { data: si } = await supabase.from('stock_items').select('stock_qty').eq('id', item.item_id).single()
        if (si) await supabase.from('stock_items').update({ stock_qty: Number(si.stock_qty) + Number(item.quantity) }).eq('id', item.item_id)
      }
    }

    const { error } = await supabase.from('distributions').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus distribusi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
