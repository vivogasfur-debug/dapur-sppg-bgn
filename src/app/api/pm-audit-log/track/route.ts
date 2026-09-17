import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST: Create an audit log entry (called from other API routes)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tableName, recordId, action, oldData, newData, changedFields, performedBy } = body

    if (!tableName || !recordId || !action) {
      return NextResponse.json({ error: 'tableName, recordId, action wajib diisi' }, { status: 400 })
    }

    const { error } = await supabase.from('pm_audit_log').insert([{
      table_name: tableName,
      record_id: String(recordId),
      action,
      old_data: oldData || null,
      new_data: newData || null,
      changed_fields: changedFields || null,
      performed_by: performedBy || 'system',
    }])

    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    // Audit logging should never block the main operation
    // Return success even on error to prevent cascading failures
    console.error('Audit log error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 200 })
  }
}
