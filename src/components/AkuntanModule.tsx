'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Trash2, Pencil, Loader2, Receipt, Copy, Check, ExternalLink,
  Search, X, Package, Users, GraduationCap, Baby, RotateCcw,
  Wallet, ArrowUpRight, ArrowDownRight, CircleCheck, CircleX, Clock,
  AlertCircle, Filter, Link2
} from 'lucide-react';

// === TYPES ===
interface Pembayaran {
  id: string; jenis: string; tanggal: string; bulan: string | null;
  tahun: string | null; penerima: string; keterangan: string | null;
  jumlah: number; status: string; catatan: string | null; created_at: string; stock_tx_id: string | null;
}

interface Summary {
  [key: string]: { total: number; lunas: number; belum: number; batal: number; count: number };
}

// === CONSTANTS ===
const JENIS_CONFIG = {
  barang_masuk:     { label: 'Barang Masuk',         icon: Package,      color: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200', desc: 'Pembayaran supplier & barang' },
  gaji_relawan:     { label: 'Gaji Relawan',          icon: Users,        color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', desc: 'Honorarium relawan lapangan' },
  gaji_pic_sekolah: { label: 'Gaji PIC Sekolah',      icon: GraduationCap, color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', desc: 'Honorarium PIC sekolah' },
  gaji_pic_posyandu:{ label: 'Gaji PIC Posyandu',     icon: Baby,         color: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200', desc: 'Honorarium kader posyandu' },
} as const;
const JENIS_KEYS = ['barang_masuk', 'gaji_relawan', 'gaji_pic_sekolah', 'gaji_pic_posyandu'] as const;
const STATUS_CONFIG = {
  'Lunas':       { label: 'Lunas',       icon: CircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Belum Bayar': { label: 'Belum Bayar', icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50' },
  'Dibatalkan':  { label: 'Dibatalkan',  icon: CircleX,     color: 'text-red-500',     bg: 'bg-red-50' },
};
const BULAN_LIST = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const fmtRp = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const fmtDate = (d: string) => {
  var dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function AkuntanModule() {
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupSql, setSetupSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [checking, setChecking] = useState(false);

  // Data
  const [pembayaran, setPembayaran] = useState<Pembayaran[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [filterJenis, setFilterJenis] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Pembayaran | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { jenis: 'barang_masuk' as string, tanggal: new Date().toISOString().slice(0,10), bulan: '', tahun: '', penerima: '', keterangan: '', jumlah: '', status: 'Belum Bayar', catatan: '' };
  const [form, setForm] = useState({ ...emptyForm });

  // === SETUP CHECK ===
  const checkSetup = useCallback(async function() {
    setChecking(true);
    try {
      var res = await fetch('/api/akun-pembayaran?action=check');
      var data = await res.json();
      if (data.ready) { setNeedsSetup(false); return true; }
      setNeedsSetup(true); setSetupSql(data.sql || ''); return false;
    } catch { setNeedsSetup(true); return false; }
    finally { setChecking(false); }
  }, []);

  // === FETCH ===
  const fetchData = useCallback(async function() {
    try {
      var params = new URLSearchParams();
      if (filterJenis !== 'semua') params.set('jenis', filterJenis);
      if (filterStatus !== 'semua') params.set('status', filterStatus);
      if (filterBulan) params.set('bulan', filterBulan);
      var res = await fetch('/api/akun-pembayaran?' + params.toString());
      var data = await res.json();
      if (Array.isArray(data)) setPembayaran(data);
      else toast.error(data.error || 'Gagal memuat');
    } catch { toast.error('Gagal memuat data'); }
  }, [filterJenis, filterStatus, filterBulan]);

  const fetchSummary = useCallback(async function() {
    try {
      var res = await fetch('/api/akun-pembayaran?action=summary');
      var data = await res.json();
      if (data && typeof data === 'object' && !data.error) setSummary(data);
    } catch { /* silent */ }
  }, []);

  const fetchAll = useCallback(async function() {
    setLoading(true);
    var ok = await checkSetup();
    if (!ok) { setLoading(false); return; }
    await Promise.all([fetchData(), fetchSummary()]);
    setLoading(false);
  }, [checkSetup, fetchData, fetchSummary]);

  useEffect(function() { fetchAll(); }, [fetchAll]);

  // Re-fetch when filters change
  useEffect(function() { if (!needsSetup) fetchData(); }, [filterJenis, filterStatus, filterBulan, fetchData]);
  useEffect(function() { if (!needsSetup) fetchSummary(); }, [needsSetup, fetchSummary]);

  // === SEED ===
  const handleSeed = async function() {
    setSeeding(true);
    try {
      var r = await fetch('/api/akun-pembayaran?action=seed');
      var d = await r.json();
      if (d.error) { toast.error(d.error); setSeeding(false); return; }
      toast.success(d.message || d.count + ' data tersimpan');
      await Promise.all([fetchData(), fetchSummary()]);
    } catch { toast.error('Gagal memuat data simulasi'); }
    finally { setSeeding(false); }
  };

  // === FORM HANDLERS ===
  const openAdd = function(jenis?: string) {
    setEditing(null);
    setForm({ ...emptyForm, jenis: jenis || 'barang_masuk', tahun: new Date().getFullYear().toString() });
    setShowModal(true);
  };

  const openEdit = function(p: Pembayaran) {
    setEditing(p);
    setForm({
      jenis: p.jenis, tanggal: p.tanggal, bulan: p.bulan || '',
      tahun: p.tahun || '', penerima: p.penerima,
      keterangan: p.keterangan || '', jumlah: String(p.jumlah),
      status: p.status, catatan: p.catatan || '',
    });
    setShowModal(true);
  };

  const handleSave = async function(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      var url = editing ? '/api/akun-pembayaran?id=' + editing.id : '/api/akun-pembayaran';
      var res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, jumlah: Number(form.jumlah) || 0 }),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? 'Pembayaran diperbarui' : 'Pembayaran ditambahkan');
      setShowModal(false); fetchData(); fetchSummary();
    } catch { toast.error('Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async function(id: string) {
    if (!confirm('Hapus data pembayaran ini?')) return;
    try {
      await fetch('/api/akun-pembayaran?id=' + id, { method: 'DELETE' });
      toast.success('Dihapus'); fetchData(); fetchSummary();
    } catch { toast.error('Gagal menghapus'); }
  };

  const handleDeleteAll = async function() {
    if (!confirm('HAPUS SEMUA data pembayaran?')) return;
    if (!confirm('Konfirmasi sekali lagi!')) return;
    try {
      await fetch('/api/akun-pembayaran?all=true', { method: 'DELETE' });
      toast.success('Semua data dihapus'); fetchData(); fetchSummary();
    } catch { toast.error('Gagal menghapus'); }
  };

  const handleCopySql = function() { navigator.clipboard.writeText(setupSql); setCopied(true); setTimeout(function() { setCopied(false); }, 2000); };

  // === FILTERED DATA ===
  const filtered = pembayaran.filter(function(p) {
    if (searchTerm) {
      var s = searchTerm.toLowerCase();
      var match = p.penerima.toLowerCase().includes(s) || (p.keterangan || '').toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  // === TOTALS ===
  var grandTotal = filtered.reduce(function(s, p) { return s + Number(p.jumlah); }, 0);
  var grandLunas = filtered.filter(function(p) { return p.status === 'Lunas'; }).reduce(function(s, p) { return s + Number(p.jumlah); }, 0);
  var grandBelum = filtered.filter(function(p) { return p.status === 'Belum Bayar'; }).reduce(function(s, p) { return s + Number(p.jumlah); }, 0);

  // === LOADING ===
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  // === SETUP SCREEN ===
  if (needsSetup) return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto"><Wallet className="w-8 h-8 text-amber-500" /></div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Tabel Akuntan Belum Ada</h3>
          <p className="text-sm text-slate-500 mt-1">Buat tabel di Supabase SQL Editor, lalu klik &quot;Muat Data Simulasi&quot;</p>
        </div>
        <div className="bg-slate-900 text-green-400 rounded-xl p-4 text-left text-xs font-mono overflow-auto max-h-48"><pre>{setupSql}</pre></div>
        <div className="flex gap-2">
          <button onClick={handleCopySql} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin!' : 'Salin SQL'}
          </button>
          <a href="https://supabase.com/dashboard/project/zwbspstsbpzsnphdohko/sql" target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
            <ExternalLink className="w-4 h-4" />Buka SQL Editor
          </a>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSeed} disabled={seeding} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50">
            {seeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
            {seeding ? 'Memuat...' : 'Muat Data Simulasi'}
          </button>
          <button onClick={async function() { var ok = await checkSetup(); if (ok) { setNeedsSetup(false); fetchAll(); } }} disabled={checking} className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  // === MAIN UI ===
  return (
    <div className="space-y-4">
      {/* Summary Cards - 4 Jenis */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {JENIS_KEYS.map(function(key) {
          var cfg = JENIS_CONFIG[key];
          var Icon = cfg.icon;
          var s = summary[key] || { total: 0, lunas: 0, belum: 0, batal: 0, count: 0 };
          return (
            <button key={key} onClick={function() { setFilterJenis(filterJenis === key ? 'semua' : key); }}
              className={"bg-white rounded-xl border p-4 text-left transition-all hover:shadow-sm " + (filterJenis === key ? 'border-2 ' + cfg.border + ' shadow-sm' : 'border-slate-200')}>
              <div className="flex items-center gap-2 mb-2">
                <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + cfg.bg + " " + cfg.text}><Icon className="w-4 h-4" /></div>
                <div className="min-w-0">
                  <span className={"text-[10px] font-bold uppercase " + cfg.text}>{cfg.label}</span>
                  <p className="text-[9px] text-slate-400 truncate">{s.count} transaksi</p>
                </div>
              </div>
              <div className={"text-lg font-extrabold " + cfg.text}>{fmtRp(s.total)}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-emerald-600 font-medium">Lunas {fmtRp(s.lunas)}</span>
                {s.belum > 0 && <span className="text-[10px] text-amber-500 font-medium">Belum {fmtRp(s.belum)}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Grand Total Bar */}
      <div className="bg-slate-900 rounded-xl p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div><p className="text-[10px] text-slate-400 uppercase font-semibold">Total Transaksi</p><p className="text-xl font-extrabold">{fmtRp(grandTotal)}</p></div>
            <div className="w-px h-10 bg-slate-700" />
            <div><p className="text-[10px] text-emerald-400 uppercase font-semibold flex items-center gap-1"><CircleCheck className="w-3 h-3" />Lunas</p><p className="text-lg font-bold text-emerald-400">{fmtRp(grandLunas)}</p></div>
            <div className="w-px h-10 bg-slate-700" />
            <div><p className="text-[10px] text-amber-400 uppercase font-semibold flex items-center gap-1"><Clock className="w-3 h-3" />Belum Bayar</p><p className="text-lg font-bold text-amber-400">{fmtRp(grandBelum)}</p></div>
          </div>
          <button onClick={function() { openAdd(); }} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">
            <Plus className="w-4 h-4" />Tambah Pembayaran
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={searchTerm} onChange={function(e) { setSearchTerm(e.target.value); }} placeholder="Cari penerima / keterangan..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
          {searchTerm && <button onClick={function() { setSearchTerm(''); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-400" /></button>}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {['semua','Lunas','Belum Bayar','Dibatalkan'].map(function(st) {
            return <button key={st} onClick={function() { setFilterStatus(st); }} className={"px-3 py-2 rounded-lg text-xs font-semibold transition-all " + (filterStatus === st ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500')}>{st === 'semua' ? 'Semua' : st}</button>;
          })}
        </div>
        <select value={filterBulan} onChange={function(e) { setFilterBulan(e.target.value); }} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
          <option value="">Semua Bulan</option>
          {BULAN_LIST.map(function(b) { return <option key={b} value={b}>{b}</option>; })}
        </select>
        <button onClick={handleSeed} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50" title="Muat Ulang Data"><RotateCcw className="w-4 h-4" /></button>
        <button onClick={handleDeleteAll} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50" title="Hapus Semua"><Trash2 className="w-4 h-4" /></button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Belum ada data pembayaran</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">Tanggal</div>
            <div className="col-span-2">Jenis</div>
            <div className="col-span-2">Penerima</div>
            <div className="col-span-3">Keterangan</div>
            <div className="col-span-1 text-right">Jumlah</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-center">Aksi</div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {filtered.map(function(p) {
              var jCfg = JENIS_CONFIG[p.jenis as keyof typeof JENIS_CONFIG];
              var sCfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG];
              var JIcon = jCfg ? jCfg.icon : Receipt;
              var SIcon = sCfg ? sCfg.icon : Clock;
              return (
                <div key={p.id} className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-4 py-3 hover:bg-slate-50/50 transition-colors items-center">
                  <div className="col-span-1 text-xs text-slate-500 font-medium">{fmtDate(p.tanggal)}</div>
                  <div className="col-span-2">
                    <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold " + (jCfg ? jCfg.bg + ' ' + jCfg.text : 'bg-slate-100 text-slate-600')}>
                      <JIcon className="w-3 h-3" />{jCfg ? jCfg.label : p.jenis}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-slate-800 truncate" title={p.penerima}>{p.penerima}</div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 truncate" title={p.keterangan || ''}>{p.keterangan || '-'}</span>
                    {p.stock_tx_id && <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold"><Link2 className="w-2.5 h-2.5" />Gudang</span>}
                  </div>
                  <div className="col-span-1 text-sm font-bold text-slate-800 text-right">{fmtRp(p.jumlah)}</div>
                  <div className="col-span-1 flex justify-center">
                    <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold " + (sCfg ? sCfg.bg + ' ' + sCfg.color : 'bg-slate-100 text-slate-500')}>
                      <SIcon className="w-3 h-3" />{sCfg ? sCfg.label : p.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <button onClick={function() { openEdit(p); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={function() { handleDelete(p.id); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Footer Total */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">{filtered.length} transaksi</span>
            <span className="text-sm font-bold text-slate-800">Total: {fmtRp(grandTotal)}</span>
          </div>
        </div>
      )}

      {/* ==================== MODAL: TAMBAH/EDIT PEMBAYARAN ==================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={function() { setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={function(e) { e.stopPropagation(); }}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">{editing ? 'Edit Pembayaran' : 'Tambah Pembayaran'}</h3>
              <button onClick={function() { setShowModal(false); }} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Jenis Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {JENIS_KEYS.map(function(key) {
                    var cfg = JENIS_CONFIG[key];
                    var Icon = cfg.icon;
                    var isSelected = form.jenis === key;
                    return (
                      <button key={key} type="button" onClick={function() { setForm(function(f) { return { ...f, jenis: key }; }); }}
                        className={"flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all " + (isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                        <Icon className="w-4 h-4" />{cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal</label>
                  <input type="date" value={form.tanggal} required onChange={function(e) {
                    setForm(function(f) { return { ...f, tanggal: e.target.value }; });
                    var d = new Date(e.target.value + 'T00:00:00');
                    setForm(function(f) { return { ...f, bulan: BULAN_LIST[d.getMonth()], tahun: String(d.getFullYear()) }; });
                  }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Bulan</label>
                  <input value={form.bulan} readOnly className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tahun</label>
                  <input value={form.tahun} readOnly className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Penerima <span className="text-red-400">*</span></label>
                <input value={form.penerima} required onChange={function(e) { setForm(function(f) { return { ...f, penerima: e.target.value }; }); }} placeholder={form.jenis === 'barang_masuk' ? 'Nama supplier' : 'Nama penerima'}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Keterangan</label>
                <input value={form.keterangan} onChange={function(e) { setForm(function(f) { return { ...f, keterangan: e.target.value }; }); }} placeholder={form.jenis === 'barang_masuk' ? 'Detail barang yang dibayar' : 'Keterangan pembayaran'}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Jumlah (Rp) <span className="text-red-400">*</span></label>
                  <input type="number" value={form.jumlah} required onChange={function(e) { setForm(function(f) { return { ...f, jumlah: e.target.value }; }); }} placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                  <select value={form.status} onChange={function(e) { setForm(function(f) { return { ...f, status: e.target.value }; }); }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white">
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Catatan</label>
                <textarea value={form.catatan} onChange={function(e) { setForm(function(f) { return { ...f, catatan: e.target.value }; }); }} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none" placeholder="Catatan tambahan (opsional)" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={function() { setShowModal(false); }} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editing ? 'Simpan Perubahan' : 'Tambah Pembayaran')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
