'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart, School, Heart, Users, GraduationCap, UserCheck,
  PieChart, Activity, UtensilsCrossed, Loader2, Download, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

interface RekapData {
  porsi: {
    siswaTKRA: number; siswaSDKelas123: number; siswaSDKelas456: number;
    siswaSMP: number; siswaSMA: number; bumil: number; busui: number;
    balita6_11: number; balita12_60: number;
    porsiKecil: number; porsiBesar: number; totalPorsi: number; totalPenerimaAll: number;
  };
  gender: { siswaL: number; siswaP: number; guruL: number; guruP: number; b3bL: number; b3bP: number };
  alergi: { alergiSekolah: number; alergi3b: number; alergiTotal: number };
  jenjangGroups: Record<string, { siswaCount: number; L: number; P: number; guru: number; schools: [string, number][] }>;
  gizi: { kurang: number; normal: number; lebih: number; noData: number };
  posyandu: {
    list: { name: string; total: number; bumil: number; busui: number; balita: number; L: number; P: number }[];
    balita: number; balita_lt6: number; balita_gt60: number; balita_noCat: number;
  };
  guruSchoolMap: Record<string, number>;
  totals: { students: number; teachers: number; beneficiaries3b: number };
}

const jenjangColor = (j: string) => {
  switch (j) { case 'TK': return 'bg-pink-500'; case 'SD': return 'bg-blue-500'; case 'SMP': return 'bg-amber-500'; case 'SMA': return 'bg-violet-500'; default: return 'bg-slate-400'; }
};
const jenjangLabel = (j: string) => {
  switch (j) { case 'TK': return 'TK / RA'; case 'SD': return 'SD / MI'; case 'SMP': return 'SMP / MTs'; case 'SMA': return 'SMA / SMK / MA'; default: return 'Lainnya'; }
};

