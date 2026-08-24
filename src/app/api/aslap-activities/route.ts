import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function isMissingTableError(error: any): boolean {
  const msg = error?.message || ''
  const code = error?.code || ''
  const hint = error?.hint || ''
  return msg.includes('aslap_activities') || msg.includes('schema cache') ||
         msg.includes('does not exist') || msg.includes('relation') ||
         code === 'PGRST205' || code === '42P01'
}

function getSetupSQL() {
  return `CREATE TABLE IF NOT EXISTS public.aslap_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_date DATE NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('Sekolah', 'Posyandu')),
  location_name TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('Distribusi', 'Pendataan', 'Pemantauan', 'Sosialisasi', 'Lainnya')),
  status TEXT NOT NULL DEFAULT 'Selesai' CHECK (status IN ('Selesai', 'Proses', 'Dibatalkan')),
  porsi_kecil INTEGER DEFAULT 0,
  porsi_besar INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.aslap_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.aslap_activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.aslap_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.aslap_activities FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.aslap_activities FOR DELETE USING (true);`
}

export async function GET() {
  try {
    // Fetch all with pagination
    let allData: any[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase.from('aslap_activities')
        .select('*').order('visit_date', { ascending: false }).range(from, from + 499)
      if (error) {
        if (isMissingTableError(error)) {
          return NextResponse.json({ needsSetup: true, sql: getSetupSQL() }, { status: 200 })
        }
        throw error
      }
      if (!data || data.length === 0) break
      allData = allData.concat(data)
      from += data.length
    }
    return NextResponse.json(allData)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, error } = await supabase.from('aslap_activities').insert([{
      visit_date: body.visitDate,
      location_type: body.locationType,
      location_name: body.locationName,
      activity_type: body.activityType,
      status: body.status || 'Selesai',
      porsi_kecil: body.porsiKecil || 0,
      porsi_besar: body.porsiBesar || 0,
      notes: body.notes || null,
    }]).select()

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ needsSetup: true, sql: getSetupSQL() }, { status: 200 })
      }
      throw error
    }
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
    const { error } = await supabase.from('aslap_activities').update({
      visit_date: body.visitDate,
      location_type: body.locationType,
      location_name: body.locationName,
      activity_type: body.activityType,
      status: body.status,
      porsi_kecil: body.porsiKecil || 0,
      porsi_besar: body.porsiBesar || 0,
      notes: body.notes || null,
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
    const { error } = await supabase.from('aslap_activities').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
