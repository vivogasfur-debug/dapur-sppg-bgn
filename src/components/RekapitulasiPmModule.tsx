'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart, School, Heart, Users, GraduationCap, UserCheck,
  PieChart, Activity, UtensilsCrossed, Loader2, Download, AlertCircle,
  ChevronDown, ChevronUp, Camera, TrendingUp, History, Clock,
  Calendar, Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Minus, Eye, Database, ExternalLink, Check, Copy
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface RekapData {
  porsi: { siswaTKRA: number; siswaSDKelas123: number; siswaSDKelas456: number; siswaSMP: number; siswaSMA: number; bumil: number; busui: number; balita6_11: number; balita12_60: number; porsiKecil: number; porsiBesar: number; totalPorsi: number; totalPenerimaAll: number; };
  gender: { siswaL: number; siswaP: number; guruL: number; guruP: number; b3bL: number; b3bP: number };
  alergi: { alergiSekolah: number; alergi3b: number; alergiTotal: number };
  jenjangGroups: Record<string, { siswaCount: number; L: number; P: number; guru: number; schools: [string, number][] }>;
  gizi: { kurang: number; normal: number; lebih: number; noData: number };
  posyandu: { list: { name: string; total: number; bumil: number; busui: number; balita: number; L: number; P: number }[]; balita: number; balita_lt6: number; balita_gt60: number; balita_noCat: number; };
  guruSchoolMap: Record<string, number>;
  totals: { students: number; teachers: number; beneficiaries3b: number };
}

interface Snapshot {
  id: string; period_start: string; period_end: string; period_label: string;
  snapshot_data: RekapData; students_total: number; teachers_total: number;
  b3b_total: number; porsi_kecil: number; porsi_besar: number; total_porsi: number;
  gizi_kurang: number; gizi_normal: number; gizi_lebih: number;
  created_at: string; created_by: string; notes: string | null;
}

interface AuditEntry {
  id: string; table_name: string; record_id: string; action: string;
  old_data: any; new_data: any; changed_fields: string[] | null;
  performed_by: string; created_at: string;
}

const jenjangColor = (j: string) => { switch (j) { case 'TK': return 'bg-pink-500'; case 'SD': return 'bg-blue-500'; case 'SMP': return 'bg-amber-500'; case 'SMA': return 'bg-violet-500'; default: return 'bg-slate-400'; } };
const jenjangLabel = (j: string) => { switch (j) { case 'TK': return 'TK / RA'; case 'SD': return 'SD / MI'; case 'SMP': return 'SMP / MTs'; case 'SMA': return 'SMA / SMK / MA'; default: return 'Lainnya'; } };

