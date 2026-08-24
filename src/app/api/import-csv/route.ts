import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const cleaned = dateStr.trim()
  // dd/mm/yyyy (format CSV Indonesia)
  const dmySlash = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmySlash) {
    const [, d, m, y] = dmySlash
    // Validasi: hari 1-31, bulan 1-12
    const day = parseInt(d), month = parseInt(m)
    if (day > 12) {
      // Pasti dd/mm/yyyy karena hari > 12
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    } else if (month > 12) {
      // Pasti mm/dd/yyyy karena bulan > 12, tapi masuk akal sebagai hari
      return `${y}-${d.padStart(2, '0')}-${m.padStart(2, '0')}`
    } else {
      // Ambigu (misal 01/05/2024), default ke dd/mm/yyyy (format Indonesia)
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  // dd-mm-yyyy
  const dmyDash = cleaned.match(/^(\d{1,2})\-(\d{1,2})\-(\d{4})$/)
  if (dmyDash) {
    const [, d, m, y] = dmyDash
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // yyyy-mm-dd (sudah benar)
  const ymdDash = cleaned.match(/^(\d{4})\-(\d{1,2})\-(\d{1,2})$/)
  if (ymdDash) {
    const [, y, m, d] = ymdDash
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // Fallback: coba JS Date parse
  const parsed = new Date(cleaned)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  return null
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n')
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue }
      if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
      current += char
    }
    result.push(current.trim())
    return result
  })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'students' | 'teachers' | 'beneficiaries-3b'

    if (!file || !type) {
      return NextResponse.json({ error: 'File dan tipe diperlukan' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV kosong atau tidak valid' }, { status: 400 })
    }

    const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'))
    const dataRows = rows.slice(1).filter(r => r.some(cell => cell.length > 0))

    let inserted = 0
    let errors = 0

    // Buat lookup fleksibel: cari header yang mengandung keyword (bukan exact match)
    const findVal = (obj: Record<string, any>, keywords: string[]): string | null => {
      for (const key of Object.keys(obj)) {
        const lowered = key.toLowerCase()
        for (const kw of keywords) {
          if (lowered === kw || lowered.includes(kw)) {
            const val = obj[key]
            if (val && val.toString().trim() !== '' && val.toString().trim() !== '-') return val.toString().trim()
          }
        }
      }
      return null
    }

    // Log header yang terdeteksi untuk debugging
    console.log('[CSV Import] type:', type, 'headers:', headers)

    if (type === 'students') {
      const records = dataRows.map(row => {
        const obj: Record<string, any> = {}
        headers.forEach((h, i) => { obj[h] = row[i] || null })
        return {
          nama: findVal(obj, ['nama', 'name', 'nama_siswa', 'nama_peserta', 'peserta_didik']) || '-',
          school_name: findVal(obj, ['school_name', 'sekolah', 'nama_sekolah', 'school']) || '-',
          nipd: findVal(obj, ['nipd']) || null,
          jk: (findVal(obj, ['jk', 'jenis_kelamin', 'jenis_kel']) || 'L').charAt(0).toUpperCase(),
          nisn: findVal(obj, ['nisn']) || null,
          tempat_lahir: findVal(obj, ['tempat_lahir', 'tempat']) || null,
          tanggal_lahir: parseDate(findVal(obj, ['tanggal_lahir', 'ttl', 'birth_date', 'tgl_lahir'])),
          nik: findVal(obj, ['nik', 'no_nik', 'nik_ktp']) || null,
          agama: findVal(obj, ['agama']) || 'Islam',
          alamat: findVal(obj, ['alamat', 'address']) || null,
          kelas: findVal(obj, ['kelas', 'class', 'tingkat']) || null,
          berat_badan: parseInt(findVal(obj, ['berat_badan', 'bb', 'berat', 'weight']) || '0') || 0,
          tinggi_badan: parseInt(findVal(obj, ['tinggi_badan', 'tb', 'tinggi', 'height']) || '0') || 0,
          nama_ayah: findVal(obj, ['nama_ayah', 'ayah', 'father']) || null,
          nama_ibu: findVal(obj, ['nama_ibu', 'ibu', 'mother']) || null,
          has_allergy: (() => { const v = findVal(obj, ['alergi', 'has_allergy', 'allergy']); return v !== null && v !== '' })(),
          allergy_type: (() => { const v = findVal(obj, ['alergi', 'has_allergy', 'allergy_type', 'allergy']); return (v && v.toLowerCase() !== '-') ? v : null })(),
        }
      })
      const { error } = await supabase.from('students').insert(records)
      if (error) { console.error(error); return NextResponse.json({ error: `Gagal import siswa: ${error.message}`, inserted: 0, errors: dataRows.length, total: dataRows.length }, { status: 500 }) }
      else { inserted = records.length }
    }

    else if (type === 'teachers') {
      const records = dataRows.map(row => {
        const obj: Record<string, any> = {}
        headers.forEach((h, i) => { obj[h] = row[i] || null })
        return {
          full_name: findVal(obj, ['full_name', 'nama_guru', 'nama', 'name']) || '-',
          school_name: findVal(obj, ['school_name', 'sekolah', 'nama_sekolah', 'school']) || '-',
          nuptk: findVal(obj, ['nuptk']) || null,
          nip: findVal(obj, ['nip']) || null,
          jk: (findVal(obj, ['jk', 'jenis_kelamin', 'jenis_kel']) || 'L').charAt(0).toUpperCase(),
          tempat_lahir: findVal(obj, ['tempat_lahir', 'tempat']) || null,
          tanggal_lahir: parseDate(findVal(obj, ['tanggal_lahir', 'ttl', 'birth_date', 'tgl_lahir'])),
          nik: findVal(obj, ['nik', 'no_nik']) || null,
          jenis_tendik: findVal(obj, ['jenis_tendik', 'jabatan', 'status_tendik']) || 'Guru',
          alamat: findVal(obj, ['alamat', 'address']) || null,
          has_allergy: (() => { const v = findVal(obj, ['alergi', 'has_allergy', 'allergy']); return v !== null && v !== '' })(),
          allergy_type: (() => { const v = findVal(obj, ['alergi', 'has_allergy', 'allergy_type', 'allergy']); return (v && v.toLowerCase() !== '-') ? v : null })(),
          status: 'Aktif',
        }
      })
      const { error } = await supabase.from('teachers').insert(records)
      if (error) { console.error(error); return NextResponse.json({ error: `Gagal import guru: ${error.message}`, inserted: 0, errors: dataRows.length, total: dataRows.length }, { status: 500 }) }
      else { inserted = records.length }
    }

    else if (type === 'beneficiaries-3b') {
      const records = dataRows.map(row => {
        const obj: Record<string, any> = {}
        headers.forEach((h, i) => { obj[h] = row[i] || null })
        return {
          sppg_code: findVal(obj, ['sppg_code', 'sppg', 'kode_sppg']) || 'SPPG-SMB-01',
          posyandu_name: findVal(obj, ['posyandu_name', 'posyandu', 'nama_posyandu']) || '-',
          sub_category: findVal(obj, ['sub_category', 'kategori', 'sub_kategori']) || 'Bumil',
          nik: findVal(obj, ['nik', 'no_nik']) || null,
          full_name: findVal(obj, ['full_name', 'nama', 'name', 'nama_ibu', 'nama_anak']) || '-',
          gender: (findVal(obj, ['gender', 'jk', 'jenis_kelamin', 'jenis_kel']) || 'P').charAt(0).toUpperCase(),
          tempat_lahir: findVal(obj, ['tempat_lahir', 'tempat', 'tmpt_lahir', 'tmp_lahir']) || null,
          birth_date: parseDate(findVal(obj, ['birth_date', 'tanggal_lahir', 'ttl', 'tgl_lahir'])),
          alamat: findVal(obj, ['alamat', 'address']) || null,
          nama_orang_tua: findVal(obj, ['nama_orang_tua', 'nama_ortu', 'nama_orang_tua', 'orang_tua', 'nama_ibu', 'nama_ayah']) || null,
          berat_badan: parseFloat(findVal(obj, ['berat_badan', 'bb', 'berat', 'weight']) || '0') || 0,
          tinggi_badan: parseFloat(findVal(obj, ['tinggi_badan', 'tb', 'tinggi', 'height']) || '0') || 0,
          lingkar_kepala: parseFloat(findVal(obj, ['lingkar_kepala', 'lk', 'lingkar_kpala']) || '0') || 0,
          lingkar_lengan: parseFloat(findVal(obj, ['lingkar_lengan', 'll', 'lingkar_lgkn']) || '0') || 0,
          detail_info: findVal(obj, ['detail_info', 'info', 'keterangan', 'detail']) || null,
          pic_name: findVal(obj, ['pic_name', 'kader', 'nama_kader', 'petugas']) || '-',
          phone: findVal(obj, ['phone', 'wa', 'no_hp', 'telepon', 'no_telp', 'whatsapp']) || null,
          has_allergy: (() => { const v = findVal(obj, ['alergi', 'has_allergy', 'allergy']); return v !== null && v !== '' })(),
          allergy_type: (() => { const v = findVal(obj, ['alergi', 'has_allergy', 'allergy_type', 'allergy']); return (v && v.toLowerCase() !== '-') ? v : null })(),
          status: 'Aktif',
        }
      })
      const { error } = await supabase.from('beneficiaries_3b').insert(records)
      if (error) { console.error(error); return NextResponse.json({ error: `Gagal import penerima 3B: ${error.message}`, inserted: 0, errors: dataRows.length, total: dataRows.length }, { status: 500 }) }
      else { inserted = records.length }
    }

    else {
      return NextResponse.json({ error: 'Tipe tidak valid' }, { status: 400 })
    }

    return NextResponse.json({ inserted, errors, total: dataRows.length, detected_headers: headers })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal import CSV'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
