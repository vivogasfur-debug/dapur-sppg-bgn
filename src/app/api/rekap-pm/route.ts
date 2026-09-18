import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAll } from '@/lib/supabase'

const getJenjang = (name: string): string => {
  const u = name.toUpperCase().replace(/[^A-Z ]/g, '').trim()
  if (/^(TK|RA|RAUDHATUL)/.test(u)) return 'TK'
  if (/^(SD|MI|SDLB|MIN)/.test(u)) return 'SD'
  if (/^(SMP|MTS|SMPLB)/.test(u)) return 'SMP'
  if (/^(SMA|SMK|MA|MAK|SMAS|SMAN|SMKN|SMKS)/.test(u)) return 'SMA'
  return 'Lainnya'
}

const extractKelasNum = (kelas: string): number => {
  if (!kelas || kelas === '-') return -1
  const cleaned = kelas.replace(/[^0-9]/g, '')
  if (cleaned) return parseInt(cleaned)
  const roman: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 }
  return roman[kelas.toUpperCase().trim()] ?? -1
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const periodId = searchParams.get('period_id')

    const periodFilter = periodId ? { column: 'period_id', operator: 'eq', value: periodId } : undefined

    // Fetch only needed columns in parallel using fetchAll for >1000 rows
    const [students, teachers, beneficiaries3b] = await Promise.all([
      fetchAll('students', { select: 'id,nama,school_name,jk,kelas,berat_badan,tinggi_badan,has_allergy,allergy_type', filter: periodFilter }),
      fetchAll('teachers', { select: 'id,full_name,school_name,jk,has_allergy,allergy_type', filter: periodFilter }),
      fetchAll('beneficiaries_3b', { select: 'id,posyandu_name,sub_category,gender,birth_date,has_allergy,allergy_type', filter: periodFilter }),
    ])

    // === PORSI ===
    const siswaTKRA = students.filter((s: any) => getJenjang(s.school_name) === 'TK').length
    const siswaSDKelas123 = students.filter((s: any) => {
      const j = getJenjang(s.school_name)
      if (j !== 'SD' && j !== 'Lainnya') return false
      const k = extractKelasNum(s.kelas)
      return k >= 1 && k <= 3
    }).length
    const siswaSDKelas456 = students.filter((s: any) => {
      const j = getJenjang(s.school_name)
      if (j !== 'SD' && j !== 'Lainnya') return false
      const k = extractKelasNum(s.kelas)
      return k >= 4 && k <= 6
    }).length
    const siswaSMP = students.filter((s: any) => getJenjang(s.school_name) === 'SMP').length
    const siswaSMA = students.filter((s: any) => getJenjang(s.school_name) === 'SMA').length

    const bumil = beneficiaries3b.filter((b: any) => b.sub_category === 'Bumil').length
    const busui = beneficiaries3b.filter((b: any) => b.sub_category === 'Busui').length
    const balita6_11 = beneficiaries3b.filter((b: any) => b.sub_category === 'Balita' && classifyBalita(b.birth_date) === '6-11 Bln').length
    const balita12_60 = beneficiaries3b.filter((b: any) => b.sub_category === 'Balita' && classifyBalita(b.birth_date) === '12-60 Bln').length

    const porsiKecil = siswaTKRA + siswaSDKelas123 + balita6_11 + balita12_60
    const porsiBesar = teachers.length + siswaSDKelas456 + siswaSMP + siswaSMA + bumil + busui
    const totalPorsi = porsiKecil + porsiBesar
    const totalPenerimaAll = students.length + teachers.length + beneficiaries3b.length

    // === GENDER ===
    const siswaL = students.filter((s: any) => s.jk === 'L').length
    const siswaP = students.filter((s: any) => s.jk === 'P').length
    const guruL = teachers.filter((t: any) => t.jk === 'L').length
    const guruP = teachers.filter((t: any) => t.jk === 'P').length
    const b3bL = beneficiaries3b.filter((b: any) => b.gender === 'L').length
    const b3bP = beneficiaries3b.filter((b: any) => b.gender === 'P').length

    // === ALERGI ===
    const alergiSekolah = students.filter((s: any) => s.has_allergy).length + teachers.filter((t: any) => t.has_allergy).length
    const alergi3b = beneficiaries3b.filter((b: any) => b.has_allergy).length

    // === JENJANG GROUPS ===
    const jenjangGroups: Record<string, { siswaCount: number; L: number; P: number; guru: number; schools: [string, number][] }> = {}
    for (const j of ['TK', 'SD', 'SMP', 'SMA', 'Lainnya']) {
      const jStudents = students.filter((s: any) => getJenjang(s.school_name) === j)
      const jSchools: Record<string, number> = {}
      jStudents.forEach((s: any) => { jSchools[s.school_name] = (jSchools[s.school_name] || 0) + 1 })
      const jTeachers = teachers.filter((t: any) => getJenjang(t.school_name) === j)
      jenjangGroups[j] = {
        siswaCount: jStudents.length,
        L: jStudents.filter((s: any) => s.jk === 'L').length,
        P: jStudents.filter((s: any) => s.jk === 'P').length,
        guru: jTeachers.length,
        schools: Object.entries(jSchools).sort((a, b) => a[0].localeCompare(b[0])),
      }
    }

    // === GIZI BMI ===
    const giziC = { kurang: 0, normal: 0, lebih: 0, noData: 0 }
    students.forEach((s: any) => {
      const bb = Number(s.berat_badan || 0)
      const tb = Number(s.tinggi_badan || 0)
      if (bb > 0 && tb > 0) {
        const tbm = tb / 100
        if (tbm > 0) { const bmi = bb / (tbm * tbm); if (bmi < 18.5) giziC.kurang++; else if (bmi > 25) giziC.lebih++; else giziC.normal++; }
      } else giziC.noData++
    })

    // === POSYANDU ===
    const posyanduMap: Record<string, { total: number; bumil: number; busui: number; balita: number }> = {}
    beneficiaries3b.forEach((b: any) => {
      const n = b.posyandu_name
      if (!posyanduMap[n]) posyanduMap[n] = { total: 0, bumil: 0, busui: 0, balita: 0 }
      posyanduMap[n].total++
      if (b.sub_category === 'Bumil') posyanduMap[n].bumil++
      else if (b.sub_category === 'Busui') posyanduMap[n].busui++
      else posyanduMap[n].balita++
    })
    const topPosyandu = Object.entries(posyanduMap).sort((a, b) => b[1].total - a[1].total)
    const balita = beneficiaries3b.filter((b: any) => b.sub_category === 'Balita').length

    // === GURU PER SEKOLAH ===
    const guruSchoolMap: Record<string, number> = {}
    teachers.forEach((t: any) => { guruSchoolMap[t.school_name] = (guruSchoolMap[t.school_name] || 0) + 1 })

    // === BALITA DETAIL (for 3B tab) ===
    const balita_lt6 = beneficiaries3b.filter((b: any) => b.sub_category === 'Balita' && getAgeMonths(b.birth_date) < 6).length
    const balita_gt60 = beneficiaries3b.filter((b: any) => b.sub_category === 'Balita' && getAgeMonths(b.birth_date) > 60 && getAgeMonths(b.birth_date) < 999).length
    const balita_noCat = beneficiaries3b.filter((b: any) => b.sub_category === 'Balita' && getAgeMonths(b.birth_date) >= 999).length

    // === POSYANDU DETAIL (with gender) ===
    const posyanduDetail = topPosyandu.map(([name, d]) => {
      const pL = beneficiaries3b.filter((b: any) => b.posyandu_name === name && b.gender === 'L').length
      const pP = beneficiaries3b.filter((b: any) => b.posyandu_name === name && b.gender === 'P').length
      return { name, ...d, L: pL, P: pP }
    })

    return NextResponse.json({
      porsi: { siswaTKRA, siswaSDKelas123, siswaSDKelas456, siswaSMP, siswaSMA, bumil, busui, balita6_11, balita12_60, porsiKecil, porsiBesar, totalPorsi, totalPenerimaAll },
      gender: { siswaL, siswaP, guruL, guruP, b3bL, b3bP },
      alergi: { alergiSekolah, alergi3b, alergiTotal: alergiSekolah + alergi3b },
      jenjangGroups,
      gizi: giziC,
      posyandu: { list: posyanduDetail, balita, balita_lt6, balita_gt60, balita_noCat },
      guruSchoolMap,
      totals: { students: students.length, teachers: teachers.length, beneficiaries3b: beneficiaries3b.length },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memuat rekapitulasi' }, { status: 500 })
  }
}
