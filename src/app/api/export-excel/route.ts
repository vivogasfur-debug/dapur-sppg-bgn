import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'students'

    if (type === 'students') {
      const { data, error } = await supabase.from('students').select('*').order('nama')
      if (error) throw new Error(error.message)

      const rows = (data || []).map((s: any, i: number) => ({
        'No': i + 1,
        'Nama Siswa': s.nama || '',
        'Sekolah': s.school_name || '',
        'NIPD': s.nipd || '',
        'JK': s.jk || '',
        'NISN': s.nisn || '',
        'Tempat Lahir': s.tempat_lahir || '',
        'Tanggal Lahir': s.tanggal_lahir || '',
        'NIK': s.nik || '',
        'Agama': s.agama || '',
        'Alamat': s.alamat || '',
        'Kelas': s.kelas || '',
        'Berat Badan (kg)': s.berat_badan || 0,
        'Tinggi Badan (cm)': s.tinggi_badan || 0,
        'Nama Ayah': s.nama_ayah || '',
        'Nama Ibu': s.nama_ibu || '',
        'Alergi Makanan': s.has_allergy ? s.allergy_type || 'Ya' : 'Tidak',
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = rows.length > 0 ? Object.keys(rows[0]).map((_, i) => ({ wch: i === 0 ? 5 : i <= 2 ? 25 : 18 }))
      XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa')

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="data-siswa-${new Date().toISOString().slice(0,10)}.xlsx"`,
        },
      })
    }

    if (type === 'teachers') {
      const { data, error } = await supabase.from('teachers').select('*').order('full_name')
      if (error) throw new Error(error.message)

      const rows = (data || []).map((t: any, i: number) => ({
        'No': i + 1,
        'Nama Guru / Tendik': t.full_name || '',
        'Sekolah': t.school_name || '',
        'NUPTK': t.nuptk || '',
        'NIP': t.nip || '',
        'JK': t.jk || '',
        'Tempat Lahir': t.tempat_lahir || '',
        'Tanggal Lahir': t.tanggal_lahir || '',
        'NIK': t.nik || '',
        'Jenis Tendik': t.jenis_tendik || '',
        'Alamat': t.alamat || '',
        'Status': t.status || 'Aktif',
        'Alergi Makanan': t.has_allergy ? t.allergy_type || 'Ya' : 'Tidak',
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = rows.length > 0 ? Object.keys(rows[0]).map((_, i) => ({ wch: i === 0 ? 5 : 22 }))
      XLSX.utils.book_append_sheet(wb, ws, 'Data Guru')

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="data-guru-${new Date().toISOString().slice(0,10)}.xlsx"`,
        },
      })
    }

    if (type === 'beneficiaries-3b') {
      const sub = req.nextUrl.searchParams.get('sub') || 'Bumil'
      const { data, error } = await supabase
        .from('beneficiaries_3b')
        .select('*')
        .eq('sub_category', sub)
        .order('full_name')
      if (error) throw new Error(error.message)

      const rows = (data || []).map((b: any, i: number) => ({
        'No': i + 1,
        'Kategori': b.sub_category || sub,
        'Nama Penerima': b.full_name || '',
        'NIK': b.nik || '',
        'Jenis Kelamin': b.gender || '',
        'Tanggal Lahir': b.birth_date || '',
        'Posyandu': b.posyandu_name || '',
        'Detail Info Gizi': b.detail_info || '',
        'PJ Kader': b.pic_name || '',
        'No. Telepon Kader': b.phone || '',
        'Status': b.status || 'Aktif',
        'Alergi Makanan': b.has_allergy ? b.allergy_type || 'Ya' : 'Tidak',
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = rows.length > 0 ? Object.keys(rows[0]).map((_, i) => ({ wch: i === 0 ? 5 : 22 }))
      XLSX.utils.book_append_sheet(wb, ws, `Data ${sub}`)

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="data-${sub.toLowerCase()}-${new Date().toISOString().slice(0,10)}.xlsx"`,
        },
      })
    }

    if (type === 'all') {
      const [sRes, tRes, bRes] = await Promise.all([
        supabase.from('students').select('*').order('nama'),
        supabase.from('teachers').select('*').order('full_name'),
        supabase.from('beneficiaries_3b').select('*').order('sub_category'),
      ])

      const wb = XLSX.utils.book_new()

      // Sheet Siswa
      const sRows = (sRes.data || []).map((s: any, i: number) => ({
        'No': i + 1, 'Nama Siswa': s.nama, 'Sekolah': s.school_name,
        'NIPD': s.nipd || '', 'JK': s.jk, 'NISN': s.nisn || '',
        'Tempat Lahir': s.tempat_lahir || '', 'Tanggal Lahir': s.tanggal_lahir || '',
        'NIK': s.nik || '', 'Agama': s.agama || '', 'Alamat': s.alamat || '',
        'Kelas': s.kelas || '', 'BB (kg)': s.berat_badan || 0, 'TB (cm)': s.tinggi_badan || 0,
        'Nama Ayah': s.nama_ayah || '', 'Nama Ibu': s.nama_ibu || '',
        'Alergi': s.has_allergy ? s.allergy_type || 'Ya' : 'Tidak',
      }))
      const ws1 = XLSX.utils.json_to_sheet(sRows)
      ws1['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 5 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, ws1, 'Siswa')

      // Sheet Guru
      const tRows = (tRes.data || []).map((t: any, i: number) => ({
        'No': i + 1, 'Nama Guru/Tendik': t.full_name, 'Sekolah': t.school_name,
        'NUPTK': t.nuptk || '', 'NIP': t.nip || '', 'JK': t.jk,
        'Tempat Lahir': t.tempat_lahir || '', 'Tanggal Lahir': t.tanggal_lahir || '',
        'NIK': t.nik || '', 'Jenis Tendik': t.jenis_tendik || '',
        'Alamat': t.alamat || '', 'Status': t.status || 'Aktif',
        'Alergi': t.has_allergy ? t.allergy_type || 'Ya' : 'Tidak',
      }))
      const ws2 = XLSX.utils.json_to_sheet(tRows)
      ws2['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 22 }, { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 30 }, { wch: 10 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, ws2, 'Guru/Tendik')

      // Sheet 3B - semua kategori
      const bRows = (bRes.data || []).map((b: any, i: number) => ({
        'No': i + 1, 'Kategori': b.sub_category, 'Nama Penerima': b.full_name,
        'NIK': b.nik || '', 'JK': b.gender || '', 'Tanggal Lahir': b.birth_date || '',
        'Posyandu': b.posyandu_name || '', 'Detail Info Gizi': b.detail_info || '',
        'PJ Kader': b.pic_name || '', 'No. Telp Kader': b.phone || '',
        'Status': b.status || 'Aktif',
        'Alergi': b.has_allergy ? b.allergy_type || 'Ya' : 'Tidak',
      }))
      const ws3 = XLSX.utils.json_to_sheet(bRows)
      ws3['!cols'] = [{ wch: 5 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, ws3, 'Penerima 3B')

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="data-penerima-manfaat-${new Date().toISOString().slice(0,10)}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ error: 'Tipe export tidak valid' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal export data' }, { status: 500 })
  }
}