const PERIOD_START = new Date(2026, 7, 31, 0, 0, 0, 0); // 31 Agustus 2026
const generatePeriods = (startDate: Date, count: number) => {
  const periods: { start: string; end: string; label: string; index: number }[] = [];
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  for (let i = 0; i < count; i++) {
    const start = new Date(startDate); start.setDate(start.getDate() + i * 14);
    const end = new Date(start); end.setDate(end.getDate() + 13);
    const label = `Periode ${i + 1}: ${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
    periods.push({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], label, index: i + 1 });
  }
  return periods;
};

const getCurrentPeriodIndex = (periods: { start: string; end: string }[]) => {
  const today = new Date().toISOString().split('T')[0];
  return periods.findIndex(p => today >= p.start && today <= p.end);
};

const auditActionColor = (action: string) => { switch (action) { case 'INSERT': return 'bg-emerald-100 text-emerald-700'; case 'UPDATE': return 'bg-blue-100 text-blue-700'; case 'DELETE': return 'bg-rose-100 text-rose-700'; default: return 'bg-slate-100 text-slate-600'; } };
const auditActionLabel = (action: string) => { switch (action) { case 'INSERT': return 'Tambah'; case 'UPDATE': return 'Ubah'; case 'DELETE': return 'Hapus'; default: return action; } };
const auditTableLabel = (t: string) => { switch (t) { case 'students': return 'Siswa'; case 'teachers': return 'Guru'; case 'beneficiaries_3b': return '3B'; default: return t; } };

export default function RekapitulasiPmModule({ activePeriodId }: { activePeriodId?: string | null } = {}) {
  const [data, setData] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mainTab, setMainTab] = useState<'live' | 'periode' | 'trend' | 'audit'>('live');
  const [subTab, setSubTab] = useState<'Sekolah' | '3B'>('Sekolah');
  const [exporting, setExporting] = useState(false);
  const [expandedJenjang, setExpandedJenjang] = useState<string | null>('TK');

  // Snapshot state
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapLoading, setSnapLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [periods] = useState(() => {
    return generatePeriods(PERIOD_START, 26);
  });
  const [selPeriod, setSelPeriod] = useState(0);
  const [compA, setCompA] = useState<number | null>(null);
  const [compB, setCompB] = useState<number | null>(null);

  // Audit state
  const [auditData, setAuditData] = useState<AuditEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTable, setAuditTable] = useState('Semua');
  const [auditOffset, setAuditOffset] = useState(0);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  // Fix selPeriod init
  useEffect(() => {
    const idx = getCurrentPeriodIndex(periods);
    if (idx >= 0) setSelPeriod(idx);
  }, [periods]);

  const fetchData = useCallback(async () => {
    try { const qp = activePeriodId ? `?period_id=${activePeriodId}` : ''; const res = await fetch(`/api/rekap-pm${qp}`); const json = await res.json(); if (json.error) throw new Error(json.error); setData(json as RekapData); } catch {} finally { setLoading(false); }
  }, [activePeriodId]);

  const fetchSnapshots = useCallback(async () => {
    setSnapLoading(true);
    try {
      const res = await fetch('/api/pm-snapshots'); const json = await res.json();
      if (json.error && (json.error.includes('could not find') || json.error.includes('does not exist') || json.error.includes('relation'))) {
        setSetupNeeded(true);
      } else if (!json.error) {
        setSnapshots(Array.isArray(json) ? json : []);
        setSetupNeeded(false);
      }
    } catch { } finally { setSnapLoading(false); }
  }, []);

  const fetchAudit = useCallback(async (offset = 0) => {
    setAuditLoading(true);
    try {
      let url = `/api/pm-audit-log?limit=50&offset=${offset}`;
      if (auditTable !== 'Semua') url += `&table=${auditTable === 'Siswa' ? 'students' : auditTable === 'Guru' ? 'teachers' : 'beneficiaries_3b'}`;
      const res = await fetch(url); const json = await res.json();
      if (json.data) { setAuditData(offset === 0 ? json.data : [...auditData, ...json.data]); setAuditTotal(json.total); }
    } catch {} finally { setAuditLoading(false); }
  }, [auditTable]);

  useEffect(() => { fetchData(); fetchSnapshots(); }, [fetchData, fetchSnapshots]);
  useEffect(() => { if (mainTab === 'periode') fetchSnapshots(); }, [mainTab, fetchSnapshots]);
  useEffect(() => { if (mainTab === 'audit') { setAuditData([]); fetchAudit(0); } }, [mainTab, auditTable]);

  const handleCreateSnapshot = async () => {
    const period = periods[selPeriod]; if (!period) return; setCreating(true);
    try { const body: any = { periodStart: period.start, periodEnd: period.end, periodLabel: period.label }; if (activePeriodId) body.periodId = activePeriodId; const res = await fetch('/api/pm-snapshots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const json = await res.json(); if (json.error) alert(json.error); else await fetchSnapshots(); } catch {} finally { setCreating(false); }
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (!confirm('Hapus snapshot ini?')) return;
    try { await fetch('/api/pm-snapshots', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); await fetchSnapshots(); } catch {}
  };

  const handleExport = async () => {
    if (!data) return; setExporting(true);
    try {
      const ExcelJSMod = (await import('exceljs') as any).default; const wb = new ExcelJSMod.Workbook(); const ws = wb.addWorksheet('Rekapitulasi PM');
      ws.columns = [{ header: 'Kategori', key: 'kat', width: 20 }, { header: 'Sub Kategori', key: 'sub', width: 25 }, { header: 'Jumlah', key: 'jml', width: 12 }, { header: 'L', key: 'l', width: 8 }, { header: 'P', key: 'p', width: 8 }];
      const p = data.porsi, g = data.gender;
      ws.addRows([
        { kat: 'PORSI KECIL', sub: 'TK/RA', jml: p.siswaTKRA, l: '-', p: '-' }, { kat: 'PORSI KECIL', sub: 'SD Kelas 1-3', jml: p.siswaSDKelas123, l: '-', p: '-' }, { kat: 'PORSI KECIL', sub: 'Balita 6-11 Bln', jml: p.balita6_11, l: '-', p: '-' }, { kat: 'PORSI KECIL', sub: 'Balita 12-60 Bln', jml: p.balita12_60, l: '-', p: '-' }, { kat: 'TOTAL PORSI KECIL', sub: '', jml: p.porsiKecil, l: g.siswaL, p: g.siswaP }, { kat: 'PORSI BESAR', sub: 'Guru/Tendik', jml: data.totals.teachers, l: g.guruL, p: g.guruP }, { kat: 'PORSI BESAR', sub: 'SD Kelas 4-6', jml: p.siswaSDKelas456, l: '-', p: '-' }, { kat: 'PORSI BESAR', sub: 'SMP', jml: p.siswaSMP, l: '-', p: '-' }, { kat: 'PORSI BESAR', sub: 'SMA/SMK', jml: p.siswaSMA, l: '-', p: '-' }, { kat: 'PORSI BESAR', sub: 'Bumil', jml: p.bumil, l: '-', p: '-' }, { kat: 'PORSI BESAR', sub: 'Busui', jml: p.busui, l: '-', p: '-' }, { kat: 'TOTAL PORSI BESAR', sub: '', jml: p.porsiBesar, l: '-', p: '-' }, { kat: 'GRAND TOTAL', sub: '', jml: p.totalPorsi, l: '-', p: '-' }, { kat: '', sub: '', jml: '', l: '', p: '' }, { kat: 'TOTAL DATA', sub: 'Seluruh Penerima', jml: p.totalPenerimaAll, l: '-', p: '-' },
      ]);
      const buf = await wb.xlsx.writeBuffer(); const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'Rekapitulasi_PM.xlsx'; a.click(); URL.revokeObjectURL(url);
    } catch {} finally { setExporting(false); }
  };

  if (loading) return (<div className="min-h-[60vh] flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /><span className="text-xs text-slate-400">Memuat rekapitulasi...</span></div>);

  // Setup wizard: show if tables don't exist
  if (setupNeeded) {
    const handleCopySql = () => { navigator.clipboard.writeText(SETUP_SQL); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const handleCheckAgain = () => { setSetupNeeded(false); fetchSnapshots(); };
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
            <Database className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Setup Database Diperlukan</h2>
            <p className="text-sm text-slate-500 mt-1">Tabel <b>pm_snapshots</b> dan <b>pm_audit_log</b> belum dibuat di Supabase. Ikuti langkah berikut:</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">Buka Supabase SQL Editor</p>
                <a href="https://supabase.com/dashboard/project/zwbspstsbpzsnphdohko/sql" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mt-0.5">
                  Klik di sini untuk membuka <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">Salin & Jalankan SQL</p>
                <p className="text-xs text-slate-500 mt-0.5">Salin SQL di bawah, tempel di SQL Editor, lalu klik <b>Run</b></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">Klik &quot;Cek Ulang&quot; di bawah</p>
                <p className="text-xs text-slate-500 mt-0.5">Setelah SQL berhasil, klik tombol untuk memverifikasi</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-[11px] overflow-auto max-h-64 font-mono leading-relaxed text-left">{SETUP_SQL}</pre>
            <button onClick={handleCopySql} className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors" title="Salin SQL">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCheckAgain} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Cek Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return (<div className="min-h-[60vh] flex flex-col items-center justify-center gap-3"><AlertCircle className="w-8 h-8 text-rose-400" /><span className="text-xs text-slate-400">Gagal memuat data rekapitulasi</span></div>);

  const p = data.porsi, g = data.gender, a = data.alergi, gz = data.gizi, ps = data.posyandu, t = data.totals;
  const jenjangEntries = Object.entries(data.jenjangGroups).filter(([, grp]) => grp.siswaCount > 0 || grp.guru > 0);
  const snapshotExists = (periodStart: string) => snapshots.some(s => s.period_start === periodStart);
  const currentPeriodIdx = getCurrentPeriodIndex(periods);

  const trendData = snapshots.map(s => ({ name: s.period_label.length > 20 ? s.period_label.substring(0, 20) + '...' : s.period_label, Siswa: s.students_total, Guru: s.teachers_total, '3B': s.b3b_total, 'Porsi Kecil': s.porsi_kecil, 'Porsi Besar': s.porsi_besar }));
  const giziTrendData = snapshots.map(s => ({ name: s.period_label.length > 20 ? s.period_label.substring(0, 20) + '...' : s.period_label, Kurang: s.gizi_kurang, Normal: s.gizi_normal, Gemuk: s.gizi_lebih }));

  const snapA = compA !== null ? snapshots[compA] : null;
  const snapB = compB !== null ? snapshots[compB] : null;
  const compFields = snapA && snapB ? [
    { label: 'Total Siswa', a: snapA.students_total, b: snapB.students_total }, { label: 'Total Guru', a: snapA.teachers_total, b: snapB.teachers_total }, { label: 'Total 3B', a: snapA.b3b_total, b: snapB.b3b_total },
    { label: 'Porsi Kecil', a: snapA.porsi_kecil, b: snapB.porsi_kecil }, { label: 'Porsi Besar', a: snapA.porsi_besar, b: snapB.porsi_besar }, { label: 'Total Porsi', a: snapA.total_porsi, b: snapB.total_porsi },
    { label: 'Gizi Kurang', a: snapA.gizi_kurang, b: snapB.gizi_kurang }, { label: 'Gizi Normal', a: snapA.gizi_normal, b: snapB.gizi_normal }, { label: 'Gizi Gemuk', a: snapA.gizi_lebih, b: snapB.gizi_lebih },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="p-2.5 bg-emerald-500/20 rounded-xl"><FileBarChart className="w-6 h-6 text-emerald-400" /></div><div><h2 className="text-lg font-bold">Rekapitulasi PM</h2><p className="text-xs text-slate-400">Rekapitulasi Penerima Manfaat &middot; Audit &amp; Trend</p></div></div>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50">{exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export</button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
        {([['live', FileBarChart, 'Rekap Live'], ['periode', Camera, 'Periode'], ['trend', TrendingUp, 'Trend'], ['audit', History, 'Audit']] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setMainTab(key as any)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${mainTab === key ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Icon className="w-3.5 h-3.5" />{label}</button>
        ))}
      </div>

      {/* ===== TAB: REKAP LIVE ===== */}
      {mainTab === 'live' && (<>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-2 mb-3"><UtensilsCrossed className="w-4 h-4 text-amber-400" /><h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Hitung Porsi</h4></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10"><div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Porsi Kecil</span><span className="text-2xl font-extrabold text-sky-300">{p.porsiKecil}</span></div><div className="space-y-1.5"><div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">TK/RA</span><span className="text-[10px] font-bold text-white">{p.siswaTKRA}</span></div><div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SD Kelas 1-3</span><span className="text-[10px] font-bold text-white">{p.siswaSDKelas123}</span></div><div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Balita 6-11 Bln</span><span className="text-[10px] font-bold text-white">{p.balita6_11}</span></div><div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Balita 12-60 Bln</span><span className="text-[10px] font-bold text-white">{p.balita12_60}</span></div></div></div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10"><div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold uppercase tracking-wider text-orange-300">Porsi Besar</span><span className="text-2xl font-extrabold text-orange-300">{p.porsiBesar}</span></div><div className="space-y-1.5"><div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Guru/Tendik</span><span className="text-[10px] font-bold text-white">{t.teachers}</span></div><div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SD Kelas 4-6</span><span className="text-[10px] font-bold text-white">{p.siswaSDKelas456}</span></div><div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SMP</span><span className="text-[10px] font-bold text-white">{p.siswaSMP}</span></div><div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SMA/SMK</span><span className="text-[10px] font-bold text-white">{p.siswaSMA}</span></div><div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Bumil</span><span className="text-[10px] font-bold text-white">{p.bumil}</span></div><div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Busui</span><span className="text-[10px] font-bold text-white">{p.busui}</span></div></div></div>
          </div>
          <div className="mt-3 flex h-2.5 rounded-full overflow-hidden bg-white/10">{p.totalPenerimaAll > 0 && <><div className="bg-gradient-to-r from-sky-400 to-sky-500" style={{ width: `${(p.porsiKecil / p.totalPenerimaAll) * 100}%` }} /><div className="bg-gradient-to-r from-orange-400 to-orange-500" style={{ width: `${(p.porsiBesar / p.totalPenerimaAll) * 100}%` }} /></>}</div>
          <div className="mt-1.5 flex justify-between text-[9px] text-slate-400"><span>Kecil {p.totalPenerimaAll > 0 ? ((p.porsiKecil / p.totalPenerimaAll) * 100).toFixed(0) : 0}%</span><span className="font-bold text-white">Total Porsi: {p.totalPorsi} | Total Data: {p.totalPenerimaAll}</span><span>Besar {p.totalPenerimaAll > 0 ? ((p.porsiBesar / p.totalPenerimaAll) * 100).toFixed(0) : 0}%</span></div>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl"><button onClick={() => setSubTab('Sekolah')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${subTab === 'Sekolah' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}><School className="w-3.5 h-3.5" />Sekolah</button><button onClick={() => setSubTab('3B')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${subTab === '3B' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}><Heart className="w-3.5 h-3.5" />3B</button></div>

        {subTab === 'Sekolah' ? (<>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-2xl shadow-lg text-white"><div className="text-[10px] font-bold uppercase opacity-80">Total Sekolah</div><h3 className="text-2xl font-extrabold mt-1">{t.students + t.teachers}</h3><p className="text-[10px] opacity-75">Siswa + Guru</p></div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200"><div className="text-[10px] font-bold text-blue-400 uppercase">Siswa</div><h3 className="text-2xl font-extrabold text-slate-800 mt-1">{t.students}</h3><p className="text-[10px] text-slate-400">L: {g.siswaL} | P: {g.siswaP}</p></div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200"><div className="text-[10px] font-bold text-violet-400 uppercase">Guru/Tendik</div><h3 className="text-2xl font-extrabold text-slate-800 mt-1">{t.teachers}</h3><p className="text-[10px] text-slate-400">L: {g.guruL} | P: {g.guruP}</p></div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200"><div className="text-[10px] font-bold text-rose-400 uppercase">Alergi</div><h3 className="text-2xl font-extrabold text-rose-600 mt-1">{a.alergiSekolah}</h3><p className="text-[10px] text-slate-400">{(t.students + t.teachers) > 0 ? ((a.alergiSekolah / (t.students + t.teachers)) * 100).toFixed(1) : 0}%</p></div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200"><div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-teal-500" /><h4 className="text-xs font-bold text-slate-700">Status Gizi Siswa (BMI)</h4></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-2"><div className="bg-orange-50 border border-orange-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-orange-600">{gz.kurang}</div><div className="text-[10px] font-semibold text-orange-500">Kurus</div></div><div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-emerald-600">{gz.normal}</div><div className="text-[10px] font-semibold text-emerald-500">Normal</div></div><div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-rose-600">{gz.lebih}</div><div className="text-[10px] font-semibold text-rose-500">Gemuk</div></div><div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-slate-400">{gz.noData}</div><div className="text-[10px] font-semibold text-slate-400">Belum Ada Data</div></div></div></div>
        </>) : (<>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-2xl shadow-lg text-white"><div className="text-[10px] font-bold uppercase opacity-80">Total 3B</div><h3 className="text-2xl font-extrabold mt-1">{t.beneficiaries3b}</h3></div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200"><div className="text-[10px] font-bold text-rose-500 uppercase mb-1">Bumil</div><h3 className="text-2xl font-extrabold text-slate-800">{p.bumil}</h3></div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200"><div className="text-[10px] font-bold text-violet-500 uppercase mb-1">Busui</div><h3 className="text-2xl font-extrabold text-slate-800">{p.busui}</h3></div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200"><div className="text-[10px] font-bold text-cyan-500 uppercase mb-1">Balita</div><h3 className="text-2xl font-extrabold text-slate-800">{ps.balita}</h3></div>
          </div>
          {ps.list.length > 0 && (<div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200"><div className="flex items-center gap-2 mb-3"><Heart className="w-4 h-4 text-rose-500" /><h4 className="text-xs font-bold text-slate-700">Per Posyandu</h4></div><div className="overflow-x-auto"><table className="w-full text-xs border-collapse"><thead><tr className="bg-amber-50 text-amber-700"><th className="px-3 py-2 text-left font-semibold">Posyandu</th><th className="px-3 py-2 text-center font-semibold">Bumil</th><th className="px-3 py-2 text-center font-semibold">Busui</th><th className="px-3 py-2 text-center font-semibold">Balita</th><th className="px-3 py-2 text-center font-semibold">Total</th></tr></thead><tbody>{ps.list.map(d => (<tr key={d.name} className="border-b border-slate-100"><td className="px-3 py-2 font-medium text-slate-700">{d.name}</td><td className="px-3 py-2 text-center text-rose-600 font-bold">{d.bumil}</td><td className="px-3 py-2 text-center text-violet-600 font-bold">{d.busui}</td><td className="px-3 py-2 text-center text-cyan-600 font-bold">{d.balita}</td><td className="px-3 py-2 text-center font-extrabold text-slate-800">{d.total}</td></tr>))}</tbody></table></div></div>)}
        </>)}
      </>)}

      {/* ===== TAB: PERIODE & SNAPSHOT ===== */}
      {mainTab === 'periode' && (<div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-3"><Camera className="w-4 h-4 text-emerald-500" /><h4 className="text-xs font-bold text-slate-700">Buat Snapshot Periode</h4></div>
          <p className="text-[10px] text-slate-400 mb-3">Bekukan data rekapitulasi saat ini sebagai snapshot permanen untuk periode tertentu.</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <button onClick={() => setSelPeriod(Math.max(0, selPeriod - 1))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
              <select value={selPeriod} onChange={e => setSelPeriod(Number(e.target.value))} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50">{periods.map((per, idx) => <option key={idx} value={idx}>{per.label}{idx === currentPeriodIdx ? ' (Sekarang)' : ''}{snapshotExists(per.start) ? ' [Tersimpan]' : ''}</option>)}</select>
              <button onClick={() => setSelPeriod(Math.min(periods.length - 1, selPeriod + 1))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <button onClick={handleCreateSnapshot} disabled={creating || snapshotExists(periods[selPeriod]?.start)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50">{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Bekukan Data</button>
          </div>
          {snapshotExists(periods[selPeriod]?.start) && <p className="text-[10px] text-amber-600 font-semibold mt-2">Snapshot untuk periode ini sudah tersimpan.</p>}
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Database className="w-4 h-4 text-indigo-500" /><h4 className="text-xs font-bold text-slate-700">Snapshot Tersimpan ({snapshots.length})</h4></div><button onClick={() => fetchSnapshots()} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><RefreshCw className="w-3.5 h-3.5" /></button></div>
          {snapLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div> : snapshots.length === 0 ? <div className="text-center py-8 text-xs text-slate-400 italic">Belum ada snapshot.</div> : (
            <div className="overflow-x-auto"><table className="w-full text-xs border-collapse"><thead><tr className="bg-slate-50 text-slate-500"><th className="px-3 py-2 text-left font-semibold">Periode</th><th className="px-3 py-2 text-center font-semibold">Siswa</th><th className="px-3 py-2 text-center font-semibold">Guru</th><th className="px-3 py-2 text-center font-semibold">3B</th><th className="px-3 py-2 text-center font-semibold">Porsi</th><th className="px-3 py-2 text-center font-semibold">Dibuat</th><th className="px-3 py-2 text-center font-semibold">Aksi</th></tr></thead><tbody>{snapshots.map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="px-3 py-2 font-medium text-slate-700">{s.period_label}</td><td className="px-3 py-2 text-center font-bold text-blue-600">{s.students_total}</td><td className="px-3 py-2 text-center font-bold text-violet-600">{s.teachers_total}</td><td className="px-3 py-2 text-center font-bold text-amber-600">{s.b3b_total}</td><td className="px-3 py-2 text-center font-bold text-emerald-600">{s.total_porsi}</td><td className="px-3 py-2 text-center text-slate-400">{new Date(s.created_at).toLocaleDateString('id-ID')}</td><td className="px-3 py-2 text-center"><button onClick={() => handleDeleteSnapshot(s.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button></td></tr>))}</tbody></table></div>
          )}
        </div>

        {snapshots.length >= 2 && (<div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-blue-500" /><h4 className="text-xs font-bold text-slate-700">Perbandingan 2 Periode</h4></div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <select value={compA ?? ''} onChange={e => setCompA(e.target.value ? Number(e.target.value) : null)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"><option value="">Pilih Periode A</option>{snapshots.map((s, i) => <option key={i} value={i}>{s.period_label}</option>)}</select>
            <select value={compB ?? ''} onChange={e => setCompB(e.target.value ? Number(e.target.value) : null)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"><option value="">Pilih Periode B</option>{snapshots.map((s, i) => <option key={i} value={i}>{s.period_label}</option>)}</select>
          </div>
          {compFields.length > 0 && (<div className="overflow-x-auto"><table className="w-full text-xs border-collapse"><thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left font-semibold">Metrik</th><th className="px-3 py-2 text-center font-semibold">{snapA?.period_label}</th><th className="px-3 py-2 text-center font-semibold">{snapB?.period_label}</th><th className="px-3 py-2 text-center font-semibold">+/-</th><th className="px-3 py-2 text-center font-semibold">%</th></tr></thead><tbody>{compFields.map(f => { const diff = f.b - f.a; const pct = f.a > 0 ? ((diff / f.a) * 100).toFixed(1) : '-'; return (<tr key={f.label} className="border-b border-slate-100"><td className="px-3 py-2 font-medium text-slate-700">{f.label}</td><td className="px-3 py-2 text-center text-blue-600 font-bold">{f.a}</td><td className="px-3 py-2 text-center text-violet-600 font-bold">{f.b}</td><td className={`px-3 py-2 text-center font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-400'}`}>{diff > 0 ? '+' : ''}{diff}</td><td className={`px-3 py-2 text-center font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-400'}`}>{pct !== '-' ? (Number(pct) > 0 ? '+' : '') + pct + '%' : '-'}</td></tr>); })}</tbody></table></div>)}
        </div>)}
      </div>)}

      {/* ===== TAB: TREND & GRAFIK ===== */}
      {mainTab === 'trend' && (<div className="space-y-4">
        {snapshots.length < 2 ? (<div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center"><TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" /><h3 className="text-sm font-bold text-slate-600 mb-1">Butuh Minimal 2 Snapshot</h3><p className="text-xs text-slate-400">Buat snapshot di tab Periode terlebih dahulu.</p></div>) : (<>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200"><div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-emerald-500" /><h4 className="text-xs font-bold text-slate-700">Trend Jumlah Penerima Manfaat</h4></div><ResponsiveContainer width="100%" height={300}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line type="monotone" dataKey="Siswa" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} /><Line type="monotone" dataKey="Guru" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} /><Line type="monotone" dataKey="3B" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200"><div className="flex items-center gap-2 mb-3"><UtensilsCrossed className="w-4 h-4 text-amber-500" /><h4 className="text-xs font-bold text-slate-700">Trend Porsi per Periode</h4></div><ResponsiveContainer width="100%" height={300}><BarChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Porsi Kecil" fill="#38bdf8" radius={[4,4,0,0]} /><Bar dataKey="Porsi Besar" fill="#fb923c" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200"><div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-teal-500" /><h4 className="text-xs font-bold text-slate-700">Trend Status Gizi per Periode</h4></div><ResponsiveContainer width="100%" height={300}><BarChart data={giziTrendData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Kurang" stackId="gizi" fill="#f97316" /><Bar dataKey="Normal" stackId="gizi" fill="#10b981" /><Bar dataKey="Gemuk" stackId="gizi" fill="#ef4444" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div>
        </>)}
      </div>)}

      {/* ===== TAB: AUDIT TRAIL ===== */}
      {mainTab === 'audit' && (<div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><History className="w-4 h-4 text-indigo-500" /><h4 className="text-xs font-bold text-slate-700">Riwayat Perubahan Data PM</h4></div><select value={auditTable} onChange={e => { setAuditTable(e.target.value); setAuditOffset(0); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"><option value="Semua">Semua Tabel</option><option value="Siswa">Siswa</option><option value="Guru">Guru</option><option value="3B">3B</option></select></div>
          {auditLoading && auditData.length === 0 ? <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div> : auditData.length === 0 ? <div className="text-center py-8 text-xs text-slate-400 italic">Belum ada catatan perubahan.</div> : (
            <div className="space-y-2">
              {auditData.map(entry => (<div key={entry.id} className="border border-slate-100 rounded-xl overflow-hidden"><button onClick={() => setExpandedAudit(prev => prev === entry.id ? null : entry.id)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50/80 text-left"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${auditActionColor(entry.action)}`}>{auditActionLabel(entry.action)}</span><span className="text-[10px] font-semibold text-slate-600">{auditTableLabel(entry.table_name)}</span><span className="text-[10px] text-slate-400 truncate flex-1">ID: {entry.record_id.substring(0, 8)}...</span>{entry.changed_fields && entry.changed_fields.length > 0 && <span className="text-[9px] text-slate-400 hidden sm:inline">{entry.changed_fields.join(', ')}</span>}<span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(entry.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>{expandedAudit === entry.id ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}</button>{expandedAudit === entry.id && (<div className="border-t border-slate-100 px-3 py-3 bg-slate-50/50"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{entry.old_data && (<div><div className="text-[10px] font-bold text-rose-500 uppercase mb-1">Data Sebelum</div><pre className="text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 overflow-x-auto max-h-40">{JSON.stringify(entry.old_data, null, 2)}</pre></div>)}{entry.new_data && (<div><div className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Data Sesudah</div><pre className="text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 overflow-x-auto max-h-40">{JSON.stringify(entry.new_data, null, 2)}</pre></div>)}</div></div>)}</div>))}
              {auditData.length < auditTotal && <button onClick={() => { const next = auditOffset + 50; setAuditOffset(next); fetchAudit(next); }} disabled={auditLoading} className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50">{auditLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Muat lebih banyak (${auditTotal - auditData.length} lagi)`}</button>}
            </div>
          )}
        </div>
      </div>)}
    </div>
  );
}
