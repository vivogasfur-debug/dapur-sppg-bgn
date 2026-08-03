'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Trash2, Pencil, Loader2, UtensilsCrossed, Database, Copy, Check,
  CalendarDays, Flame, Beef, Apple, GlassWater, Baby, UserRound, Users,
  ChevronDown, ChevronUp, RotateCcw, Search, X, BookOpen, ClipboardList,
  Sparkles, ChevronRight, AlertCircle, ExternalLink, ImagePlus, ImageIcon
} from 'lucide-react';

// === TYPES ===
interface MenuDbItem {
  id: string; nama_menu: string; tipe_porsi: string;
  nasi: string; lauk_pauk: string; sayur: string;
  buah: string | null; minuman: string | null;
  kalori_est: number | null; protein_g: number | null;
  catatan: string | null; gambar_url: string | null; aktif: boolean;
}

interface WeeklyPlan {
  id: string; tanggal: string; hari: string; menu_db_id: string | null;
  tipe_porsi: string; penerima: string; catatan: string | null; status: string;
  nutrition_menu_db: MenuDbItem | null;
}

// === CONSTANTS ===
const PORSI_CONFIG = {
  porsi_besar: { label: 'Porsi Besar', icon: UserRound, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', desc: 'Dewasa & Anak Besar' },
  porsi_kecil: { label: 'Porsi Kecil', icon: Users, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', desc: 'Anak SD-SMP' },
  porsi_bayi: { label: 'Porsi Bayi', icon: Baby, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', desc: 'Bayi 6-12 Bulan' },
} as const;
const PORSI_KEYS = ['porsi_besar', 'porsi_kecil', 'porsi_bayi'] as const;
const HARI_ORDER = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
const TABS = ['Rencana Mingguan', 'Database Menu'] as const;

const fmtDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export default function AhliGiziModule() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Rencana Mingguan');
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupSql, setSetupSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [checking, setChecking] = useState(false);

  // Weekly plan state
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [filterPorsi, setFilterPorsi] = useState<string>('semua');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Database menu state
  const [menuDb, setMenuDb] = useState<MenuDbItem[]>([]);
  const [filterMenuPorsi, setFilterMenuPorsi] = useState<string>('semua');
  const [searchMenu, setSearchMenu] = useState('');

  // Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuDbItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form: Add Weekly Plan (dropdown from DB)
  const [planForm, setPlanForm] = useState({ tanggal: '', hari: '', tipe_porsi: 'porsi_besar', menu_db_id: '', catatan: '' });
  // Form: Add/Edit Menu DB
  const [menuForm, setMenuForm] = useState({
    nama_menu: '', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih',
    lauk_pauk: '', sayur: '', buah: '', minuman: '',
    kalori_est: '', protein_g: '', catatan: '', gambar_url: '',
  });

  // === SETUP CHECK ===
  const checkSetup = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/nutrition-setup');
      const data = await res.json();
      if (data.ready) { setNeedsSetup(false); return true; }
      setNeedsSetup(true); setSetupSql(data.sql || ''); return false;
    } catch { setNeedsSetup(true); return false; }
    finally { setChecking(false); }
  }, []);

  // === FETCH DATA ===
  const fetchWeekly = useCallback(async () => {
    try {
      const res = await fetch('/api/weekly-menus');
      const data = await res.json();
      if (Array.isArray(data)) setWeeklyPlans(data);
      else toast.error(data.error || 'Gagal memuat rencana menu');
    } catch { toast.error('Gagal memuat rencana menu'); }
  }, []);

  const fetchMenuDb = useCallback(async () => {
    try {
      const res = await fetch('/api/nutrition-menus');
      const data = await res.json();
      if (Array.isArray(data)) setMenuDb(data);
      else toast.error(data.error || 'Gagal memuat database menu');
    } catch { toast.error('Gagal memuat database menu'); }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const ok = await checkSetup();
    if (!ok) { setLoading(false); return; }
    await Promise.all([fetchWeekly(), fetchMenuDb()]);
    setLoading(false);
  }, [checkSetup, fetchWeekly, fetchMenuDb]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // === SEED ===
  const handleSeed = async () => {
    setSeeding(true);
    try {
      // Seed menu DB first
      const r1 = await fetch('/api/nutrition-menus?action=seed');
      const d1 = await r1.json();
      if (d1.error) { toast.error(d1.error); setSeeding(false); return; }
      // Then seed weekly plans
      const r2 = await fetch('/api/weekly-menus?action=seed');
      const d2 = await r2.json();
      if (d2.error) { toast.error(d2.error); setSeeding(false); return; }
      toast.success(`${d1.count} menu DB + ${d2.count} rencana mingguan tersimpan!`);
      setNeedsSetup(false);
      await Promise.all([fetchWeekly(), fetchMenuDb()]);
    } catch { toast.error('Gagal memuat data simulasi'); }
    finally { setSeeding(false); }
  };

  // === HANDLE: Add Weekly Plan ===
  const openAddPlan = (hari?: string, tanggal?: string) => {
    setPlanForm({ tanggal: tanggal || new Date().toISOString().slice(0,10), hari: hari || '', tipe_porsi: 'porsi_besar', menu_db_id: '', catatan: '' });
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.menu_db_id) { toast.error('Pilih menu dari dropdown'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/weekly-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm),
      });
      if (!res.ok) throw new Error();
      toast.success('Menu ditambahkan ke rencana mingguan');
      setShowPlanModal(false); fetchWeekly();
    } catch { toast.error('Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Hapus menu ini dari rencana?')) return;
    try {
      await fetch(`/api/weekly-menus?id=${id}`, { method: 'DELETE' });
      toast.success('Dihapus dari rencana'); fetchWeekly();
    } catch { toast.error('Gagal menghapus'); }
  };

  const handleDeleteAllPlans = async () => {
    if (!confirm('HAPUS SEMUA rencana menu mingguan?')) return;
    if (!confirm('Konfirmasi sekali lagi!')) return;
    try {
      await fetch('/api/weekly-menus?all=true', { method: 'DELETE' });
      toast.success('Semua rencana dihapus'); fetchWeekly();
    } catch { toast.error('Gagal menghapus'); }
  };

  // === HANDLE: Add/Edit Menu DB ===
  const openAddMenu = () => {
    setEditingMenu(null);
    setMenuForm({ nama_menu: '', tipe_porsi: 'porsi_besar', nasi: 'Nasi Putih', lauk_pauk: '', sayur: '', buah: '', minuman: '', kalori_est: '', protein_g: '', catatan: '', gambar_url: '' });
    setShowMenuModal(true);
  };

  const openEditMenu = (m: MenuDbItem) => {
    setEditingMenu(m);
    setMenuForm({
      nama_menu: m.nama_menu, tipe_porsi: m.tipe_porsi, nasi: m.nasi,
      lauk_pauk: m.lauk_pauk, sayur: m.sayur, buah: m.buah || '',
      minuman: m.minuman || '', kalori_est: String(m.kalori_est || ''),
      protein_g: String(m.protein_g || ''), catatan: m.catatan || '',
      gambar_url: m.gambar_url || '',
    });
    setShowMenuModal(true);
  };

  // Handle image upload (convert to base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran gambar maks 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setMenuForm(function(f) { return { ...f, gambar_url: reader.result as string }; });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingMenu ? `/api/nutrition-menus?id=${editingMenu.id}` : '/api/nutrition-menus';
      const res = await fetch(url, {
        method: editingMenu ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...menuForm, kalori_est: menuForm.kalori_est ? Number(menuForm.kalori_est) : null, protein_g: menuForm.protein_g ? Number(menuForm.protein_g) : null, gambar_url: menuForm.gambar_url || null }),
      });
      if (!res.ok) throw new Error();
      toast.success(editingMenu ? 'Menu diperbarui' : 'Menu baru ditambahkan ke database');
      setShowMenuModal(false); fetchMenuDb();
    } catch { toast.error('Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm('Nonaktifkan menu ini dari database?')) return;
    try {
      await fetch(`/api/nutrition-menus?id=${id}`, { method: 'DELETE' });
      toast.success('Menu dinonaktifkan'); fetchMenuDb();
    } catch { toast.error('Gagal menghapus'); }
  };

  const handleCopySql = () => { navigator.clipboard.writeText(setupSql); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // === FILTERED DATA ===
  const filteredPlans = weeklyPlans.filter(p =>
    (filterPorsi === 'semua' || p.tipe_porsi === filterPorsi) &&
    (searchTerm === '' ||
      (p.nutrition_menu_db?.nama_menu || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hari.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const groupedPlans = filteredPlans.reduce(function(acc, p) {
    var key = p.tanggal;
    if (!acc[key]) acc[key] = { tanggal: p.tanggal, hari: p.hari, items: [] };
    acc[key].items.push(p);
    return acc;
  }, {} as Record<string, { tanggal: string; hari: string; items: WeeklyPlan[] }>);
  const sortedDays = Object.values(groupedPlans).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const filteredMenus = menuDb.filter(m =>
    (filterMenuPorsi === 'semua' || m.tipe_porsi === filterMenuPorsi) &&
    (searchMenu === '' || m.nama_menu.toLowerCase().includes(searchMenu.toLowerCase()))
  );

  // Available menus for dropdown (filtered by selected porsi type in plan form)
  const dropdownMenus = menuDb.filter(m => m.tipe_porsi === planForm.tipe_porsi);

  // Stats
  const statsByPorsi = function(tipe: string) {
    var items = weeklyPlans.filter(function(p) { return p.tipe_porsi === tipe && p.nutrition_menu_db; });
    return {
      count: items.length,
      avgKalori: items.length ? Math.round(items.reduce(function(s, p) { return s + (p.nutrition_menu_db?.kalori_est || 0); }, 0) / items.length) : 0,
      avgProtein: items.length ? (items.reduce(function(s, p) { return s + (p.nutrition_menu_db?.protein_g || 0); }, 0) / items.length).toFixed(1) : '0',
    };
  };

  // === LOADING ===
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  // === SETUP SCREEN ===
  if (needsSetup) return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto"><Database className="w-8 h-8 text-amber-500" /></div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Tabel Ahli Gizi Belum Ada</h3>
          <p className="text-sm text-slate-500 mt-1">Buat 2 tabel di Supabase SQL Editor, lalu klik &quot;Muat Data Simulasi&quot;</p>
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
            {seeding ? 'Memuat...' : 'Muat Data Simulasi 1 Minggu'}
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
      {/* Stats Cards - 3 Porsi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PORSI_KEYS.map(function(key) {
          var cfg = PORSI_CONFIG[key];
          var Icon = cfg.icon;
          var st = statsByPorsi(key);
          return (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + cfg.bg + " " + cfg.text}><Icon className="w-4 h-4" /></div>
                <div>
                  <span className={"text-[10px] font-bold uppercase " + cfg.text}>{cfg.label}</span>
                  <p className="text-[9px] text-slate-400">{cfg.desc}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <div><span className="text-2xl font-extrabold text-slate-800">{st.avgKalori}</span><span className="text-xs text-slate-400 ml-1">kkal</span></div>
                <div><span className="text-lg font-bold text-emerald-600">{st.avgProtein}</span><span className="text-xs text-slate-400 ml-1">g prot</span></div>
                <div className="ml-auto text-xs text-slate-400">{st.count} menu</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(function(tab) {
          var isActive = activeTab === tab;
          return (
            <button key={tab} onClick={function() { setActiveTab(tab); }}
              className={"flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all " + (isActive ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
              {tab === 'Rencana Mingguan' ? <ClipboardList className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              {tab}
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: RENCANA MINGGUAN ==================== */}
      {activeTab === 'Rencana Mingguan' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchTerm} onChange={function(e) { setSearchTerm(e.target.value); }} placeholder="Cari menu..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              {searchTerm && <button onClick={function() { setSearchTerm(''); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-400" /></button>}
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button onClick={function() { setFilterPorsi('semua'); }} className={"px-3 py-2 rounded-lg text-xs font-semibold transition-all " + (filterPorsi === 'semua' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500')}>Semua</button>
              {PORSI_KEYS.map(function(key) {
                return <button key={key} onClick={function() { setFilterPorsi(key); }} className={"px-3 py-2 rounded-lg text-xs font-semibold transition-all " + (filterPorsi === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500')}>{PORSI_CONFIG[key].label}</button>;
              })}
            </div>
            <button onClick={function() { openAddPlan(); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20">
              <Plus className="w-4 h-4" />Tambah
            </button>
            <button onClick={handleSeed} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50" title="Muat Ulang Data"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={handleDeleteAllPlans} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50" title="Hapus Semua"><Trash2 className="w-4 h-4" /></button>
          </div>

          {/* Day Cards */}
          {sortedDays.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Belum ada rencana menu. Klik &quot;Tambah&quot; atau &quot;Muat Data Simulasi&quot;</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDays.map(function(day) {
                var isExp = expandedDay === day.tanggal;
                return (
                  <div key={day.tanggal} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button onClick={function() { setExpandedDay(isExp ? null : day.tanggal); }}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-extrabold text-sm">{day.hari.slice(0,2)}</div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800">{day.hari}</p>
                          <p className="text-xs text-slate-400">{fmtDate(day.tanggal)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {day.items.map(function(item) {
                            var cfg = PORSI_CONFIG[item.tipe_porsi as keyof typeof PORSI_CONFIG];
                            if (!cfg) return null;
                            return <span key={item.id} className={"px-2 py-0.5 rounded-md text-[9px] font-bold " + cfg.bg + " " + cfg.text}>{cfg.label}</span>;
                          })}
                        </div>
                        <span className="text-xs text-slate-400">{day.items.length}</span>
                        {isExp ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </button>
                    {isExp && (
                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {day.items.map(function(p) {
                          var menu = p.nutrition_menu_db;
                          var cfg = PORSI_CONFIG[p.tipe_porsi as keyof typeof PORSI_CONFIG];
                          var PIcon = cfg ? cfg.icon : UtensilsCrossed;
                          return (
                            <div key={p.id} className="px-5 py-4 hover:bg-slate-50/30 transition-colors">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={"px-2 py-0.5 rounded-md text-[10px] font-bold uppercase " + (cfg ? cfg.bg + ' ' + cfg.text : 'bg-slate-100 text-slate-600')}>{cfg ? cfg.label : p.tipe_porsi}</span>
                                    {menu?.kalori_est && <span className="flex items-center gap-1 text-[10px] text-orange-500 font-semibold"><Flame className="w-3 h-3" />{menu.kalori_est} kkal</span>}
                                    {menu?.protein_g && <span className="flex items-center gap-1 text-[10px] text-blue-500 font-semibold"><Beef className="w-3 h-3" />{menu.protein_g}g protein</span>}
                                  </div>
                                  {menu && (
                                    <div className="flex items-center gap-3">
                                      {menu.gambar_url ? (
                                        <img src={menu.gambar_url} alt={menu.nama_menu} className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-200" />
                                      ) : (
                                        <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200"><ImageIcon className="w-6 h-6 text-slate-300" /></div>
                                      )}
                                      <div>
                                        <p className="font-semibold text-slate-800 text-sm">{menu.nama_menu}</p>
                                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                          {menu.kalori_est && <span className="text-[10px] text-orange-500 font-semibold">{menu.kalori_est} kkal</span>}
                                          {menu.protein_g && <span className="text-[10px] text-blue-500 font-semibold">{menu.protein_g}g protein</span>}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {menu && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                      <div className="flex items-center gap-2"><UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Karbo</span><span className="font-medium text-slate-700">{menu.nasi}</span></div>
                                      <div className="flex items-center gap-2"><Beef className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Lauk</span><span className="font-medium text-slate-700">{menu.lauk_pauk}</span></div>
                                      <div className="flex items-center gap-2"><Apple className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Sayur</span><span className="font-medium text-slate-700">{menu.sayur}</span></div>
                                      {menu.buah && <div className="flex items-center gap-2"><Apple className="w-3.5 h-3.5 text-green-400 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Buah</span><span className="font-medium text-slate-700">{menu.buah}</span></div>}
                                      {menu.minuman && <div className="flex items-center gap-2"><GlassWater className="w-3.5 h-3.5 text-blue-400 shrink-0" /><span className="text-slate-500 text-xs w-16 shrink-0">Minum</span><span className="font-medium text-slate-700">{menu.minuman}</span></div>}
                                    </div>
                                  )}
                                  {(menu?.catatan || p.catatan) && <p className="text-xs text-slate-400 mt-1 italic">{menu?.catatan || p.catatan}</p>}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={function() { handleDeletePlan(p.id); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div className="px-5 py-3 bg-slate-50/50">
                          <button onClick={function() { openAddPlan(day.hari, day.tanggal); }} className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" />Tambah menu untuk {day.hari}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: DATABASE MENU ==================== */}
      {activeTab === 'Database Menu' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchMenu} onChange={function(e) { setSearchMenu(e.target.value); }} placeholder="Cari menu..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              {searchMenu && <button onClick={function() { setSearchMenu(''); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-400" /></button>}
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button onClick={function() { setFilterMenuPorsi('semua'); }} className={"px-3 py-2 rounded-lg text-xs font-semibold transition-all " + (filterMenuPorsi === 'semua' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500')}>Semua ({menuDb.length})</button>
              {PORSI_KEYS.map(function(key) {
                var count = menuDb.filter(function(m) { return m.tipe_porsi === key; }).length;
                return <button key={key} onClick={function() { setFilterMenuPorsi(key); }} className={"px-3 py-2 rounded-lg text-xs font-semibold transition-all " + (filterMenuPorsi === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500')}>{PORSI_CONFIG[key].label} ({count})</button>;
              })}
            </div>
            <button onClick={openAddMenu} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20">
              <Plus className="w-4 h-4" />Tambah Menu
            </button>
          </div>

          {/* Menu List */}
          {filteredMenus.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Belum ada menu di database</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredMenus.map(function(m) {
                var cfg = PORSI_CONFIG[m.tipe_porsi as keyof typeof PORSI_CONFIG];
                return (
                  <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
                        {m.gambar_url ? (
                          <img src={m.gambar_url} alt={m.nama_menu} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-7 h-7 text-slate-300" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={"px-2 py-0.5 rounded-md text-[10px] font-bold " + (cfg ? cfg.bg + ' ' + cfg.text : 'bg-slate-100 text-slate-600')}>{cfg ? cfg.label : m.tipe_porsi}</span>
                          {m.kalori_est && <span className="text-[10px] text-orange-500 font-semibold">{m.kalori_est} kkal</span>}
                          {m.protein_g && <span className="text-[10px] text-blue-500 font-semibold">{m.protein_g}g prot</span>}
                        </div>
                        <p className="font-semibold text-slate-800 text-sm truncate">{m.nama_menu}</p>
                        <p className="text-xs text-slate-400 mt-1 truncate">{m.lauk_pauk} &middot; {m.sayur}{m.buah ? ' &middot; ' + m.buah : ''}</p>
                        {m.catatan && <p className="text-[11px] text-slate-400 mt-0.5 italic truncate">{m.catatan}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={function() { openEditMenu(m); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={function() { handleDeleteMenu(m.id); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL: ADD WEEKLY PLAN (DROPDOWN) ==================== */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={function() { setShowPlanModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={function(e) { e.stopPropagation(); }}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Tambah ke Rencana Mingguan</h3>
              <button onClick={function() { setShowPlanModal(false); }} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSavePlan} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal</label>
                  <input type="date" value={planForm.tanggal} required onChange={function(e) {
                    setPlanForm(function(f) { return { ...f, tanggal: e.target.value }; });
                    var d = new Date(e.target.value + 'T00:00:00');
                    var dayIdx = d.getDay();
                    var hari = HARI_ORDER[dayIdx === 0 ? 6 : dayIdx - 1] || '';
                    setPlanForm(function(f) { return { ...f, hari: hari }; });
                  }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Hari</label>
                  <input value={planForm.hari} readOnly className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tipe Porsi</label>
                <div className="grid grid-cols-3 gap-2">
                  {PORSI_KEYS.map(function(key) {
                    var cfg = PORSI_CONFIG[key];
                    var PIcon = cfg.icon;
                    var isSelected = planForm.tipe_porsi === key;
                    return (
                      <button key={key} type="button" onClick={function() {
                        setPlanForm(function(f) { return { ...f, tipe_porsi: key, menu_db_id: '' }; }); // reset dropdown when porsi changes
                      }} className={"flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all " + (isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                        <PIcon className="w-4 h-4" />{cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Pilih Menu <span className="text-emerald-500">(dari database)</span></label>
                <select value={planForm.menu_db_id} required onChange={function(e) { setPlanForm(function(f) { return { ...f, menu_db_id: e.target.value }; }); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white">
                  <option value="">-- Pilih Menu --</option>
                  {dropdownMenus.map(function(m) {
                    return <option key={m.id} value={m.id}>{m.nama_menu} ({m.kalori_est || '?'} kkal)</option>;
                  })}
                </select>
                {dropdownMenus.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Tidak ada menu untuk porsi ini. Tambahkan di tab &quot;Database Menu&quot;</p>
                )}
              </div>

              {(() => {
                var selectedMenu = menuDb.find(function(m) { return m.id === planForm.menu_db_id; });
                if (!selectedMenu) return null;
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                    <div className="flex items-start gap-3">
                      {selectedMenu.gambar_url ? (
                        <img src={selectedMenu.gambar_url} alt={selectedMenu.nama_menu} className="w-16 h-16 rounded-lg object-cover shrink-0 border border-emerald-300" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-300"><ImageIcon className="w-7 h-7 text-emerald-300" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1"><Sparkles className="w-3 h-3" />Preview Menu</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{selectedMenu.nama_menu}</p>
                        <div className="text-xs text-slate-600 space-y-0.5 mt-1">
                          <p>Karbo: {selectedMenu.nasi}</p>
                          <p>Lauk: {selectedMenu.lauk_pauk}</p>
                          <p>Sayur: {selectedMenu.sayur}</p>
                          {selectedMenu.buah && <p>Buah: {selectedMenu.buah}</p>}
                          {selectedMenu.minuman && <p>Minuman: {selectedMenu.minuman}</p>}
                        </div>
                        <div className="flex gap-3 mt-1">
                          {selectedMenu.kalori_est && <span className="text-[10px] text-orange-600 font-semibold">{selectedMenu.kalori_est} kkal</span>}
                          {selectedMenu.protein_g && <span className="text-[10px] text-blue-600 font-semibold">{selectedMenu.protein_g}g protein</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Catatan (Opsional)</label>
                <textarea value={planForm.catatan} onChange={function(e) { setPlanForm(function(f) { return { ...f, catatan: e.target.value }; }); }} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none" placeholder="Catatan khusus..." />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={function() { setShowPlanModal(false); }} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Tambah ke Rencana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD/EDIT MENU DB ==================== */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={function() { setShowMenuModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={function(e) { e.stopPropagation(); }}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">{editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
              <button onClick={function() { setShowMenuModal(false); }} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveMenu} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Menu</label>
                <input value={menuForm.nama_menu} required onChange={function(e) { setMenuForm(function(f) { return { ...f, nama_menu: e.target.value }; }); }} placeholder="cth: Nasi + Ayam Goreng + Sayur Bayam"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tipe Porsi</label>
                <div className="grid grid-cols-3 gap-2">
                  {PORSI_KEYS.map(function(key) {
                    var cfg = PORSI_CONFIG[key];
                    var PIcon = cfg.icon;
                    var isSelected = menuForm.tipe_porsi === key;
                    return (
                      <button key={key} type="button" onClick={function() { setMenuForm(function(f) { return { ...f, tipe_porsi: key }; }); }}
                        className={"flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all " + (isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                        <PIcon className="w-3.5 h-3.5" />{cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nasi/Karbohidrat</label><input value={menuForm.nasi} onChange={function(e) { setMenuForm(function(f) { return { ...f, nasi: e.target.value }; }); }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" required /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Lauk Pauk</label><input value={menuForm.lauk_pauk} onChange={function(e) { setMenuForm(function(f) { return { ...f, lauk_pauk: e.target.value }; }); }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" required /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Sayur</label><input value={menuForm.sayur} onChange={function(e) { setMenuForm(function(f) { return { ...f, sayur: e.target.value }; }); }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Buah</label><input value={menuForm.buah} onChange={function(e) { setMenuForm(function(f) { return { ...f, buah: e.target.value }; }); }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" placeholder="Opsional" /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Minuman</label><input value={menuForm.minuman} onChange={function(e) { setMenuForm(function(f) { return { ...f, minuman: e.target.value }; }); }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" placeholder="Opsional" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Kalori (kkal)</label><input type="number" value={menuForm.kalori_est} onChange={function(e) { setMenuForm(function(f) { return { ...f, kalori_est: e.target.value }; }); }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" placeholder="Estimasi" /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Protein (gram)</label><input type="number" step="0.1" value={menuForm.protein_g} onChange={function(e) { setMenuForm(function(f) { return { ...f, protein_g: e.target.value }; }); }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" placeholder="Estimasi" /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Gambar Menu</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer transition-all overflow-hidden">
                    {menuForm.gambar_url ? (
                      <img src={menuForm.gambar_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <ImagePlus className="w-6 h-6 text-slate-400 mx-auto" />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Pilih Foto</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <div className="flex-1">
                    <p className="text-[11px] text-slate-400">Upload foto menu (maks 2MB)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, atau WebP</p>
                    {menuForm.gambar_url && (
                      <button type="button" onClick={function() { setMenuForm(function(f) { return { ...f, gambar_url: '' }; }); }} className="text-[11px] text-red-500 hover:text-red-600 font-semibold mt-1 flex items-center gap-0.5"><X className="w-3 h-3" />Hapus Gambar</button>
                    )}
                  </div>
                </div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Catatan</label><textarea value={menuForm.catatan} onChange={function(e) { setMenuForm(function(f) { return { ...f, catatan: e.target.value }; }); }} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none" placeholder="Catatan ahli gizi..." /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={function() { setShowMenuModal(false); }} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingMenu ? 'Simpan Perubahan' : 'Tambah ke Database')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
