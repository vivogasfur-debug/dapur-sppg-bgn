'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import * as ExcelJS from 'exceljs';
import {
  FileBarChart, Download, Calendar, Filter, Users, GraduationCap, UserCheck, Baby,
  Truck, Package, AlertCircle, ChevronDown, BarChart3, TrendingUp, PieChart, School, Heart, Activity
} from 'lucide-react';

interface ReportData {
  students: any[];
  teachers: any[];
  beneficiaries3b: any[];
  distributions: any[];
  distByMonth: Record<string, { total: number; dikirim: number; porsi: number }>;
  distByDest: Record<string, number>;
  summary: {
    totalSiswa: number;
    totalGuru: number;
    total3b: number;
    totalDistribusi: number;
    totalPorsi: number;
  };
}

const BULAN = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function LaporanModule() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ringkas' | 'distribusi' | 'penerima' | 'gizi'>('ringkas');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'summary' });
      if (filterMonth) params.set('month', filterMonth);
      params.set('year', filterYear);
      const res = await fetch(`/api/reports?${params}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err: any) { toast.error(err.message || 'Gagal memuat laporan'); }
    finally { setLoading(false); }
  }, [filterMonth, filterYear]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
  const fmtDate = (d: string) => { if (!d) return '-'; const dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); };

  // === EXPORT EXCEL ===
  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Dapur SPPG Sangia Wambulu BGN';

      // Fetch logo
      let logoB64 = '';
      try {
        const logoRes = await fetch('/bgn.png');
        const buf = await logoRes.arrayBuffer();
        logoB64 = Buffer.from(buf).toString('base64');
      } catch {}

      const addKop = (ws: ExcelJS.Worksheet, title: string, headers: string[], colWidths: number[]) => {
        if (logoB64) {
          ws.mergeCells('A1', 'B4');
          const logoId = wb.addImage({ base64: `image/png;base64,${logoB64}`, extension: 'png' });
          ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 70, height: 70 } });
        }
        const lastCol = String.fromCharCode(64 + headers.length);
        ws.mergeCells(`C1`, `${lastCol}1`); const c1 = ws.getCell('C1'); c1.value = 'BADAN GIZI NASIONAL'; c1.font = { bold: true, size: 14, name: 'Calibri' }; c1.alignment = { vertical: 'middle', horizontal: 'center' };
        ws.mergeCells(`C2`, `${lastCol}2`); const c2 = ws.getCell('C2'); c2.value = 'Satuan Pelayanan Pemenuhan Gizi (SPPG)'; c2.font = { bold: true, size: 11, name: 'Calibri' }; c2.alignment = { vertical: 'middle', horizontal: 'center' };
        ws.mergeCells(`C3`, `${lastCol}3`); const c3 = ws.getCell('C3'); c3.value = 'Kabupaten Buton Tengah'; c3.font = { size: 10, name: 'Calibri' }; c3.alignment = { vertical: 'middle', horizontal: 'center' };
        ws.mergeCells(`C4`, `${lastCol}4`); const c4 = ws.getCell('C4'); c4.value = 'Kecamatan Sangia Wambulu, Kelurahan Tolandona'; c4.font = { size: 9, name: 'Calibri', italic: true }; c4.alignment = { vertical: 'middle', horizontal: 'center' };
        [1,2,3,4].forEach(r => ws.getRow(r).height = r === 1 ? 22 : r === 2 ? 20 : 18);
        ws.getRow(5).height = 4;
        for (let c = 1; c <= headers.length; c++) ws.getRow(5).getCell(c).border = { bottom: { style: 'double' as any } };
        ws.getRow(6).height = 8;
        ws.mergeCells(`A7`, `${lastCol}7`); const tc = ws.getCell('A7');
        tc.value = title; tc.font = { bold: true, size: 12, name: 'Calibri' }; tc.alignment = { vertical: 'middle', horizontal: 'center' };
        ws.getRow(7).height = 24;
        const hr = ws.getRow(8); hr.height = 22;
        headers.forEach((h, i) => {
          const cell = hr.getCell(i + 1); cell.value = h;
          cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FF047857' } } };
        });
        colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
      };

      // === SHEET 1: RINGKASAN ===
      const ws1 = wb.addWorksheet('Ringkasan');
      const sumHeaders = ['No', 'Indikator', 'Jumlah'];
      const sumWidths = [5, 40, 15];
      addKop(ws1, 'LAPORAN RINGKASAN DAPUR SPPG', sumHeaders, sumWidths);
      const periodText = filterMonth ? `Periode: ${BULAN[parseInt(filterMonth)]} ${filterYear}` : `Tahun ${filterYear}`;
      ws1.mergeCells('A9', 'C9'); const pc = ws1.getCell('A9'); pc.value = periodText; pc.font = { bold: true, size: 10, name: 'Calibri' }; pc.alignment = { horizontal: 'center' };
      const sumRows = [
        ['1', 'Total Siswa Penerima', data.summary.totalSiswa],
        ['2', 'Total Guru/Tendik Penerima', data.summary.totalGuru],
        ['3', 'Total Penerima 3B (Bumil/Busui/Balita)', data.summary.total3b],
        ['4', 'Total Seluruh Penerima', data.summary.totalSiswa + data.summary.totalGuru + data.summary.total3b],
        ['5', 'Total Distribusi Makanan', data.summary.totalDistribusi],
        ['6', 'Total Porsi Terdistribusi', data.summary.totalPorsi],
      ];
      sumRows.forEach(([no, label, val], i) => {
        const r = ws1.getRow(10 + i);
        r.getCell(1).value = no; r.getCell(1).alignment = { horizontal: 'center' };
        r.getCell(2).value = label;
        r.getCell(3).value = val as number; r.getCell(3).alignment = { horizontal: 'center' };
        if (i === 3) { [1,2,3].forEach(c => { r.getCell(c).font = { bold: true, size: 10, name: 'Calibri' }; r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } }; }); }
      });

      // === SHEET 2: DISTRIBUSI ===
      if (data.distributions.length > 0) {
        const ws2 = wb.addWorksheet('Distribusi');
        const dHeaders = ['No', 'Tanggal', 'Tujuan', 'Tipe', 'PIC', 'Menu', 'Porsi', 'Status'];
        const dWidths = [5, 14, 25, 12, 18, 25, 8, 12];
        addKop(ws2, 'LAPORAN DISTRIBUSI MAKANAN', dHeaders, dWidths);
        ws2.mergeCells('A9', 'H9'); const dc = ws2.getCell('A9'); dc.value = periodText; dc.font = { bold: true, size: 10 }; dc.alignment = { horizontal: 'center' };
        let row = 10;
        data.distributions.forEach((d: any, idx: number) => {
          const items = d.distribution_items || [];
          items.forEach((item: any, iIdx: number) => {
            const r = ws2.getRow(row);
            if (iIdx === 0) {
              r.getCell(1).value = idx + 1; r.getCell(1).alignment = { horizontal: 'center' };
              r.getCell(2).value = fmtDate(d.distribution_date); r.getCell(3).value = d.destination_name;
              r.getCell(4).value = d.destination_type; r.getCell(5).value = d.pic_name || '-';
              r.getCell(8).value = d.status;
            }
            r.getCell(6).value = item.menu_name || '-'; r.getCell(7).value = item.jumlah_porsi || 0; r.getCell(7).alignment = { horizontal: 'center' };
            row++;
          });
        });
      }

      // === SHEET 3: PENERIMA ===
      const ws3 = wb.addWorksheet('Data Penerima');
      const pHeaders = ['No', 'Nama', 'Kategori', 'Sekolah/Posyandu', 'JK', 'Detail', 'Alergi', 'Alamat'];
      const pWidths = [5, 25, 12, 25, 5, 15, 12, 30];
      addKop(ws3, 'DATA PENERIMA MANFAAT', pHeaders, pWidths);
      let pRow = 10;
      let pNo = 1;
      data.students.forEach((s: any) => {
        const r = ws3.getRow(pRow++);
        r.getCell(1).value = pNo++; r.getCell(1).alignment = { horizontal: 'center' };
        r.getCell(2).value = s.nama; r.getCell(3).value = 'Siswa'; r.getCell(4).value = s.school_name || '-';
        r.getCell(5).value = s.jk || '-'; r.getCell(6).value = s.kelas || '-';
        r.getCell(7).value = s.has_allergy ? 'Ya' : 'Tidak'; r.getCell(8).value = s.alamat || '-';
      });
      data.teachers.forEach((t: any) => {
        const r = ws3.getRow(pRow++);
        r.getCell(1).value = pNo++; r.getCell(1).alignment = { horizontal: 'center' };
        r.getCell(2).value = t.full_name; r.getCell(3).value = 'Guru/Tendik'; r.getCell(4).value = t.school_name || '-';
        r.getCell(5).value = t.jk || '-'; r.getCell(6).value = t.jenis_tendik || '-';
        r.getCell(7).value = t.has_allergy ? 'Ya' : 'Tidak'; r.getCell(8).value = t.alamat || '-';
      });
      data.beneficiaries3b.forEach((b: any) => {
        const r = ws3.getRow(pRow++);
        r.getCell(1).value = pNo++; r.getCell(1).alignment = { horizontal: 'center' };
        r.getCell(2).value = b.full_name; r.getCell(3).value = b.sub_category; r.getCell(4).value = b.posyandu_name || '-';
        r.getCell(5).value = b.gender || '-'; r.getCell(6).value = b.status || '-';
        r.getCell(7).value = b.has_allergy ? 'Ya' : 'Tidak'; r.getCell(8).value = '-';
      });

      // Download
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Laporan_SPPG_${filterMonth ? BULAN[parseInt(filterMonth)] : 'Tahun'}_${filterYear}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Laporan berhasil diunduh!');
    } catch { toast.error('Gagal mengekspor laporan'); }
    finally { setExporting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-3"><div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" /><p className="text-sm text-slate-400">Memuat data laporan...</p></div>
    </div>
  );

  if (!data) return <p className="text-center text-slate-400 py-20">Tidak ada data</p>;

  const { students, teachers, beneficiaries3b, distributions, distByMonth, distByDest, summary } = data;
  const totalPenerima = summary.totalSiswa + summary.totalGuru + summary.total3b;
  const siswaL = students.filter(s => s.jk === 'L').length;
  const siswaP = students.filter(s => s.jk === 'P').length;
  const guruL = teachers.filter(t => t.jk === 'L').length;
  const guruP = teachers.filter(t => t.jk === 'P').length;
  const b3bL = beneficiaries3b.filter(b => b.gender === 'L').length;
  const b3bP = beneficiaries3b.filter(b => b.gender === 'P').length;
  const bumil = beneficiaries3b.filter(b => b.sub_category === 'Bumil').length;
  const busui = beneficiaries3b.filter(b => b.sub_category === 'Busui').length;
  const balita = beneficiaries3b.filter(b => b.sub_category === 'Balita').length;
  const alergiSiswa = students.filter(s => s.has_allergy).length;
  const alergiGuru = teachers.filter(t => t.has_allergy).length;
  const alergi3b = beneficiaries3b.filter(b => b.has_allergy).length;
  const totalAlergi = alergiSiswa + alergiGuru + alergi3b;

  // Gizi
  const giziCounts = { kurang: 0, normal: 0, lebih: 0, noData: 0 };
  students.forEach(s => {
    if (s.berat_badan > 0 && s.tinggi_badan > 0) {
      const tbm = s.tinggi_badan / 100;
      if (tbm > 0) { const bmi = s.berat_badan / (tbm * tbm); if (bmi < 18.5) giziCounts.kurang++; else if (bmi > 25) giziCounts.lebih++; else giziCounts.normal++; }
    } else giziCounts.noData++;
  });

  // School map
  const schoolMap: Record<string, number> = {};
  students.forEach(s => { schoolMap[s.school_name || '-'] = (schoolMap[s.school_name || '-'] || 0) + 1; });
  const topSchools = Object.entries(schoolMap).sort((a, b) => b[1] - a[1]);

  // Kelas map
  const kelasMap: Record<string, number> = {};
  students.forEach(s => { const k = s.kelas && s.kelas !== '-' ? s.kelas : '-'; kelasMap[k] = (kelasMap[k] || 0) + 1; });
  const kelasEntries = Object.entries(kelasMap).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));

  // Posyandu map
  const posyanduMap: Record<string, { total: number; bumil: number; busui: number; balita: number }> = {};
  beneficiaries3b.forEach(b => {
    const name = b.posyandu_name || '-';
    if (!posyanduMap[name]) posyanduMap[name] = { total: 0, bumil: 0, busui: 0, balita: 0 };
    posyanduMap[name].total++;
    if (b.sub_category === 'Bumil') posyanduMap[name].bumil++;
    else if (b.sub_category === 'Busui') posyanduMap[name].busui++;
    else posyanduMap[name].balita++;
  });
  const topPosyandu = Object.entries(posyanduMap).sort((a, b) => b[1].total - a[1].total);

  // Month entries sorted
  const monthEntries = Object.entries(distByMonth).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDist = monthEntries.length > 0 ? Math.max(...monthEntries.map(e => e[1].total)) : 1;
  const maxPorsi = monthEntries.length > 0 ? Math.max(...monthEntries.map(e => e[1].porsi)) : 1;

  const tabs = [
    { key: 'ringkas' as const, label: 'Ringkasan', icon: BarChart3 },
    { key: 'distribusi' as const, label: 'Distribusi', icon: Truck },
    { key: 'penerima' as const, label: 'Penerima', icon: Users },
    { key: 'gizi' as const, label: 'Status Gizi', icon: Activity },
  ];

  return (
    <div className="space-y-3 max-w-full">
      {/* HEADER TOOLBAR */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><FileBarChart className="w-5 h-5" /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Modul Laporan</h2>
              <p className="text-[10px] text-slate-400">Laporan & Rekapitulasi Dapur SPPG</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1 border border-slate-200">
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="text-xs bg-transparent border-0 focus:outline-none font-semibold text-slate-600 pr-1 cursor-pointer">
                {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="text-xs bg-transparent border-0 focus:outline-none font-semibold text-slate-600 cursor-pointer">
                <option value="">Semua Bulan</option>
                {BULAN.slice(1).map((b, i) => <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{b}</option>)}
              </select>
            </div>
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50">
              {exporting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
              <Icon className="w-3.5 h-3.5" /><span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===== TAB: RINGKASAN ===== */}
      {activeTab === 'ringkas' && (
        <div className="space-y-3">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Penerima', value: totalPenerima, sub: 'Siswa + Guru + 3B', color: 'emerald' },
              { label: 'Distribusi', value: summary.totalDistribusi, sub: `${fmt(summary.totalPorsi)} porsi`, color: 'blue' },
              { label: 'Penerima 3B', value: summary.total3b, sub: `B:${bumil} BU:${busui} Ba:${balita}`, color: 'amber' },
              { label: 'Peringatan Alergi', value: totalAlergi, sub: `${totalPenerima > 0 ? ((totalAlergi / totalPenerima) * 100).toFixed(1) : 0}% dari total`, color: 'rose' },
            ].map((card, i) => (
              <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{card.label}</span>
                  <div className={`p-1.5 rounded-lg bg-${card.color}-50 text-${card.color}-500`}><i className={`w-3.5 h-3.5`} /></div>
                </div>
                <h3 className="text-xl font-extrabold text-slate-800">{fmt(card.value)}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Distribusi Per Bulan */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-700">Tren Distribusi Per Bulan</h3>
            </div>
            {monthEntries.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Belum ada data distribusi</p>
            ) : (
              <div className="space-y-2">
                {monthEntries.map(([month, d]) => {
                  const [y, m] = month.split('-');
                  return (
                    <div key={month} className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-600 w-24 font-medium">{BULAN[parseInt(m)]} {y}</span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 w-8">Aksi</span>
                          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500 flex items-center pl-1.5" style={{ width: `${(d.total / maxDist) * 100}%`, minWidth: d.total > 0 ? '1.5rem' : '0' }}>
                              <span className="text-[9px] font-bold text-white">{d.total}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 w-8">Porsi</span>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(d.porsi / maxPorsi) * 100}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-emerald-600 w-10 text-right">{fmt(d.porsi)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tujuan Distribusi */}
          {Object.keys(distByDest).length > 0 && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-700">Distribusi Per Tujuan</h3>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {Object.entries(distByDest).sort((a, b) => b[1] - a[1]).map(([dest, count]) => (
                  <div key={dest} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 w-40 truncate font-medium" title={dest}>{dest}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${(count / Math.max(...Object.values(distByDest))) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: DISTRIBUSI ===== */}
      {activeTab === 'distribusi' && (
        <div className="space-y-3">
          {distributions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Belum ada data distribusi</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-emerald-500 text-white">
                      <th className="px-3 py-2.5 text-left font-semibold">Tanggal</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Tujuan</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Tipe</th>
                      <th className="px-3 py-2.5 text-left font-semibold">PIC</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Menu</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Porsi</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map((d: any, idx: number) => {
                      const items = d.distribution_items || [];
                      return items.map((item: any, iIdx: number) => (
                        <tr key={`${d.id}-${iIdx}`} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          {iIdx === 0 && <td rowSpan={items.length} className="px-3 py-2 text-slate-600 font-medium align-top">{fmtDate(d.distribution_date)}</td>}
                          {iIdx === 0 && <td rowSpan={items.length} className="px-3 py-2 text-slate-700 font-medium align-top">{d.destination_name}</td>}
                          {iIdx === 0 && <td rowSpan={items.length} className="px-3 py-2 align-top"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600">{d.destination_type}</span></td>}
                          {iIdx === 0 && <td rowSpan={items.length} className="px-3 py-2 text-slate-500 align-top">{d.pic_name || '-'}</td>}
                          <td className="px-3 py-2 text-slate-600">{item.menu_name || '-'}</td>
                          <td className="px-3 py-2 text-center font-bold text-slate-700">{item.jumlah_porsi || 0}</td>
                          {iIdx === 0 && (
                            <td rowSpan={items.length} className="px-3 py-2 text-center align-top">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === 'Diterima' ? 'bg-emerald-50 text-emerald-600' : d.status === 'Dikirim' ? 'bg-blue-50 text-blue-600' : d.status === 'Dibatalkan' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{d.status}</span>
                            </td>
                          )}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: PENERIMA ===== */}
      {activeTab === 'penerima' && (
        <div className="space-y-3">
          {/* Gender Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3"><GraduationCap className="w-4 h-4 text-emerald-500" /><h4 className="text-xs font-bold text-slate-700">Siswa ({summary.totalSiswa})</h4></div>
              <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 mb-1">
                {siswaL + siswaP > 0 && <><div className="bg-blue-400" style={{ width: `${(siswaL / (siswaL + siswaP)) * 100}%` }} /><div className="bg-pink-300" style={{ width: `${(siswaP / (siswaL + siswaP)) * 100}%` }} /></>}
              </div>
              <div className="flex justify-between text-[10px] font-semibold"><span className="text-blue-500">L: {siswaL}</span><span className="text-pink-400">P: {siswaP}</span></div>
              {alergiSiswa > 0 && <p className="text-[10px] text-rose-500 mt-2 font-medium">Alergi: {alergiSiswa} siswa</p>}
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3"><UserCheck className="w-4 h-4 text-blue-500" /><h4 className="text-xs font-bold text-slate-700">Guru/Tendik ({summary.totalGuru})</h4></div>
              <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 mb-1">
                {guruL + guruP > 0 && <><div className="bg-blue-400" style={{ width: `${(guruL / (guruL + guruP)) * 100}%` }} /><div className="bg-pink-300" style={{ width: `${(guruP / (guruL + guruP)) * 100}%` }} /></>}
              </div>
              <div className="flex justify-between text-[10px] font-semibold"><span className="text-blue-500">L: {guruL}</span><span className="text-pink-400">P: {guruP}</span></div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3"><Baby className="w-4 h-4 text-amber-500" /><h4 className="text-xs font-bold text-slate-700">Penerima 3B ({summary.total3b})</h4></div>
              <div className="space-y-1.5">
                {[
                  { label: 'Bumil', count: bumil, color: 'rose' },
                  { label: 'Busui', count: busui, color: 'violet' },
                  { label: 'Balita', count: balita, color: 'cyan' },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-12">{c.label}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-${c.color}-400 rounded-full`} style={{ width: `${summary.total3b > 0 ? (c.count / summary.total3b) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 w-5 text-right">{c.count}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-semibold mt-2 pt-1 border-t border-slate-100"><span className="text-blue-500">L: {b3bL}</span><span className="text-pink-400">P: {b3bP}</span></div>
            </div>
          </div>

          {/* Per Sekolah */}
          {topSchools.length > 0 && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3"><School className="w-4 h-4 text-emerald-500" /><h4 className="text-xs font-bold text-slate-700">Distribusi Per Sekolah</h4></div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {topSchools.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 w-40 truncate font-medium" title={name}>{name}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-lg overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-lg transition-all duration-500 flex items-center pl-2" style={{ width: `${(count / topSchools[0][1]) * 100}%`, minWidth: count > 0 ? '1.5rem' : '0' }}>
                        <span className="text-[9px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per Posyandu */}
          {topPosyandu.length > 0 && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3"><Heart className="w-4 h-4 text-rose-500" /><h4 className="text-xs font-bold text-slate-700">Distribusi Per Posyandu</h4></div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {topPosyandu.map(([name, d]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-600 w-32 truncate font-medium" title={name}>{name}</span>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-400 w-7">Bumil</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-rose-400 rounded-full" style={{ width: `${d.bumil > 0 ? (d.bumil / Math.max(d.bumil, d.busui, d.balita)) * 100 : 0}%` }} /></div>
                        <span className="text-[9px] text-slate-500 w-4 text-right">{d.bumil}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-400 w-7">Busui</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-violet-400 rounded-full" style={{ width: `${d.busui > 0 ? (d.busui / Math.max(d.bumil, d.busui, d.balita)) * 100 : 0}%` }} /></div>
                        <span className="text-[9px] text-slate-500 w-4 text-right">{d.busui}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-400 w-7">Balita</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-400 rounded-full" style={{ width: `${d.balita > 0 ? (d.balita / Math.max(d.bumil, d.busui, d.balita)) * 100 : 0}%` }} /></div>
                        <span className="text-[9px] text-slate-500 w-4 text-right">{d.balita}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 w-6 text-right">{d.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per Kelas */}
          {kelasEntries.length > 0 && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-blue-500" /><h4 className="text-xs font-bold text-slate-700">Distribusi Per Kelas</h4></div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {kelasEntries.map(([k, c]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 w-14 font-bold">Kls {k}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-lg overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center pl-2" style={{ width: `${(c / Math.max(...kelasEntries.map(e => e[1]))) * 100}%`, minWidth: c > 0 ? '1.2rem' : '0' }}>
                        <span className="text-[9px] font-bold text-white">{c}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: STATUS GIZI ===== */}
      {activeTab === 'gizi' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/60 p-4 rounded-2xl text-center">
              <h4 className="text-2xl font-extrabold text-emerald-600">{giziCounts.normal}</h4>
              <p className="text-xs font-semibold text-emerald-500">Normal (BMI 18.5-25)</p>
              <div className="mt-2 h-2 bg-emerald-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${summary.totalSiswa > 0 ? (giziCounts.normal / summary.totalSiswa) * 100 : 0}%` }} /></div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/60 p-4 rounded-2xl text-center">
              <h4 className="text-2xl font-extrabold text-orange-600">{giziCounts.kurang}</h4>
              <p className="text-xs font-semibold text-orange-500">Kurus (BMI {'<'} 18.5)</p>
              <div className="mt-2 h-2 bg-orange-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${summary.totalSiswa > 0 ? (giziCounts.kurang / summary.totalSiswa) * 100 : 0}%` }} /></div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200/60 p-4 rounded-2xl text-center">
              <h4 className="text-2xl font-extrabold text-rose-600">{giziCounts.lebih}</h4>
              <p className="text-xs font-semibold text-rose-500">Gemuk (BMI {'>'} 25)</p>
              <div className="mt-2 h-2 bg-rose-200 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${summary.totalSiswa > 0 ? (giziCounts.lebih / summary.totalSiswa) * 100 : 0}%` }} /></div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 p-4 rounded-2xl text-center">
              <h4 className="text-2xl font-extrabold text-slate-500">{giziCounts.noData}</h4>
              <p className="text-xs font-semibold text-slate-400">Belum Ada Data BB/TB</p>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-400 rounded-full" style={{ width: `${summary.totalSiswa > 0 ? (giziCounts.noData / summary.totalSiswa) * 100 : 0}%` }} /></div>
            </div>
          </div>

          {/* Detail Per Sekolah */}
          {topSchools.length > 0 && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-teal-500" /><h4 className="text-xs font-bold text-slate-700">Status Gizi Per Sekolah</h4></div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="px-3 py-2 text-left font-semibold">Sekolah</th>
                      <th className="px-3 py-2 text-center font-semibold">Total</th>
                      <th className="px-3 py-2 text-center font-semibold">Normal</th>
                      <th className="px-3 py-2 text-center font-semibold">Kurus</th>
                      <th className="px-3 py-2 text-center font-semibold">Gemuk</th>
                      <th className="px-3 py-2 text-center font-semibold">No Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSchools.map(([school]) => {
                      const sList = students.filter(s => (s.school_name || '-') === school);
                      const g = { kurang: 0, normal: 0, lebih: 0, noData: 0 };
                      sList.forEach(s => {
                        if (s.berat_badan > 0 && s.tinggi_badan > 0) {
                          const tbm = s.tinggi_badan / 100;
                          if (tbm > 0) { const bmi = s.berat_badan / (tbm * tbm); if (bmi < 18.5) g.kurang++; else if (bmi > 25) g.lebih++; else g.normal++; }
                        } else g.noData++;
                      });
                      return (
                        <tr key={school} className="border-b border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-700">{school}</td>
                          <td className="px-3 py-2 text-center font-bold">{sList.length}</td>
                          <td className="px-3 py-2 text-center"><span className="text-emerald-600 font-bold">{g.normal}</span></td>
                          <td className="px-3 py-2 text-center"><span className="text-orange-600 font-bold">{g.kurang}</span></td>
                          <td className="px-3 py-2 text-center"><span className="text-rose-600 font-bold">{g.lebih}</span></td>
                          <td className="px-3 py-2 text-center text-slate-400">{g.noData}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
