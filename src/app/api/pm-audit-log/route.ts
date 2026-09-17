import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: List audit logs with filtering & pagination
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const table = url.searchParams.get('table')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('pm_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (table && table !== 'Semua') {
      query = query.eq('table_name', table)
    }
    if (from) {
      query = query.gte('created_at', from)
    }
    if (to) {
      query = query.lte('created_at', to + 'T23:59:59')
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ data: data || [], total: count || 0, limit, offset })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memuat audit log' }, { status: 500 })
  }
}
