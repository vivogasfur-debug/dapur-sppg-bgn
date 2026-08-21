import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    if (type === 'students') {
      const records = dataRows.map(row => {
        const obj: Record<string, any> = {}
        headers.forEach((h, i) => { obj[h] = row[i] || null })
        return {
          nama: obj.nama || obj.name || '-',
          school_name: obj.school_name || obj.sekolah || obj.nama_sekolah || '-',
          nipd: obj.nipd || null,
          jk: (obj.jk || obj.jenis_kelamin || 'L').charAt(0).toUpperCase(),
          nisn: obj.nisn || null,
          tempat_lahir: obj.tempat_lahir || obj.tempat || null,
          tanggal_lahir: obj.tanggal_lahir || obj.ttl || null,
          nik: obj.nik || null,
          agama: obj.agama || 'Islam',
          alamat: obj.alamat || null,
          kelas: obj.kelas || null,
          berat_badan: parseInt(obj.berat_badan || obj.bb || obj.berat || '0') || 0,
          tinggi_badan: parseInt(obj.tinggi_badan || obj.tb || obj.tinggi || '0') || 0,
          nama_ayah: obj.nama_ayah || obj.ayah || null,
          nama_ibu: obj.nama_ibu || obj.ibu || null,
          has_allergy: (obj.alergi || obj.has_allergy || '').toString().toLowerCase() !== '-' && (obj.alergi || obj.has_allergy || '').toString().length > 0,
          allergy_type: (obj.alergi || obj.has_allergy || obj.allergy_type || '').toString().toLowerCase() === '-' ? null : (obj.alergi || obj.allergy_type || null),
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
          full_name: obj.full_name || obj.nama || obj.nama_guru || '-',
          school_name: obj.school_name || obj.sekolah || obj.nama_sekolah || '-',
          nuptk: obj.nuptk || null,
          nip: obj.nip || null,
          jk: (obj.jk || obj.jenis_kelamin || 'L').charAt(0).toUpperCase(),
          tempat_lahir: obj.tempat_lahir || obj.tempat || null,
          tanggal_lahir: obj.tanggal_lahir || obj.ttl || null,
          nik: obj.nik || null,
          jenis_tendik: obj.jenis_tendik || obj.jabatan || 'Guru',
          alamat: obj.alamat || null,
          has_allergy: (obj.alergi || obj.has_allergy || '').toString().toLowerCase() !== '-' && (obj.alergi || obj.has_allergy || '').toString().length > 0,
          allergy_type: (obj.alergi || obj.has_allergy || obj.allergy_type || '').toString().toLowerCase() === '-' ? null : (obj.alergi || obj.allergy_type || null),
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
          sppg_code: obj.sppg_code || 'SPPG-SMB-01',
          posyandu_name: obj.posyandu_name || obj.posyandu || '-',
          sub_category: obj.sub_category || obj.kategori || obj.sub_kategori || 'Bumil',
          nik: obj.nik || null,
          full_name: obj.full_name || obj.nama || '-',
          gender: (obj.gender || obj.jk || obj.jenis_kelamin || 'P').charAt(0).toUpperCase(),
          birth_date: obj.birth_date || obj.tanggal_lahir || null,
          detail_info: obj.detail_info || obj.info || null,
          pic_name: obj.pic_name || obj.kader || '-',
          phone: obj.phone || obj.wa || obj.no_hp || null,
          has_allergy: (obj.alergi || obj.has_allergy || '').toString().toLowerCase() !== '-' && (obj.alergi || obj.has_allergy || '').toString().length > 0,
          allergy_type: (obj.alergi || obj.has_allergy || obj.allergy_type || '').toString().toLowerCase() === '-' ? null : (obj.alergi || obj.allergy_type || null),
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

    return NextResponse.json({ inserted, errors, total: dataRows.length })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal import CSV'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
