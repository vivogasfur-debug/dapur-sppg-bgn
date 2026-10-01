import { NextRequest, NextResponse } from 'next/server'
import { supabase, fetchAll } from '@/lib/supabase'

const getJenjang = (name: string): string => {
  if (!name) return 'Lainnya'
  const u = name.toUpperCase().replace(/[^A-Z ]/g, '').trim()
  if (/^(TK|RA|RAUDHATUL|PLAYGROUP|PG|TKL|TKIT)/.test(u)) return 'TK'
  if (/^(SD|MI|SDLB|MIN|SDN|SDIT|SDS)/.test(u)) return 'SD'
  if (/^(SMP|MTS|SMPLB|SMPN|SMPIT|SPM)/.test(u)) return 'SMP'
  if (/^(SMA|SMK|MA|MAK|SMAS|SMAN|SMKN|SMKS|SMKIT|SMAT|SMKT|SMAN|SMKN)/.test(u)) return 'SMA'
  // Fallback: check keywords anywhere in name
  if (/\b(SMP|MTS|SMPN)\b/.test(u)) return 'SMP'
  if (/\b(SMA|SMK|SMAN|SMKN|MAK)\b/.test(u)) return 'SMA'
  if (/\b(SD|MI|SDN|SDIT)\b/.test(u)) return 'SD'
  if (/\b(TK|RA)\b/.test(u)) return 'TK'
  return 'Lainnya'
}

const extractKelasNum = (kelas: string): number => {
  if (!kelas || kelas === '-') return -1
  // Try digits first (e.g. "7A" → 7, "Kelas 9" → 9)
  const cleaned = kelas.replace(/[^0-9]/g, '')
  if (cleaned) return parseInt(cleaned)
  // Try Roman numerals, including with suffixes (e.g. "VII A", "IX-B", "VIIA")
  const roman: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 }
  const u = kelas.toUpperCase().trim()
  if (roman[u] !== undefined) return roman[u]
  // Extract leading Roman numeral (e.g. "VII A" → "VII" → 7)
  const romanMatch = u.match(/^(X{0,1}(IX|IV|V?I{0,3}))/)
  if (romanMatch && romanMatch[1]) {
    const rv = roman[romanMatch[1]]
    if (rv !== undefined) return rv
  }
  return -1
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

    // === SEKOLAH RECAP (per sekolah, kelas as columns) ===
    const sekolahRecap: {
      jenjang: string;
      schools: { schoolName: string; kelasData: Record<string, { L: number; P: number }>; totalL: number; totalP: number; guruL: number; guruP: number }[];
      allKelas: string[];
      jenjangTotalL: number; jenjangTotalP: number; jenjangGuruL: number; jenjangGuruP: number;
    }[] = []
    for (const j of ['TK', 'SD', 'SMP', 'SMA', 'Lainnya']) {
      const jStudents = students.filter((s: any) => getJenjang(s.school_name) === j)
      const jTeachers = teachers.filter((t: any) => getJenjang(t.school_name) === j)
      // Normalize kelas: convert "Kelas 1", "I", "Kls 1" etc. → just the number string "1"
      // For SMP/SMA: preserve letter suffix like 7A, 7B, 8A etc.
      const normalizeKelas = (raw: string): string => {
        if (!raw || raw === '-') return '-'
        const trimmed = raw.trim()
        if (trimmed === '-') return '-'
        const num = extractKelasNum(trimmed)
        if (num > 0) {
          // For SMP & SMA: extract letter suffix (A, B, C, D, E, F) after the number
          if (j === 'SMP' || j === 'SMA') {
            // Try to find a trailing single letter A-F (e.g. "7A", "VII B", "9-C")
            const letterMatch = trimmed.toUpperCase().match(/([A-F])\s*$/)
            if (letterMatch) return String(num) + letterMatch[1]
          }
          return String(num)
        }
        return trimmed // keep original if can't parse
      }
      // Group by school
      const schoolMap: Record<string, Record<string, { L: number; P: number }>> = {}
      jStudents.forEach((s: any) => {
        const sn = s.school_name || '-'
        const k = normalizeKelas(s.kelas)
        if (!schoolMap[sn]) schoolMap[sn] = {}
        if (!schoolMap[sn][k]) schoolMap[sn][k] = { L: 0, P: 0 }
        if (s.jk === 'L') schoolMap[sn][k].L++
        else schoolMap[sn][k].P++
      })
      // Guru per school
      const guruSchoolMap: Record<string, { L: number; P: number }> = {}
      jTeachers.forEach((t: any) => {
        const sn = t.school_name || '-'
        if (!guruSchoolMap[sn]) guruSchoolMap[sn] = { L: 0, P: 0 }
        if (t.jk === 'L') guruSchoolMap[sn].L++
        else guruSchoolMap[sn].P++
      })
      // Collect all unique kelas for this jenjang, sorted
      const allKelasSet = new Set<string>()
      Object.values(schoolMap).forEach(km => Object.keys(km).forEach(k => allKelasSet.add(k)))
      const allKelas = Array.from(allKelasSet).sort((a, b) => {
        const numA = extractKelasNum(a), numB = extractKelasNum(b)
        if (numA !== numB) return numA - numB
        // Same number: sort by letter suffix (A < B < C)
        const letterA = a.replace(/[0-9]/g, ''), letterB = b.replace(/[0-9]/g, '')
        return letterA.localeCompare(letterB)
      })
      // Build schools array (include schools that have teachers but no students)
      const allSchoolNames = new Set([...Object.keys(schoolMap), ...Object.keys(guruSchoolMap)])
      const schools = Array.from(allSchoolNames)
        .sort((a, b) => a.localeCompare(b))
        .map(schoolName => {
          const kelasData = schoolMap[schoolName] || {}
          let totalL = 0, totalP = 0
          Object.values(kelasData).forEach(c => { totalL += c.L; totalP += c.P })
          const gL = guruSchoolMap[schoolName]?.L || 0
          const gP = guruSchoolMap[schoolName]?.P || 0
          return { schoolName, kelasData, totalL, totalP, guruL: gL, guruP: gP }
        })
      const jenjangTotalL = jStudents.filter((s: any) => s.jk === 'L').length
      const jenjangTotalP = jStudents.filter((s: any) => s.jk === 'P').length
      const jenjangGuruL = jTeachers.filter((t: any) => t.jk === 'L').length
      const jenjangGuruP = jTeachers.filter((t: any) => t.jk === 'P').length
      sekolahRecap.push({ jenjang: j, schools, allKelas, jenjangTotalL, jenjangTotalP, jenjangGuruL, jenjangGuruP })
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
      sekolahRecap,
      gizi: giziC,
      posyandu: { list: posyanduDetail, balita, balita_lt6, balita_gt60, balita_noCat },
      guruSchoolMap,
      totals: { students: students.length, teachers: teachers.length, beneficiaries3b: beneficiaries3b.length },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memuat rekapitulasi' }, { status: 500 })
  }
}
