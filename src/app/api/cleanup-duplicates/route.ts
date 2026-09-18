import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/cleanup-duplicates
 * Removes duplicate records from the database, keeping the most recent one (by id/created_at).
 * Works for: students, teachers, beneficiaries-3b
 */
export async function POST(req: Request) {
  try {
    const { type } = await req.json()
    
    if (!type || !['students', 'teachers', 'beneficiaries-3b'].includes(type)) {
      return NextResponse.json({ error: 'Tipe tidak valid. Gunakan: students, teachers, beneficiaries-3b' }, { status: 400 })
    }

    const tableName = type === 'beneficiaries-3b' ? 'beneficiaries_3b' : type
    const { data: allRecords, error: fetchErr } = await supabase.from(tableName).select('*').order('id', { ascending: true })
    
    if (fetchErr) {
      return NextResponse.json({ error: `Gagal mengambil data: ${fetchErr.message}` }, { status: 500 })
    }

    if (!allRecords || allRecords.length === 0) {
      return NextResponse.json({ message: 'Tidak ada data', removed: 0 })
    }

    // Build match key for each record
    const getMatchKey = (rec: Record<string, any>): string | null => {
      if (type === 'students') {
        if (rec.nisn && rec.nisn.trim() !== '' && rec.nisn.trim() !== '-') return `nisn:${rec.nisn.trim()}`
        if (rec.nipd && rec.nipd.trim() !== '' && rec.nipd.trim() !== '-') return `nipd:${rec.nipd.trim()}`
        if (rec.nik && rec.nik.trim() !== '' && rec.nik.trim() !== '-') return `nik:${rec.nik.trim()}`
        const nama = (rec.nama || '').trim().toLowerCase()
        const tgl = (rec.tanggal_lahir || '').trim()
        if (nama && nama !== '-' && tgl) return `nama_tgl:${nama}|${tgl}`
      } else if (type === 'teachers') {
        if (rec.nuptk && rec.nuptk.trim() !== '' && rec.nuptk.trim() !== '-') return `nuptk:${rec.nuptk.trim()}`
        if (rec.nip && rec.nip.trim() !== '' && rec.nip.trim() !== '-') return `nip:${rec.nip.trim()}`
        if (rec.nik && rec.nik.trim() !== '' && rec.nik.trim() !== '-') return `nik:${rec.nik.trim()}`
        const nama = (rec.full_name || '').trim().toLowerCase()
        const tgl = (rec.tanggal_lahir || '').trim()
        if (nama && nama !== '-' && tgl) return `nama_tgl:${nama}|${tgl}`
      } else {
        if (rec.nik && rec.nik.trim() !== '' && rec.nik.trim() !== '-') return `nik:${rec.nik.trim()}`
        const nama = (rec.full_name || '').trim().toLowerCase()
        const tgl = (rec.birth_date || '').trim()
        if (nama && nama !== '-' && tgl) return `nama_tgl:${nama}|${tgl}`
      }
      return null
    }

    // Find duplicates: group by match key, keep the LAST (most recent) one
    const keyMap = new Map<string, number[]>() // key → array of record indices
    const noKeyIndices: number[] = [] // records without a match key

    allRecords.forEach((rec: any, idx: number) => {
      const mk = getMatchKey(rec)
      if (mk) {
        if (!keyMap.has(mk)) keyMap.set(mk, [])
        keyMap.get(mk)!.push(idx)
      } else {
        noKeyIndices.push(idx)
      }
    })

    // Collect IDs to delete (all duplicates except the last one per group)
    const idsToDelete: string[] = []
    let duplicateGroups = 0

    for (const [, indices] of keyMap) {
      if (indices.length > 1) {
        duplicateGroups++
        // Keep the LAST one (most recent), delete the rest
        const toDelete = indices.slice(0, -1)
        for (const idx of toDelete) {
          idsToDelete.push(allRecords[idx].id)
        }
      }
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ 
        message: 'Tidak ada duplikat ditemukan', 
        total_records: allRecords.length, 
        duplicate_groups: 0, 
        removed: 0 
      })
    }

    // Delete duplicates in batches of 100
    let deleted = 0
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100)
      const { error: delErr } = await supabase.from(tableName).delete().in('id', batch)
      if (delErr) {
        console.error('[Cleanup] Delete error:', delErr)
      } else {
        deleted += batch.length
      }
    }

    return NextResponse.json({
      message: `${deleted} data duplikat berhasil dihapus`,
      total_records: allRecords.length,
      duplicate_groups: duplicateGroups,
      removed: deleted,
      remaining: allRecords.length - deleted,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal cleanup'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
