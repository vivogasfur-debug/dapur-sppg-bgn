import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAll } from '@/lib/supabase'

// Rekap computation logic (same as rekap-pm)
const getJenjang = (name: string): string => {
  const u = name.toUpperCase().replace(/[^A-Z ]/g, '').trim()
  if (/^(TK|RA|RAUDHATUL)/.test(u)) return 'TK'
  if (/^(SD|MI|SDLB|MIN)/.test(u)) return 'SD'
  if (/^(SMP|MTS|SMPLB)/.test(u)) return 'SMP'
  if (/^(SMA|SMK|MA|MAK|SMAS|SMAN|SMKN|SMKS)/.test(u)) return 'SMA'
  return 'Lainnya'
}

const classifyBalita = (birthDateString: string): string => {
  if (!birthDateString || birthDateString === '-') return '-'
  const bd = new Date(birthDateString); const today = new Date()
  if (isNaN(bd.getTime())) return '-'
  let y = today.getFullYear() - bd.getFullYear(); let m = today.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) { y--; m += 12; }
  const totalMonths = y * 12 + m
  if (totalMonths < 6) return '< 6 Bln'
  if (totalMonths <= 11) return '6-11 Bln'
  if (totalMonths <= 60) return '12-60 Bln'
  return '> 60 Bln'
}

const getAgeMonths = (birthDateString: string): number => {
  if (!birthDateString || birthDateString === '-') return 999
  const bd = new Date(birthDateString); const today = new Date()
  if (isNaN(bd.getTime())) return 999
  let y = today.getFullYear() - bd.getFullYear(); let m = today.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) { y--; m += 12; }
  return y * 12 + m
}

const computeRekap = async () => {
  const [students, teachers, beneficiaries3b] = await Promise.all([
    fetchAll('students', { select: 'id,nama,school_name,jk,kelas,berat_badan,tinggi_badan,has_allergy,allergy_type' }),
    fetchAll('teachers', { select: 'id,full_name,school_name,jk,has_allergy,allergy_type' }),
    fetchAll('beneficiaries_3b', { select: 'id,posyandu_name,sub_category,gender,birth_date,has_allergy,allergy_type' }),
  ])

  const siswaTKRA = students.filter((s: any) => getJenjang(s.school_name) === 'TK').length
  const extractKelasNum = (kelas: string): number => {
    if (!kelas || kelas === '-') return -1
    const cleaned = kelas.replace(/[^0-9]/g, '')
    if (cleaned) return parseInt(cleaned)
    const roman: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6 }
    return roman[kelas.toUpperCase().trim()] ?? -1
  }
  const siswaSDKelas123 = students.filter((s: any) => {
    const j = getJenjang(s.school_name)
    if (j !== 'SD' && j !== 'Lainnya') return false
    return extractKelasNum(s.kelas) >= 1 && extractKelasNum(s.kelas) <= 3
  }).length
  const siswaSDKelas456 = students.filter((s: any) => {
    const j = getJenjang(s.school_name)
    if (j !== 'SD' && j !== 'Lainnya') return false
    return extractKelasNum(s.kelas) >= 4 && extractKelasNum(s.kelas) <= 6
  }).length
  const siswaSMP = students.filter((s: any) => getJenjang(s.school_name) === 'SMP').length
  const siswaSMA = students.filter((s: any) => getJenjang(s.school_name) === 'SMA').length
  const bumil = beneficiaries3b.filter((b: any) => b.sub_category === 'Bumil').length
  const busui = beneficiaries3b.filter((b: any) => b.sub_category === 'Busui').length
  const balita6_11 = beneficiaries3b.filter((b: any) => b.sub_category === 'Balita' && classifyBalita(b.birth_date) === '6-11 Bln').length
  const balita12_60 = beneficiaries3b.filter((b: any) => b.sub_category === 'Balita' && classifyBalita(b.birth_date) === '12-60 Bln').length
  const porsiKecil = siswaTKRA + siswaSDKelas123 + balita6_11 + balita12_60
  const porsiBesar = teachers.length + siswaSDKelas456 + siswaSMP + siswaSMA + bumil + busui

  const giziC = { kurang: 0, normal: 0, lebih: 0, noData: 0 }
  students.forEach((s: any) => {
    const bb = Number(s.berat_badan || 0), tb = Number(s.tinggi_badan || 0)
    if (bb > 0 && tb > 0) {
      const tbm = tb / 100
      if (tbm > 0) { const bmi = bb / (tbm * tbm); if (bmi < 18.5) giziC.kurang++; else if (bmi > 25) giziC.lebih++; else giziC.normal++; }
    } else giziC.noData++
  })

  return {
    porsi: { siswaTKRA, siswaSDKelas123, siswaSDKelas456, siswaSMP, siswaSMA, bumil, busui, balita6_11, balita12_60, porsiKecil, porsiBesar, totalPorsi: porsiKecil + porsiBesar, totalPenerimaAll: students.length + teachers.length + beneficiaries3b.length },
    totals: { students: students.length, teachers: teachers.length, beneficiaries3b: beneficiaries3b.length },
    gizi: giziC,
    gender: {
      siswaL: students.filter((s: any) => s.jk === 'L').length, siswaP: students.filter((s: any) => s.jk === 'P').length,
      guruL: teachers.filter((t: any) => t.jk === 'L').length, guruP: teachers.filter((t: any) => t.jk === 'P').length,
      b3bL: beneficiaries3b.filter((b: any) => b.gender === 'L').length, b3bP: beneficiaries3b.filter((b: any) => b.gender === 'P').length,
    },
    alergi: {
      alergiSekolah: students.filter((s: any) => s.has_allergy).length + teachers.filter((t: any) => t.has_allergy).length,
      alergi3b: beneficiaries3b.filter((b: any) => b.has_allergy).length,
    },
  }
}

// GET: List snapshots or get current live data
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'current') {
      // Return current live data as a snapshot (for preview before saving)
      const data = await computeRekap()
      return NextResponse.json({ data, period: 'live' })
    }

    // List all snapshots
    const { data, error } = await supabase
      .from('pm_snapshots')
      .select('*')
      .order('period_start', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memuat snapshot' }, { status: 500 })
  }
}

// POST: Create a new snapshot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { periodStart, periodEnd, periodLabel, notes } = body

    if (!periodStart || !periodEnd || !periodLabel) {
      return NextResponse.json({ error: 'periodStart, periodEnd, periodLabel wajib diisi' }, { status: 400 })
    }

    // Compute current live data
    const snapshotData = await computeRekap()

    const { data, error } = await supabase.from('pm_snapshots').insert([{
      period_start: periodStart,
      period_end: periodEnd,
      period_label: periodLabel,
      snapshot_data: snapshotData,
      students_total: snapshotData.totals.students,
      teachers_total: snapshotData.totals.teachers,
      b3b_total: snapshotData.totals.beneficiaries3b,
      porsi_kecil: snapshotData.porsi.porsiKecil,
      porsi_besar: snapshotData.porsi.porsiBesar,
      total_porsi: snapshotData.porsi.totalPorsi,
      gizi_kurang: snapshotData.gizi.kurang,
      gizi_normal: snapshotData.gizi.normal,
      gizi_lebih: snapshotData.gizi.lebih,
      created_by: 'user',
      notes: notes || null,
    }]).select().single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Snapshot untuk periode ini sudah ada' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal membuat snapshot' }, { status: 500 })
  }
}

// DELETE: Remove a snapshot
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID snapshot diperlukan' }, { status: 400 })

    const { error } = await supabase.from('pm_snapshots').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus snapshot' }, { status: 500 })
  }
}
