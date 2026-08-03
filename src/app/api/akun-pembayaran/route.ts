import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const SETUP_SQL = `CREATE TABLE IF NOT EXISTS akun_pembayaran (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jenis TEXT NOT NULL CHECK (jenis IN ('barang_masuk', 'gaji_relawan', 'gaji_pic_sekolah', 'gaji_pic_posyandu')),
  tanggal DATE NOT NULL,
  bulan TEXT,
  tahun TEXT,
  penerima TEXT NOT NULL,
  keterangan TEXT,
  jumlah NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Belum Bayar' CHECK (status IN ('Lunas', 'Belum Bayar', 'Dibatalkan')),
  bukti_bayar TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE akun_pembayaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on akun_pembayaran" ON akun_pembayaran FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_akun_bayar_jenis ON akun_pembayaran(jenis);
CREATE INDEX IF NOT EXISTS idx_akun_bayar_tanggal ON akun_pembayaran(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_akun_bayar_status ON akun_pembayaran(status);`;

const SEED_DATA = [
  // Pembayaran Barang Masuk
  { jenis:'barang_masuk', tanggal:'2025-07-28', penerima:'CV Pangan Sehat', keterangan:'Beras Premium 50kg x 10 karung', jumlah:8500000, status:'Lunas', bulan:'Juli', tahun:'2025' },
  { jenis:'barang_masuk', tanggal:'2025-07-29', penerima:'UD Sumber Protein', keterangan:'Ayam Potong 40kg + Telur 5 Rak', jumlah:4200000, status:'Lunas', bulan:'Juli', tahun:'2025' },
  { jenis:'barang_masuk', tanggal:'2025-07-30', penerima:'Toko Sayur Makmur', keterangan:'Sayuran campuran mingguan', jumlah:1250000, status:'Lunas', bulan:'Juli', tahun:'2025' },
  { jenis:'barang_masuk', tanggal:'2025-08-01', penerima:'CV Pangan Sehat', keterangan:'Minyak Goreng 20 liter x 5 galon', jumlah:3100000, status:'Belum Bayar', bulan:'Agustus', tahun:'2025' },
  { jenis:'barang_masuk', tanggal:'2025-08-02', penerima:'Distributor Buah Nusantara', keterangan:'Pisang, Jeruk, Apel campuran', jumlah:980000, status:'Belum Bayar', bulan:'Agustus', tahun:'2025' },
  // Gaji Relawan
  { jenis:'gaji_relawan', tanggal:'2025-07-25', penerima:'Siti Rahmawati', keterangan:'Gaji Relawan Juli 2025', jumlah:1500000, status:'Lunas', bulan:'Juli', tahun:'2025' },
  { jenis:'gaji_relawan', tanggal:'2025-07-25', penerima:'Ahmad Fauzi', keterangan:'Gaji Relawan Juli 2025', jumlah:1500000, status:'Lunas', bulan:'Juli', tahun:'2025' },
  { jenis:'gaji_relawan', tanggal:'2025-07-25', penerima:'Dewi Sartika', keterangan:'Gaji Relawan Juli 2025', jumlah:1500000, status:'Belum Bayar', bulan:'Juli', tahun:'2025' },
  { jenis:'gaji_relawan', tanggal:'2025-08-01', penerima:'Siti Rahmawati', keterangan:'Gaji Relawan Agustus 2025', jumlah:1500000, status:'Belum Bayar', bulan:'Agustus', tahun:'2025' },
  // Gaji PIC Sekolah
  { jenis:'gaji_pic_sekolah', tanggal:'2025-07-25', penerima:'Ibu Maria - SDN 1 Sangia', keterangan:'Gaji PIC Sekolah Juli 2025', jumlah:750000, status:'Lunas', bulan:'Juli', tahun:'2025' },
  { jenis:'gaji_pic_sekolah', tanggal:'2025-07-25', penerima:'Pak Budi - SDN 3 Wambulu', keterangan:'Gaji PIC Sekolah Juli 2025', jumlah:750000, status:'Lunas', bulan:'Juli', tahun:'2025' },
  { jenis:'gaji_pic_sekolah', tanggal:'2025-07-25', penerima:'Ibu Ratna - SMPN 2 Sangia', keterangan:'Gaji PIC Sekolah Juli 2025', jumlah:750000, status:'Belum Bayar', bulan:'Juli', tahun:'2025' },
  // Gaji PIC Kader Posyandu
  { jenis:'gaji_pic_posyandu', tanggal:'2025-07-25', penerima:'Ibu Nurhayati - Posyandu Melati', keterangan:'Gaji PIC Kader Posyandu Juli 2025', jumlah:500000, status:'Lunas', bulan:'Juli', tahun:'2025' },
  { jenis:'gaji_pic_posyandu', tanggal:'2025-07-25', penerima:'Ibu Hasnah - Posyandu Mawar', keterangan:'Gaji PIC Kader Posyandu Juli 2025', jumlah:500000, status:'Lunas', bulan:'Juli', tahun:'2025' },
  { jenis:'gaji_pic_posyandu', tanggal:'2025-07-25', penerima:'Ibu Yanti - Posyandu Dahlia', keterangan:'Gaji PIC Kader Posyandu Juli 2025', jumlah:500000, status:'Belum Bayar', bulan:'Juli', tahun:'2025' },
];

const fmtRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const jenis = searchParams.get('jenis')
    const bulan = searchParams.get('bulan')
    const status = searchParams.get('status')

    if (action === 'setup') {
      return NextResponse.json({ sql: SETUP_SQL });
    }

    if (action === 'check') {
      const { error } = await supabase.from('akun_pembayaran').select('id').limit(1)
      return NextResponse.json({ ready: !error, sql: SETUP_SQL });
    }

    if (action === 'seed') {
      const { error: chk } = await supabase.from('akun_pembayaran').select('id').limit(1)
      if (chk) return NextResponse.json({ error: 'Tabel belum ada. Jalankan SQL setup terlebih dahulu.' }, { status: 400 })
      await supabase.from('akun_pembayaran').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      const { data, error } = await supabase.from('akun_pembayaran').insert(SEED_DATA).select('id')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, count: data!.length, message: `${data!.length} data pembayaran tersimpan` })
    }

    if (action === 'summary') {
      const { data, error } = await supabase.from('akun_pembayaran').select('jenis, jumlah, status')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const summary: Record<string, { total: number; lunas: number; belum: number; batal: number; count: number }> = {};
      (data || []).forEach(function(row) {
        if (!summary[row.jenis]) summary[row.jenis] = { total: 0, lunas: 0, belum: 0, batal: 0, count: 0 };
        summary[row.jenis].count++;
        summary[row.jenis].total += Number(row.jumlah);
        if (row.status === 'Lunas') summary[row.jenis].lunas += Number(row.jumlah);
        else if (row.status === 'Belum Bayar') summary[row.jenis].belum += Number(row.jumlah);
        else if (row.status === 'Dibatalkan') summary[row.jenis].batal += Number(row.jumlah);
      });
      return NextResponse.json(summary);
    }

    // Normal GET - list with filters
    let q = supabase.from('akun_pembayaran').select('*').order('tanggal', { ascending: false }).order('created_at', { ascending: false })
    if (jenis && jenis !== 'semua') q = q.eq('jenis', jenis)
    if (bulan) q = q.eq('bulan', bulan)
    if (status && status !== 'semua') q = q.eq('status', status)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, error } = await supabase.from('akun_pembayaran').insert([{
      jenis: body.jenis,
      tanggal: body.tanggal,
      bulan: body.bulan || null,
      tahun: body.tahun || null,
      penerima: body.penerima,
      keterangan: body.keterangan || null,
      jumlah: Number(body.jumlah) || 0,
      status: body.status || 'Belum Bayar',
      catatan: body.catatan || null,
    }]).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data![0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menyimpan'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    const body = await req.json()
    const updateData: Record<string, unknown> = {}
    if (body.jenis !== undefined) updateData.jenis = body.jenis
    if (body.tanggal !== undefined) updateData.tanggal = body.tanggal
    if (body.bulan !== undefined) updateData.bulan = body.bulan || null
    if (body.tahun !== undefined) updateData.tahun = body.tahun || null
    if (body.penerima !== undefined) updateData.penerima = body.penerima
    if (body.keterangan !== undefined) updateData.keterangan = body.keterangan || null
    if (body.jumlah !== undefined) updateData.jumlah = Number(body.jumlah) || 0
    if (body.status !== undefined) updateData.status = body.status
    if (body.catatan !== undefined) updateData.catatan = body.catatan || null
    const { data, error } = await supabase.from('akun_pembayaran').update(updateData).eq('id', id).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data![0])
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memperbarui'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')
    if (all === 'true') {
      const { error } = await supabase.from('akun_pembayaran').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    const { error } = await supabase.from('akun_pembayaran').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