export default function RekapitulasiPmModule() {
  const [data, setData] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'Sekolah' | '3B'>('Sekolah');
  const [exporting, setExporting] = useState(false);
  const [expandedJenjang, setExpandedJenjang] = useState<string | null>('TK');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/rekap-pm');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json as RekapData);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Export
  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const ExcelJSMod = (await import('exceljs') as any).default;
      const wb = new ExcelJSMod.Workbook();
      const ws = wb.addWorksheet('Rekapitulasi PM');
      ws.columns = [
        { header: 'Kategori', key: 'kat', width: 20 }, { header: 'Sub Kategori', key: 'sub', width: 25 },
        { header: 'Jumlah', key: 'jml', width: 12 }, { header: 'L', key: 'l', width: 8 }, { header: 'P', key: 'p', width: 8 },
      ];
      const p = data.porsi, g = data.gender;
      const rows: any[] = [
        { kat: 'PORSI KECIL', sub: 'TK/RA', jml: p.siswaTKRA, l: '-', p: '-' },
        { kat: 'PORSI KECIL', sub: 'SD Kelas 1-3', jml: p.siswaSDKelas123, l: '-', p: '-' },
        { kat: 'PORSI KECIL', sub: 'Balita 6-11 Bln', jml: p.balita6_11, l: '-', p: '-' },
        { kat: 'PORSI KECIL', sub: 'Balita 12-60 Bln', jml: p.balita12_60, l: '-', p: '-' },
        { kat: 'TOTAL PORSI KECIL', sub: '', jml: p.porsiKecil, l: g.siswaL, p: g.siswaP },
        { kat: 'PORSI BESAR', sub: 'Guru/Tendik', jml: data.totals.teachers, l: g.guruL, p: g.guruP },
        { kat: 'PORSI BESAR', sub: 'SD Kelas 4-6', jml: p.siswaSDKelas456, l: '-', p: '-' },
        { kat: 'PORSI BESAR', sub: 'SMP', jml: p.siswaSMP, l: '-', p: '-' },
        { kat: 'PORSI BESAR', sub: 'SMA/SMK', jml: p.siswaSMA, l: '-', p: '-' },
        { kat: 'PORSI BESAR', sub: 'Bumil', jml: p.bumil, l: '-', p: '-' },
        { kat: 'PORSI BESAR', sub: 'Busui', jml: p.busui, l: '-', p: '-' },
        { kat: 'TOTAL PORSI BESAR', sub: '', jml: p.porsiBesar, l: '-', p: '-' },
        { kat: 'GRAND TOTAL', sub: 'Porsi Kecil + Besar', jml: p.totalPorsi, l: '-', p: '-' },
        { kat: '', sub: '', jml: '', l: '', p: '' },
        { kat: 'TOTAL DATA', sub: 'Seluruh Penerima', jml: p.totalPenerimaAll, l: '-', p: '-' },
      ];
      ws.addRows(rows);
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'Rekapitulasi_PM.xlsx'; a.click(); URL.revokeObjectURL(url);
    } catch { /* silent */ } finally { setExporting(false); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      <span className="text-xs text-slate-400">Memuat rekapitulasi...</span>
    </div>
  );

  if (!data) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <AlertCircle className="w-8 h-8 text-rose-400" />
      <span className="text-xs text-slate-400">Gagal memuat data rekapitulasi</span>
    </div>
  );

  const p = data.porsi, g = data.gender, a = data.alergi, gz = data.gizi, ps = data.posyandu, t = data.totals;
  const jenjangEntries = Object.entries(data.jenjangGroups).filter(([, grp]) => grp.siswaCount > 0 || grp.guru > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl"><FileBarChart className="w-6 h-6 text-emerald-400" /></div>
            <div>
              <h2 className="text-lg font-bold">Rekapitulasi PM</h2>
              <p className="text-xs text-slate-400">Rekapitulasi Penerima Manfaat</p>
            </div>
          </div>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export Excel
          </button>
        </div>
      </div>

      {/* === HITUNG PORSI === */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-lg text-white">
        <div className="flex items-center gap-2 mb-3"><UtensilsCrossed className="w-4 h-4 text-amber-400" /><h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Hitung Porsi</h4></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Porsi Kecil</span>
              <span className="text-2xl font-extrabold text-sky-300">{p.porsiKecil}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">TK/RA</span><span className="text-[10px] font-bold text-white">{p.siswaTKRA}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SD Kelas 1-3</span><span className="text-[10px] font-bold text-white">{p.siswaSDKelas123}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Balita 6-11 Bln</span><span className="text-[10px] font-bold text-white">{p.balita6_11}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Balita 12-60 Bln</span><span className="text-[10px] font-bold text-white">{p.balita12_60}</span></div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300">Porsi Besar</span>
              <span className="text-2xl font-extrabold text-orange-300">{p.porsiBesar}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Guru/Tendik</span><span className="text-[10px] font-bold text-white">{t.teachers}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SD Kelas 4-6</span><span className="text-[10px] font-bold text-white">{p.siswaSDKelas456}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SMP</span><span className="text-[10px] font-bold text-white">{p.siswaSMP}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SMA/SMK</span><span className="text-[10px] font-bold text-white">{p.siswaSMA}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Bumil</span><span className="text-[10px] font-bold text-white">{p.bumil}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Busui</span><span className="text-[10px] font-bold text-white">{p.busui}</span></div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex h-2.5 rounded-full overflow-hidden bg-white/10">
          {p.totalPenerimaAll > 0 && <>
            <div className="bg-gradient-to-r from-sky-400 to-sky-500 transition-all" style={{ width: `${(p.porsiKecil / p.totalPenerimaAll) * 100}%` }} />
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 transition-all" style={{ width: `${(p.porsiBesar / p.totalPenerimaAll) * 100}%` }} />
          </>}
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] text-slate-400">
          <span>Kecil {p.totalPenerimaAll > 0 ? ((p.porsiKecil / p.totalPenerimaAll) * 100).toFixed(0) : 0}%</span>
          <span className="font-bold text-white">Total Porsi: {p.totalPorsi} | Total Data: {p.totalPenerimaAll}</span>
          <span>Besar {p.totalPenerimaAll > 0 ? ((p.porsiBesar / p.totalPenerimaAll) * 100).toFixed(0) : 0}%</span>
        </div>
      </div>

      {/* Sub-tab toggle */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl">
        <button onClick={() => setTab('Sekolah')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${tab === 'Sekolah' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <School className="w-3.5 h-3.5" /><span>Rekap Sekolah</span>
        </button>
        <button onClick={() => setTab('3B')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${tab === '3B' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Heart className="w-3.5 h-3.5" /><span>Rekap 3B</span>
        </button>
      </div>

      {tab === 'Sekolah' ? (<>
        {/* === REKAP SEKOLAH === */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-2xl shadow-lg text-white">
            <div className="text-[10px] font-bold uppercase opacity-80">Total Sekolah</div>
            <h3 className="text-2xl font-extrabold mt-1">{t.students + t.teachers}</h3>
            <p className="text-[10px] opacity-75">Siswa + Guru/Tendik</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-[10px] font-bold text-blue-400 uppercase">Siswa</div>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{t.students}</h3>
            <p className="text-[10px] text-slate-400">L: {g.siswaL} | P: {g.siswaP}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-[10px] font-bold text-violet-400 uppercase">Guru/Tendik</div>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{t.teachers}</h3>
            <p className="text-[10px] text-slate-400">L: {g.guruL} | P: {g.guruP}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-[10px] font-bold text-rose-400 uppercase">Alergi</div>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{a.alergiSekolah}</h3>
            <p className="text-[10px] text-slate-400">{(t.students + t.teachers) > 0 ? ((a.alergiSekolah / (t.students + t.teachers)) * 100).toFixed(1) : 0}% dari sekolah</p>
          </div>
        </div>

        {/* Gender bars */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-3"><PieChart className="w-4 h-4 text-indigo-500" /><h4 className="text-xs font-bold text-slate-700">Distribusi Jenis Kelamin - Sekolah</h4></div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between mb-1"><span className="text-[10px] font-semibold text-emerald-600">Siswa</span><span className="text-[10px] text-slate-400">{g.siswaL} L | {g.siswaP} P</span></div>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">{g.siswaL + g.siswaP > 0 && <><div className="bg-blue-400" style={{ width: `${(g.siswaL / (g.siswaL + g.siswaP)) * 100}%` }} /><div className="bg-pink-300" style={{ width: `${(g.siswaP / (g.siswaL + g.siswaP)) * 100}%` }} /></>}</div>
              <div className="flex justify-between mt-0.5"><span className="text-[9px] text-blue-500 font-semibold">L {g.siswaL + g.siswaP > 0 ? ((g.siswaL / (g.siswaL + g.siswaP)) * 100).toFixed(0) : 0}%</span><span className="text-[9px] text-pink-400 font-semibold">P {g.siswaL + g.siswaP > 0 ? ((g.siswaP / (g.siswaL + g.siswaP)) * 100).toFixed(0) : 0}%</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-1"><span className="text-[10px] font-semibold text-violet-600">Guru/Tendik</span><span className="text-[10px] text-slate-400">{g.guruL} L | {g.guruP} P</span></div>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">{g.guruL + g.guruP > 0 && <><div className="bg-blue-400" style={{ width: `${(g.guruL / (g.guruL + g.guruP)) * 100}%` }} /><div className="bg-pink-300" style={{ width: `${(g.guruP / (g.guruL + g.guruP)) * 100}%` }} /></>}</div>
              <div className="flex justify-between mt-0.5"><span className="text-[9px] text-blue-500 font-semibold">L {g.guruL + g.guruP > 0 ? ((g.guruL / (g.guruL + g.guruP)) * 100).toFixed(0) : 0}%</span><span className="text-[9px] text-pink-400 font-semibold">P {g.guruL + g.guruP > 0 ? ((g.guruP / (g.guruL + g.guruP)) * 100).toFixed(0) : 0}%</span></div>
            </div>
          </div>
        </div>

        {/* Per Tingkatan Jenjang */}
        {jenjangEntries.length > 0 && jenjangEntries.map(([jenjang, group]) => (
          <div key={jenjang} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => setExpandedJenjang(prev => prev === jenjang ? null : jenjang)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold text-white ${jenjangColor(jenjang)}`}>{group.siswaCount}</div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-700">{jenjangLabel(jenjang)}</h4>
                  <p className="text-[10px] text-slate-400">{group.schools.length} sekolah · L: {group.L} | P: {group.P} · Guru: {group.guru}</p>
                </div>
              </div>
              {expandedJenjang === jenjang ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {expandedJenjang === jenjang && (
              <div className="border-t border-slate-100">
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-slate-50 text-slate-500"><th className="px-4 py-1.5 text-left font-semibold text-[10px]">Sekolah</th><th className="px-3 py-1.5 text-center font-semibold text-[10px]">Siswa</th><th className="px-3 py-1.5 text-center font-semibold text-[10px]">L</th><th className="px-3 py-1.5 text-center font-semibold text-[10px]">P</th><th className="px-3 py-1.5 text-center font-semibold text-[10px]">Guru</th></tr></thead>
                  <tbody>
                    {group.schools.map(([name, count]) => {
                      // Calculate L/P per school from jenjang students - use guruSchoolMap
                      const gC = data.guruSchoolMap[name] || 0;
                      return (<tr key={name} className="border-b border-slate-50 hover:bg-slate-50/50"><td className="px-4 py-2 font-medium text-slate-600">{name}</td><td className="px-3 py-2 text-center font-bold">{count}</td><td className="px-3 py-2 text-center text-blue-500">-</td><td className="px-3 py-2 text-center text-pink-400">-</td><td className="px-3 py-2 text-center text-violet-500">{gC}</td></tr>);
                    })}
                    <tr className="bg-slate-50/80 font-bold"><td className="px-4 py-2 text-slate-700 text-[10px]">SUBTOTAL</td><td className="px-3 py-2 text-center">{group.siswaCount}</td><td className="px-3 py-2 text-center text-blue-600">{group.L}</td><td className="px-3 py-2 text-center text-pink-500">{group.P}</td><td className="px-3 py-2 text-center text-violet-600">{group.guru}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {/* Total semua jenjang */}
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/60 p-3 rounded-2xl border border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><School className="w-4 h-4 text-emerald-600" /><span className="text-[10px] font-bold text-emerald-700 uppercase">Total Seluruh Sekolah</span></div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-slate-700">Siswa: <span className="text-emerald-600">{t.students}</span></span>
              <span className="text-blue-500">L: {g.siswaL}</span>
              <span className="text-pink-500">P: {g.siswaP}</span>
              <span className="text-violet-500">Guru: {t.teachers}</span>
            </div>
          </div>
        </div>

        {/* BMI Gizi */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-teal-500" /><h4 className="text-xs font-bold text-slate-700">Rekapitulasi Status Gizi Siswa (BMI)</h4></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="bg-orange-50 border border-orange-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-orange-600">{gz.kurang}</div><div className="text-[10px] font-semibold text-orange-500">Kurus (&lt;18.5)</div><div className="mt-1.5 h-1.5 bg-orange-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{ width: t.students > 0 ? (gz.kurang / t.students) * 100 + '%' : '0%' }} /></div></div>
            <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-emerald-600">{gz.normal}</div><div className="text-[10px] font-semibold text-emerald-500">Normal (18.5-25)</div><div className="mt-1.5 h-1.5 bg-emerald-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: t.students > 0 ? (gz.normal / t.students) * 100 + '%' : '0%' }} /></div></div>
            <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-rose-600">{gz.lebih}</div><div className="text-[10px] font-semibold text-rose-500">Gemuk (&gt;25)</div><div className="mt-1.5 h-1.5 bg-rose-200 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: t.students > 0 ? (gz.lebih / t.students) * 100 + '%' : '0%' }} /></div></div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-slate-400">{gz.noData}</div><div className="text-[10px] font-semibold text-slate-400">Belum Ada Data BB/TB</div><div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-400 rounded-full" style={{ width: t.students > 0 ? (gz.noData / t.students) * 100 + '%' : '0%' }} /></div></div>
          </div>
        </div>
      </>) : (<>
        {/* === REKAP 3B === */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-2xl shadow-lg text-white">
            <div className="text-[10px] font-bold uppercase opacity-80">Total Penerima 3B</div>
            <h3 className="text-2xl font-extrabold mt-1">{t.beneficiaries3b}</h3>
            <p className="text-[10px] opacity-75">Bumil + Busui + Balita</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-rose-400" /><span className="text-[10px] font-bold text-rose-500 uppercase">Bumil</span></div>
            <h3 className="text-2xl font-extrabold text-slate-800">{p.bumil}</h3>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-violet-400" /><span className="text-[10px] font-bold text-violet-500 uppercase">Busui</span></div>
            <h3 className="text-2xl font-extrabold text-slate-800">{p.busui}</h3>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-[10px] font-bold text-cyan-500 uppercase">Balita</span></div>
            <h3 className="text-2xl font-extrabold text-slate-800">{ps.balita}</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Jenis Kelamin</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 text-center p-2 bg-blue-50 rounded-xl"><div className="text-lg font-extrabold text-blue-600">{g.b3bL}</div><div className="text-[10px] text-blue-500 font-semibold">Laki-laki</div></div>
              <div className="flex-1 text-center p-2 bg-pink-50 rounded-xl"><div className="text-lg font-extrabold text-pink-500">{g.b3bP}</div><div className="text-[10px] text-pink-400 font-semibold">Perempuan</div></div>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 mt-2">{g.b3bL + g.b3bP > 0 && <><div className="bg-blue-400" style={{ width: `${(g.b3bL / (g.b3bL + g.b3bP)) * 100}%` }} /><div className="bg-pink-300" style={{ width: `${(g.b3bP / (g.b3bL + g.b3bP)) * 100}%` }} /></>}</div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Posyandu Aktif</div>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-2">{ps.list.length}</h3>
            <p className="text-[10px] text-slate-400">melayani penerima 3B</p>
          </div>
        </div>
        {ps.list.length > 0 && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-3"><Heart className="w-4 h-4 text-rose-500" /><h4 className="text-xs font-bold text-slate-700">Rekapitulasi Penerima 3B Per Posyandu</h4></div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-amber-50 text-amber-700"><th className="px-3 py-2 text-left font-semibold border-b border-amber-200/60">Posyandu</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Bumil</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Busui</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Balita</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">L</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">P</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Total</th></tr></thead>
                <tbody>
                  {ps.list.map((d) => (
                    <tr key={d.name} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-medium text-slate-700">{d.name}</td>
                      <td className="px-3 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px]">{d.bumil}</span></td>
                      <td className="px-3 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-bold text-[10px]">{d.busui}</span></td>
                      <td className="px-3 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 font-bold text-[10px]">{d.balita}</span></td>
                      <td className="px-3 py-2 text-center text-blue-500">{d.L}</td>
                      <td className="px-3 py-2 text-center text-pink-400">{d.P}</td>
                      <td className="px-3 py-2 text-center font-extrabold text-slate-800">{d.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50/50 font-bold"><td className="px-3 py-2 text-amber-800">TOTAL</td><td className="px-3 py-2 text-center text-rose-600">{p.bumil}</td><td className="px-3 py-2 text-center text-violet-600">{p.busui}</td><td className="px-3 py-2 text-center text-cyan-600">{ps.balita}</td><td className="px-3 py-2 text-center text-blue-600">{g.b3bL}</td><td className="px-3 py-2 text-center text-pink-500">{g.b3bP}</td><td className="px-3 py-2 text-center text-amber-800">{t.beneficiaries3b}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>)}
    </div>
  );
}
