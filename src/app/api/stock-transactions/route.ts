import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('item_id')

    let query = supabase
      .from('stock_transactions')
      .select('*, stock_items(name, unit, category)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)

    if (itemId) {
      query = query.eq('item_id', itemId)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat riwayat stok'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Insert transaction (trigger will auto-update stock_qty)
    const { data, error } = await supabase.from('stock_transactions').insert([{
      item_id: body.itemId,
      type: body.type,
      quantity: body.quantity,
      transaction_date: body.date || new Date().toISOString().slice(0, 10),
      notes: body.notes || null,
      reference: body.reference || null,
    }]).select('*, stock_items(name, unit)')

    if (error) throw error
    return NextResponse.json(data[0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menyimpan transaksi stok'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    // Get transaction first to reverse stock
    const { data: tx, error: fetchErr } = await supabase
      .from('stock_transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !tx) throw new Error('Transaksi tidak ditemukan')

    // Reverse stock
    const reverseQty = tx.type === 'Masuk' ? -tx.quantity : tx.quantity
    await supabase.rpc ? null : null
    // Manual reverse since we can't easily use rpc here
    const { data: item } = await supabase
      .from('stock_items')
      .select('stock_qty')
      .eq('id', tx.item_id)
      .single()

    if (item) {
      const newQty = Number(item.stock_qty) + Number(reverseQty)
      await supabase.from('stock_items').update({ stock_qty: newQty }).eq('id', tx.item_id)
    }

    const { error } = await supabase.from('stock_transactions').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus transaksi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
