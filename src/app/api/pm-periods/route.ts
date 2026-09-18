import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Generate biweekly periods starting from a given date
function generateBiweeklyPeriods(startDate: string, count: number) {
  const periods = []
  let current = new Date(startDate)
  for (let i = 0; i < count; i++) {
    const start = new Date(current)
    const end = new Date(current)
    end.setDate(end.getDate() + 13) // 14-day period
    const label = `${formatDate(start)} – ${formatDate(end)}`
    periods.push({
      period_start: start.toISOString().split('T')[0],
      period_end: end.toISOString().split('T')[0],
      period_label: label,
    })
    current.setDate(current.getDate() + 14)
  }
  return periods
}

function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

// GET: List all periods, or auto-generate if none exist
export async function GET() {
  try {
    const { data: existing, error } = await supabase
      .from('pm_periods')
      .select('*')
      .order('period_start', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no periods exist, seed them
    if (!existing || existing.length === 0) {
      // Find first Monday of current month
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      let start = new Date(firstOfMonth)
      // Go back 2 months to have some history
      start.setMonth(start.getMonth() - 2)
      // Find nearest Monday
      while (start.getDay() !== 1) start.setDate(start.getDate() + 1)

      const generated = generateBiweeklyPeriods(start.toISOString().split('T')[0], 26) // ~1 year

      const { data: inserted, error: insertErr } = await supabase
        .from('pm_periods')
        .insert(generated)
        .select()

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }

      // Mark current period as active
      const today = new Date().toISOString().split('T')[0]
      const currentPeriod = (inserted || []).find((p: any) => today >= p.period_start && today <= p.period_end)
      if (currentPeriod) {
        await supabase.from('pm_periods').update({ is_active: true }).eq('id', currentPeriod.id)
        currentPeriod.is_active = true
      }

      return NextResponse.json({ periods: inserted || [], current_period_id: currentPeriod?.id || null })
    }

    // Find current active period
    const activePeriod = existing.find((p: any) => p.is_active)
    const today = new Date().toISOString().split('T')[0]
    const currentPeriod = existing.find((p: any) => today >= p.period_start && today <= p.period_end)
    const currentPeriodId = activePeriod?.id || currentPeriod?.id || existing[0]?.id

    return NextResponse.json({ periods: existing, current_period_id: currentPeriodId || null })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengambil periode'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST: Create period, set active, or copy data from previous period
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // Set active period
    if (action === 'set_active') {
      const { period_id } = body
      if (!period_id) return NextResponse.json({ error: 'period_id diperlukan' }, { status: 400 })

      // Deactivate all, then activate the selected one
      await supabase.from('pm_periods').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
      const { data, error } = await supabase.from('pm_periods').update({ is_active: true }).eq('id', period_id).select().single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ period: data })
    }

    // Copy data from source period to target period
    if (action === 'copy_data') {
      const { source_period_id, target_period_id } = body
      if (!source_period_id || !target_period_id) {
        return NextResponse.json({ error: 'source_period_id dan target_period_id diperlukan' }, { status: 400 })
      }
      if (source_period_id === target_period_id) {
        return NextResponse.json({ error: 'Periode sumber dan target tidak boleh sama' }, { status: 400 })
      }

      let copied = 0

      // Copy students
      const { data: srcStudents } = await supabase.from('students').select('*').eq('period_id', source_period_id)
      if (srcStudents && srcStudents.length > 0) {
        const newStudents = srcStudents.map((s: any) => {
          const { id, created_at, period_id, ...rest } = s
          return { ...rest, period_id: target_period_id }
        })
        const { error: err } = await supabase.from('students').insert(newStudents)
        if (!err) copied += newStudents.length
        else console.error('[Copy students error]', err)
      }

      // Copy teachers
      const { data: srcTeachers } = await supabase.from('teachers').select('*').eq('period_id', source_period_id)
      if (srcTeachers && srcTeachers.length > 0) {
        const newTeachers = srcTeachers.map((t: any) => {
          const { id, created_at, period_id, ...rest } = t
          return { ...rest, period_id: target_period_id }
        })
        const { error: err } = await supabase.from('teachers').insert(newTeachers)
        if (!err) copied += newTeachers.length
        else console.error('[Copy teachers error]', err)
      }

      // Copy beneficiaries_3b
      const { data: srcBeneficiaries } = await supabase.from('beneficiaries_3b').select('*').eq('period_id', source_period_id)
      if (srcBeneficiaries && srcBeneficiaries.length > 0) {
        const newBeneficiaries = srcBeneficiaries.map((b: any) => {
          const { id, created_at, period_id, ...rest } = b
          return { ...rest, period_id: target_period_id }
        })
        const { error: err } = await supabase.from('beneficiaries_3b').insert(newBeneficiaries)
        if (!err) copied += newBeneficiaries.length
        else console.error('[Copy beneficiaries error]', err)
      }

      return NextResponse.json({ copied, message: `${copied} data berhasil disalin ke periode baru` })
    }

    // Generate more periods (extend into the future)
    if (action === 'generate_more') {
      const { count = 6 } = body
      // Get the latest period
      const { data: latest } = await supabase.from('pm_periods').select('period_end').order('period_end', { ascending: false }).limit(1).single()
      if (!latest) return NextResponse.json({ error: 'Tidak ada periode existing' }, { status: 400 })

      const nextStart = new Date(latest.period_end)
      nextStart.setDate(nextStart.getDate() + 1)
      const generated = generateBiweeklyPeriods(nextStart.toISOString().split('T')[0], count)

      const { data: inserted, error } = await supabase.from('pm_periods').insert(generated).select()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ periods: inserted, message: `${inserted?.length || 0} periode baru ditambahkan` })
    }

    // Create a single custom period
    const { period_start, period_end, period_label } = body
    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'period_start dan period_end diperlukan' }, { status: 400 })
    }
    const label = period_label || `${period_start} – ${period_end}`
    const { data, error } = await supabase.from('pm_periods').insert({ period_start, period_end, period_label: label }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ period: data })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
