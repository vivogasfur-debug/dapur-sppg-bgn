import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data stok'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, error } = await supabase.from('stock_items').insert([{
      name: body.name,
      category: body.category || 'Lainnya',
      unit: body.unit || 'pcs',
      stock_qty: body.stock_qty || 0,
      min_stock: body.min_stock || 0,
      location: body.location || '-',
      description: body.description || null,
    }]).select()

    if (error) throw error
    return NextResponse.json(data[0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menyimpan data stok'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const body = await req.json()
    const { error } = await supabase.from('stock_items').update({
      name: body.name,
      category: body.category || 'Lainnya',
      unit: body.unit || 'pcs',
      min_stock: body.min_stock || 0,
      location: body.location || '-',
      description: body.description || null,
    }).eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memperbarui data stok'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    if (all === 'true') {
      const { error } = await supabase.from('stock_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      return NextResponse.json({ success: true, deleted: 'all' })
    }

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    const { error } = await supabase.from('stock_items').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus data stok'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
