'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Trash2, Pencil, Loader2, UtensilsCrossed, Database, Copy, Check,
  CalendarDays, Flame, Beef, Apple, GlassWater, Milk, Baby, UserRound,
  ChevronDown, ChevronUp, AlertTriangle, RotateCcw, Search, X
} from 'lucide-react';

interface MenuPlan {
  id: string; tanggal: string; hari: string; kategori_penerima: string;
  nasi: string; lauk_pauk: string; sayur: string; buah: string | null;
  minuman: string | null; kalori_est: number | null; protein_g: number | null;
  catatan: string | null; status: string;
}

const KATEGORI = ['Semua', 'Umum', 'Bumil', 'Balita'];
const KAT_COLORS: Record<string, string> = {
  Umum: 'bg-blue-100 text-blue-700',
  Bumil: 'bg-pink-100 text-pink-700',
  Balita: 'bg-amber-100 text-amber-700',
};
const KAT_ICONS: Record<string, typeof UserRound> = {
  Umum: UserRound, Bumil: Baby, Balita: Baby,
};
const HARI_ORDER = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

export default function AhliGiziModule() {
  const [menus, setMenus] = useState<MenuPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupSql, setSetupSql] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterKat, setFilterKat] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MenuPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tanggal: '', hari: '', kategori_penerima: 'Umum',
    nasi: 'Nasi Putih', lauk_pauk: '', sayur: '',
    buah: '', minuman: '', kalori_est: '', protein_g: '', catatan: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const chkRes = await fetch('/api/menu-plans?action=check');
      const chk = await chkRes.json();
      if (!chk.exists) { setNeedsSetup(true); setSetupSql(chk.sql || ''); setLoading(false); return; }
      setNeedsSetup(false);
      const res = await fetch('/api/menu-plans');
      const data = await res.json();
      if (Array.isArray(data)) setMenus(data);
    } catch { toast.error('Gagal memuat data menu'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group by tanggal
  const filtered = menus.filter(m =>
    (filterKat === 'Semua' || m.kategori_penerima === filterKat) &&
    (m.lauk_pauk.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.sayur.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.hari.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const grouped = filtered.reduce((acc, m) => {
    const key = m.tanggal;
    if (!acc[key]) acc[key] = { tanggal: m.tanggal, hari: m.hari, items: [] };
    acc[key].items.push(m);
    return acc;
  }, {} as Record<string, { tanggal: string; hari: string; items: MenuPlan[] }>);
  const sortedDays = Object.values(grouped).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // Stats
  const avgKalori = (kat: string) => {
    const items = filtered.filter(m => m.kategori_penerima === kat && m.kalori_est);
    if (!items.length) return 0;
    return Math.round(items.reduce((s, m) => s + (m.kalori_est || 0), 0) / items.length);
  };
  const avgProtein = (kat: string) => {
    const items = filtered.filter(m => m.kategori_penerima === kat && m.protein_g);
    if (!items.length) return 0;
    return (items.reduce((s, m) => s + (m.protein_g || 0), 0) / items.length).toFixed(1);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/menu-plans?action=seed', { method: 'GET' });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(data.message || 'Menu berhasil dimuat!');
      setNeedsSetup(false); fetchData();
    } catch { toast.error('Gagal memuat data'); }
    finally { setSeeding(false); }
  };

  const openAdd = (hari?: string, tanggal?: string) => {
    setEditing(null);
    setForm({ tanggal: tanggal || new Date().toISOString().slice(0, 10), hari: hari || '', kategori_penerima: 'Umum', nasi: 'Nasi Putih', lauk_pauk: '', sayur: '', buah: '', minuman: '', kalori_est: '', protein_g: '', catatan: '' });
    setShowModal(true);
  };

  const openEdit = (m: MenuPlan) => {
    setEditing(m);
    setForm({ tanggal: m.tanggal, hari: m.hari, kategori_penerima: m.kategori_penerima, nasi: m.nasi, lauk_pauk: m.lauk_pauk, sayur: m.sayur, buah: m.buah || '', minuman: m.minuman || '', kalori_est: String(m.kalori_est || ''), protein_g: String(m.protein_g || ''), catatan: m.catatan || '' });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/menu-plans?id=${editing.id}` : '/api/menu-plans';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, kalori_est: form.kalori_est ? Number(form.kalori_est) : null, protein_g: form.protein_g ? Number(form.protein_g) : null }) });
      if (!res.ok) throw new Error();
      toast.success(editing ? 'Menu diperbarui' : 'Menu ditambahkan');
      setShowModal(false); fetchData();
    } catch { toast.error('Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus menu ini?')) return;
    try {
      const res = await fetch(`/api/menu-plans?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Menu dihapus'); fetchData();
    } catch { toast.error('Gagal menghapus'); }
  };

  const handleDeleteAll = async () => {
    if (!confirm('HAPUS SEMUA data menu?')) return;
    if (!confirm('Konfirmasi sekali lagi - data tidak bisa dikembalikan!')) return;
    try {
      await fetch('/api/menu-plans?all=true', { method: 'DELETE' });
      toast.success('Semua menu dihapus'); fetchData();
    } catch { toast.error('Gagal menghapus'); }
  };

  const handleCopySql = () => { navigator.clipboard.writeText(setupSql); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const fmtDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  // Setup screen
  if (needsSetup) return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto"><Database className="w-8 h-8 text-amber-500" /></div>
        <div><h3 className="text-lg font-bold text-slate-800">Tabel Menu Belum Ada</h3><p className="text-sm text-slate-500 mt-1">Buat tabel di Supabase SQL Editor, lalu klik "Muat Data"</p></div>
        <div className="bg-slate-900 text-green-400 rounded-xl p-4 text-left text-xs font-mono overflow-auto max-h-48"><pre>{setupSql}</pre></div>
        <div className="flex gap-2">
          <button onClick={handleCopySql} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors">{copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}{copied ? 'Tersalin!' : 'Salin SQL'}</button>
          <a href="https://supabase.com/dashboard/project/zwbspstsbpzsnphdohko/sql" target="_blank" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">Buka SQL Editor</a>
        </div>
        <button onClick={handleSeed} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors">{seeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}Muat Data Simulasi</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {['Umum','Bumil','Balita'].map(kat => {
          const KalIcon = kat === 'Bumil' ? Baby : UserRound;
          return (
            <div key={kat} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${KAT_COLORS[kat]}`}><KalIcon className="w-4 h-4" /></div>
                <span className="text-xs font-semibold text-slate-500 uppercase">{kat}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <div><span className="text-2xl font-extrabold text-slate-800">{avgKalori(kat)}</span><span className="text-xs text-slate-400 ml-1">kkal</span></div>
                <div><span className="text-lg font-bold text-emerald-600">{avgProtein(kat)}</span><span className="text-xs text-slate-400 ml-1">g protein</span></div>
              </div>
            </div>
          );
        })}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600"><CalendarDays className="w-4 h-4" /></div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Menu</span>
          </div>
          <div><span className="text-2xl font-extrabold text-slate-800">{filtered.length}</span><span className="text-xs text-slate-400 ml-1">menu</span></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari menu..." className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {KATEGORI.map(k => (
            <button key={k} onClick={() => setFilterKat(k)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filterKat === k ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{k}</button>
          ))}
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20"><Plus className="w-4 h-4" />Tambah</button>
        <button onClick={handleSeed} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors" title="Muat Ulang Data Simulasi"><RotateCcw className="w-4 h-4" /></button>
        <button onClick={handleDeleteAll} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors" title="Hapus Semua"><Trash2 className="w-4 h-4" /></button>
      </div>

      {/* Menu Cards by Day */}
      {sortedDays.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Belum ada menu. Klik "Tambah" atau "Muat Data Simulasi"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDays.map(day => {
            const isExpanded = expandedDay === day.tanggal;
            return (
              <div key={day.tanggal} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button onClick={() => setExpandedDay(isExpanded ? null : day.tanggal)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-extrabold text-sm">{day.hari.slice(0,2)}</div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">{day.hari}</p>
                      <p className="text-xs text-slate-400">{fmtDate(day.tanggal)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{day.items.length} menu</span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {day.items.map(m => {
                      const KatIcon = KAT_ICONS[m.kategori_penerima] || UserRound;
                      return (
                        <div key={m.id} className="px-5 py-4 hover:bg-slate-50/30 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${KAT_COLORS[m.kategori_penerima] || 'bg-slate-100 text-slate-600'}`}>{m.kategori_penerima}</span>
                                {m.kalori_est && <span className="flex items-center gap-1 text-[10px] text-orange-500 font-semibold"><Flame className="w-3 h-3" />{m.kalori_est} kkal</span>}
                                {m.protein_g && <span className="flex items-center gap-1 text-[10px] text-blue-500 font-semibold"><Beef className="w-3 h-3" />{m.protein_g}g protein</span>}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                <div className="flex items-center gap-2"><UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Nasi</span><span className="font-medium text-slate-700">{m.nasi}</span></div>
                                <div className="flex items-center gap-2"><Beef className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Lauk</span><span className="font-medium text-slate-700">{m.lauk_pauk}</span></div>
                                <div className="flex items-center gap-2"><Apple className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Sayur</span><span className="font-medium text-slate-700">{m.sayur}</span></div>
                                {m.buah && <div className="flex items-center gap-2"><Apple className="w-3.5 h-3.5 text-green-400 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Buah</span><span className="font-medium text-slate-700">{m.buah}</span></div>}
                                {m.minuman && <div className="flex items-center gap-2"><GlassWater className="w-3.5 h-3.5 text-blue-400 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Minum</span><span className="font-medium text-slate-700">{m.minuman}</span></div>}
                                {m.minuman?.includes('Susu') && <div className="flex items-center gap-2"><Milk className="w-3.5 h-3.5 text-yellow-500 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Tambahan</span><span className="font-medium text-slate-700">Susu UHT 200ml</span></div>}
                              </div>
                              {m.catatan && <p className="text-xs text-slate-400 mt-1 italic">{m.catatan}</p>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="px-5 py-3 bg-slate-50/50">
                      <button onClick={() => openAdd(day.hari, day.tanggal)} className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Tambah menu untuk {day.hari}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">{editing ? 'Edit Menu' : 'Tambah Menu'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal</label><input type="date" value={form.tanggal} onChange={e => { setForm({...form, tanggal: e.target.value}); const d = new Date(e.target.value+'T00:00:00'); setForm(f => ({...f, hari: HARI_ORDER[d.getDay() === 0 ? 6 : d.getDay() - 1] || ''})); }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" required /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Hari</label><input value={form.hari} readOnly className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Kategori Penerima</label><select value={form.kategori_penerima} onChange={e => setForm({...form, kategori_penerima: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">{['Umum','Bumil','Balita'].map(k => <option key={k}>{k}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nasi/Karbohidrat</label><input value={form.nasi} onChange={e => setForm({...form, nasi: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" required /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Lauk Pauk</label><input value={form.lauk_pauk} onChange={e => setForm({...form, lauk_pauk: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" required /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Sayur</label><input value={form.sayur} onChange={e => setForm({...form, sayur: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Buah</label><input value={form.buah} onChange={e => setForm({...form, buah: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" placeholder="Opsional" /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Minuman</label><input value={form.minuman} onChange={e => setForm({...form, minuman: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" placeholder="Opsional" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Kalori (kkal)</label><input type="number" value={form.kalori_est} onChange={e => setForm({...form, kalori_est: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" placeholder="Estimasi" /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Protein (gram)</label><input type="number" step="0.1" value={form.protein_g} onChange={e => setForm({...form, protein_g: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" placeholder="Estimasi" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Catatan Ahli Gizi</label><textarea value={form.catatan} onChange={e => setForm({...form, catatan: e.target.value})} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none" placeholder="Catatan khusus..." /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50">{saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editing ? 'Simpan Perubahan' : 'Tambah Menu')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
