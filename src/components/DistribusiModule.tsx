'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Search, X, Trash2, Pencil, Loader2, Truck, School, Building2,
  Database, Copy, Check, ChevronDown, ChevronUp, UtensilsCrossed,
  Send, CheckCircle2, Ban, FileText, AlertTriangle, Calendar,
  Users, Baby, UserRound, Package, ChevronRight, Minus, Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

// === TYPES ===
interface DistributionItem {
  id?: string;
  weekly_plan_id: string | null;
  menu_name: string;
  tipe_porsi: string;
  nasi: string | null;
  lauk_pauk: string | null;
  sayur: string | null;
  buah: string | null;
  minuman: string | null;
  jumlah_porsi: number;
  notes?: string;
}

interface Distribution {
  id: string;
  distribution_date: string;
  destination_type: 'Sekolah' | 'Posyandu';
  destination_name: string;
  pic_name: string;
  notes: string;
  status: 'Draft' | 'Dikirim' | 'Diterima' | 'Dibatalkan';
  created_at: string;
  distribution_items?: DistributionItem[];
}

interface MenuPlan {
  id: string;
  tanggal: string;
  hari: string;
  tipe_porsi: string;
  penerima: string;
  gambar: string | null;
  nutrition_menu_db: {
    id: string;
    nama_menu: string;
    nasi: string;
    lauk_pauk: string;
    sayur: string;
    buah: string | null;
    minuman: string | null;
    kalori_est: number | null;
    protein_g: number | null;
    tipe_porsi: string;
  } | null;
}

interface Summary {
  total: number; draft: number; dikirim: number; diterima: number; dibatalkan: number;
}

const PORSI_CONFIG: Record<string, { label: string; icon: typeof UserRound; color: string; bg: string; text: string }> = {
  porsi_besar: { label: 'Porsi Besar', icon: UserRound, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  porsi_kecil: { label: 'Porsi Kecil', icon: Users, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  porsi_bayi: { label: 'Porsi Bayi', icon: Baby, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
};

const STATUS_CONFIG = {
  Draft: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText, label: 'Draft' },
  Dikirim: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send, label: 'Dikirim' },
  Diterima: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Diterima' },
  Dibatalkan: { color: 'bg-red-50 text-red-700 border-red-200', icon: Ban, label: 'Dibatalkan' },
};

const HARI_ORDER = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

const formatDate = (d: string) => {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getHariFromDate = (d: string) => {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long' });
};

export default function DistribusiModule() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [posyanduList, setPosyanduList] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, draft: 0, dikirim: 0, diterima: 0, dibatalkan: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupSql, setSetupSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'' | 'Sekolah' | 'Posyandu'>('');
  const [filterStatus, setFilterStatus] = useState<'' | 'Draft' | 'Dikirim' | 'Diterima' | 'Dibatalkan'>('');
  const [filterMonth, setFilterMonth] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingDist, setEditingDist] = useState<Distribution | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDestType, setFormDestType] = useState<'Sekolah' | 'Posyandu'>('Sekolah');
  const [formDestName, setFormDestName] = useState('');
  const [formPicName, setFormPicName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<DistributionItem[]>([]);
  const [formStatus, setFormStatus] = useState<'Draft' | 'Dikirim' | 'Diterima'>('Draft');
  const [customDest, setCustomDest] = useState(false);
  const [availableMenus, setAvailableMenus] = useState<MenuPlan[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('destination_type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      if (filterMonth) params.set('month', filterMonth);
      if (searchTerm) params.set('search', searchTerm);

      const [distRes, summaryRes, schoolRes, posRes] = await Promise.all([
        fetch(`/api/distributions?${params.toString()}`),
        fetch('/api/distributions?action=summary'),
        fetch('/api/distributions?action=schools'),
        fetch('/api/distributions?action=posyandu'),
      ]);

      if (distRes.ok) {
        const data = await distRes.json();
        if (data.error) {
          if (data.needsRlsFix || data.error.includes('permission denied') || data.error.includes('policy')) {
            setNeedsSetup(true); if (data.sql) setSetupSql(data.sql);
          } else if (data.error.includes('does not exist') || data.error.includes('relation')) {
            setNeedsSetup(true);
            const sRes = await fetch('/api/distributions?action=setup');
            if (sRes.ok) { const sData = await sRes.json(); setSetupSql(sData.sql); }
          }
        } else { setDistributions(data); }
      } else {
        const data = await distRes.json().catch(() => ({}));
        if (data.needsRlsFix || data.error?.includes('permission denied') || data.error?.includes('policy')) {
          setNeedsSetup(true); if (data.sql) setSetupSql(data.sql);
        } else if (data.error?.includes('does not exist') || data.error?.includes('relation')) {
          setNeedsSetup(true);
          const sRes = await fetch('/api/distributions?action=setup');
          if (sRes.ok) { const sData = await sRes.json(); setSetupSql(sData.sql); }
        }
      }

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (schoolRes.ok) setSchools(await schoolRes.json());
      if (posRes.ok) setPosyanduList(await posRes.json());
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [filterType, filterStatus, filterMonth, searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadMenusForDate = async (date: string) => {
    setLoadingMenus(true);
    try {
      const res = await fetch(`/api/distributions?action=menu-by-date&tanggal=${date}`);
      if (res.ok) { const data = await res.json(); setAvailableMenus(data); }
      else setAvailableMenus([]);
    } catch { setAvailableMenus([]); }
    finally { setLoadingMenus(false); }
  };

  const resetForm = () => {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormDestType('Sekolah');
    setFormDestName('');
    setFormPicName('');
    setFormNotes('');
    setFormItems([]);
    setFormStatus('Draft');
    setEditingDist(null);
    setCustomDest(false);
    setAvailableMenus([]);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); loadMenusForDate(new Date().toISOString().slice(0, 10)); };

  const openEditModal = (dist: Distribution) => {
    setEditingDist(dist);
    setFormDate(dist.distribution_date);
    setFormDestType(dist.destination_type);
    setFormDestName(dist.destination_name);
    setFormPicName(dist.pic_name || '');
    setFormNotes(dist.notes || '');
    setFormItems(dist.distribution_items?.map(i => ({
      weekly_plan_id: i.weekly_plan_id,
      menu_name: i.menu_name,
      tipe_porsi: i.tipe_porsi,
      nasi: i.nasi, lauk_pauk: i.lauk_pauk, sayur: i.sayur,
      buah: i.buah, minuman: i.minuman,
      jumlah_porsi: Number(i.jumlah_porsi),
      notes: i.notes || '',
    })) || []);
    setFormStatus(dist.status === 'Dibatalkan' ? 'Draft' : dist.status as 'Draft' | 'Dikirim' | 'Diterima');
    setCustomDest(false);
    setShowModal(true);
    loadMenusForDate(dist.distribution_date);
  };

  const autoFillMenuItems = () => {
    if (availableMenus.length === 0) {
      toast.info('Tidak ada menu untuk tanggal ini. Atur menu di modul Ahli Gizi & Menu terlebih dahulu.');
      return;
    }
    const items: DistributionItem[] = availableMenus.map(m => {
      const mdb = m.nutrition_menu_db;
      return {
        weekly_plan_id: m.id,
        menu_name: mdb?.nama_menu || `Menu ${m.hari} ${m.tipe_porsi}`,
        tipe_porsi: m.tipe_porsi,
        nasi: mdb?.nasi || null,
        lauk_pauk: mdb?.lauk_pauk || null,
        sayur: mdb?.sayur || null,
        buah: mdb?.buah || null,
        minuman: mdb?.minuman || null,
        jumlah_porsi: m.tipe_porsi === 'porsi_bayi' ? 15 : m.tipe_porsi === 'porsi_kecil' ? 35 : 30,
        notes: '',
      };
    });
    setFormItems(items);
    toast.success(`${items.length} menu ompreng ditambahkan dari Ahli Gizi`);
  };

  const addManualItem = () => {
    setFormItems([...formItems, {
      weekly_plan_id: null, menu_name: '', tipe_porsi: 'porsi_besar',
      nasi: 'Nasi Putih', lauk_pauk: '', sayur: '', buah: null, minuman: null,
      jumlah_porsi: 30, notes: '',
    }]);
  };

  const removeItemRow = (idx: number) => { setFormItems(formItems.filter((_, i) => i !== idx)); };

  const updateItemRow = (idx: number, field: string, value: string | number) => {
    const updated = [...formItems];
    (updated[idx] as Record<string, string | number>)[field] = value;
    setFormItems(updated);
  };

  const handleSave = async () => {
    if (!formDestName.trim()) { toast.error('Nama tujuan wajib diisi'); return; }
    if (formItems.length === 0) { toast.error('Tambahkan minimal 1 menu ompreng'); return; }
    const hasEmpty = formItems.some(i => !i.menu_name || i.jumlah_porsi <= 0);
    if (hasEmpty) { toast.error('Isi nama menu dan jumlah porsi yang valid'); return; }

    setSaving(true);
    try {
      const body = {
        distribution_date: formDate, destination_type: formDestType,
        destination_name: formDestName, pic_name: formPicName,
        notes: formNotes, status: formStatus, items: formItems,
      };
      const isEdit = !!editingDist;
      const url = isEdit ? `/api/distributions?id=${editingDist.id}` : '/api/distributions';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Save distribusi error:', JSON.stringify(data));
        throw new Error(data.error || `HTTP ${res.status}: Gagal menyimpan`);
      }
      toast.success(isEdit ? 'Distribusi diperbarui' : 'Distribusi ompreng ditambahkan');
      setShowModal(false); resetForm(); fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus distribusi ini?')) return;
    try {
      const res = await fetch(`/api/distributions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
      toast.success('Distribusi dihapus'); fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gagal menghapus'); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/distributions?id=${id}&action=status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');
      toast.success(`Status diubah ke ${newStatus}`); fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gagal mengubah status'); }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/distributions?action=seed', { method: 'GET' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyemai data');
      if (data.needsSetup || data.needsRlsFix) {
        setNeedsSetup(true); if (data.sql) setSetupSql(data.sql);
        toast.error('Tabel belum siap. Jalankan SQL setup di bawah ini.');
      } else if (data.seeded) {
        toast.success(`${data.count} distribusi, ${data.items || 0} menu ompreng disemai`); fetchData();
      } else { toast.info(data.message); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gagal'); }
    finally { setSeeding(false); }
  };

  const copySql = () => { navigator.clipboard.writeText(setupSql); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const destOptions = formDestType === 'Sekolah' ? schools : posyanduList;

  // Hitung total porsi per distribusi
  const totalPorsi = (items: DistributionItem[]) => items.reduce((s, i) => s + (Number(i.jumlah_porsi) || 0), 0);

  // ====================== SETUP SCREEN ======================
  if (needsSetup) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 rounded-xl"><Database className="w-6 h-6 text-white" /></div>
              <div>
                <h2 className="text-lg font-bold text-white">Setup Database Distribusi</h2>
                <p className="text-orange-100 text-sm">Tabel distribusi perlu disiapkan di Supabase</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Langkah:</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-700">
                  <li>Buka <strong>Supabase Dashboard</strong> → <strong>SQL Editor</strong></li>
                  <li>Klik <strong>Salin SQL</strong>, paste di SQL Editor, lalu <strong>Run</strong></li>
                  <li>Klik <strong>"Sudah Dijalankan, Cek Ulang"</strong></li>
                </ol>
              </div>
            </div>
            <div className="relative">
              <pre className="bg-slate-900 text-emerald-400 text-xs p-4 rounded-xl overflow-x-auto max-h-80 font-mono leading-relaxed">{setupSql}</pre>
              <button onClick={copySql} className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors" title="Salin SQL">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={copySql} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${copied ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Tersalin!' : 'Salin SQL'}
              </button>
              <button onClick={() => { setNeedsSetup(false); setLoading(true); setTimeout(fetchData, 300); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors">
                Sudah Dijalankan, Cek Ulang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================== MAIN UI ======================
  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: summary.total, icon: Truck, color: 'from-orange-500 to-amber-500', textColor: 'text-orange-600' },
          { label: 'Draft', value: summary.draft, icon: FileText, color: 'from-slate-400 to-slate-500', textColor: 'text-slate-500' },
          { label: 'Dikirim', value: summary.dikirim, icon: Send, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600' },
          { label: 'Diterima', value: summary.diterima, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-600' },
          { label: 'Dibatalkan', value: summary.dibatalkan, icon: Ban, color: 'from-red-500 to-red-600', textColor: 'text-red-600' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}><Icon className="w-4 h-4 text-white" /></div>
              </div>
              <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cari sekolah, posyandu, PIC..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>}
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as '' | 'Sekolah' | 'Posyandu')}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30">
            <option value="">Semua Tipe</option><option value="Sekolah">Sekolah</option><option value="Posyandu">Posyandu</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as '' | 'Draft' | 'Dikirim' | 'Diterima' | 'Dibatalkan')}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30">
            <option value="">Semua Status</option><option value="Draft">Draft</option><option value="Dikirim">Dikirim</option><option value="Diterima">Diterima</option><option value="Dibatalkan">Dibatalkan</option>
          </select>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
          <div className="flex gap-2">
            <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-orange-500/20 active:scale-95">
              <Plus className="w-4 h-4" /> Buat Distribusi
            </button>
            <button onClick={handleSeed} disabled={seeding} className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors active:scale-95">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />} Seed
            </button>
          </div>
        </div>
      </div>

      {/* Distribution List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : distributions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-2xl flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-orange-300" /></div>
          <h3 className="text-lg font-semibold text-slate-600 mb-1">Belum Ada Distribusi Ompreng</h3>
          <p className="text-sm text-slate-400 mb-4">Buat distribusi makanan harian ke sekolah atau posyandu</p>
          <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Buat Distribusi Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {distributions.map((dist) => {
            const statusCfg = STATUS_CONFIG[dist.status];
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === dist.id;
            const items = dist.distribution_items || [];
            const hari = getHariFromDate(dist.distribution_date);
            const tPorsi = totalPorsi(items);

            return (
              <div key={dist.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Header */}
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 ${dist.destination_type === 'Sekolah' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                        {dist.destination_type === 'Sekolah' ? <School className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-800 truncate">{dist.destination_name}</h3>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${dist.destination_type === 'Sekolah' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
                            {dist.destination_type}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {hari}, {formatDate(dist.distribution_date)}</span>
                          {dist.pic_name && <span>PIC: {dist.pic_name}</span>}
                          <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> {items.length} menu, {tPorsi} porsi</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {dist.status === 'Draft' && (
                        <button onClick={() => handleStatusChange(dist.id, 'Dikirim')} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors" title="Kirim"><Send className="w-4 h-4" /></button>
                      )}
                      {dist.status === 'Dikirim' && (
                        <button onClick={() => handleStatusChange(dist.id, 'Diterima')} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors" title="Tanda terima"><CheckCircle2 className="w-4 h-4" /></button>
                      )}
                      {dist.status !== 'Dibatalkan' && dist.status !== 'Diterima' && (
                        <button onClick={() => { if (confirm('Batalkan?')) handleStatusChange(dist.id, 'Dibatalkan'); }} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors" title="Batalkan"><Ban className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => setExpandedId(isExpanded ? null : dist.id)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors" title="Detail">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEditModal(dist)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(dist.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {dist.notes && <p className="mt-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">{dist.notes}</p>}
                </div>

                {/* Expanded: Detail Menu Ompreng */}
                {isExpanded && items.length > 0 && (
                  <div className="border-t border-slate-100 bg-gradient-to-b from-orange-50/30 to-white">
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-3">
                        <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Menu Ompreng</span>
                        <div className="flex-1 border-t border-dashed border-orange-200" />
                        <span className="text-xs font-bold text-orange-600">{tPorsi} porsi total</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((item, idx) => {
                          const porsiCfg = PORSI_CONFIG[item.tipe_porsi] || PORSI_CONFIG.porsi_besar;
                          const PorsiIcon = porsiCfg.icon;
                          return (
                            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div className={`p-1.5 rounded-lg ${porsiCfg.bg}`}><PorsiIcon className={`w-4 h-4 ${porsiCfg.text}`} /></div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${porsiCfg.bg} ${porsiCfg.text}`}>{porsiCfg.label}</span>
                              </div>
                              <h4 className="font-semibold text-slate-800 text-sm mb-2 leading-tight">{item.menu_name}</h4>
                              <div className="space-y-1 text-xs text-slate-500">
                                {item.nasi && <div className="flex gap-2"><span className="text-slate-400 w-14 shrink-0">Nasi</span><span className="text-slate-700">{item.nasi}</span></div>}
                                {item.lauk_pauk && <div className="flex gap-2"><span className="text-slate-400 w-14 shrink-0">Lauk</span><span className="text-slate-700">{item.lauk_pauk}</span></div>}
                                {item.sayur && <div className="flex gap-2"><span className="text-slate-400 w-14 shrink-0">Sayur</span><span className="text-slate-700">{item.sayur}</span></div>}
                                {item.buah && <div className="flex gap-2"><span className="text-slate-400 w-14 shrink-0">Buah</span><span className="text-slate-700">{item.buah}</span></div>}
                                {item.minuman && <div className="flex gap-2"><span className="text-slate-400 w-14 shrink-0">Minum</span><span className="text-slate-700">{item.minuman}</span></div>}
                              </div>
                              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-400">Jumlah porsi</span>
                                <span className="text-sm font-bold text-orange-600">{item.jumlah_porsi} <span className="font-normal text-slate-400">porsi</span></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ====================== MODAL ====================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><UtensilsCrossed className="w-5 h-5 text-white" /></div>
                <h2 className="text-lg font-bold text-white">{editingDist ? 'Edit Distribusi Ompreng' : 'Distribusi Ompreng Baru'}</h2>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5 text-white" /></button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Row 1: Tanggal & Tipe Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Distribusi</label>
                  <input type="date" value={formDate} onChange={e => { setFormDate(e.target.value); loadMenusForDate(e.target.value); }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipe Tujuan</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setFormDestType('Sekolah'); setFormDestName(''); setCustomDest(false); }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${formDestType === 'Sekolah' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                      <School className="w-4 h-4" /> Sekolah
                    </button>
                    <button type="button" onClick={() => { setFormDestType('Posyandu'); setFormDestName(''); setCustomDest(false); }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${formDestType === 'Posyandu' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                      <Building2 className="w-4 h-4" /> Posyandu
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Tujuan & PIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">{formDestType === 'Sekolah' ? 'Nama Sekolah' : 'Nama Posyandu'}</label>
                    <button type="button" onClick={() => setCustomDest(!customDest)} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                      {customDest ? 'Pilih dari database' : 'Input manual'}
                    </button>
                  </div>
                  {customDest ? (
                    <input type="text" value={formDestName} onChange={e => setFormDestName(e.target.value)} placeholder={`Ketik nama ${formDestType.toLowerCase()}...`}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
                  ) : (
                    <select value={formDestName} onChange={e => setFormDestName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500">
                      <option value="">-- Pilih {formDestType} --</option>
                      {destOptions.map(name => <option key={name} value={name}>{name}</option>)}
                      {destOptions.length === 0 && <option disabled>Belum ada data {formDestType.toLowerCase()}</option>}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">PIC Penerima</label>
                  <input type="text" value={formPicName} onChange={e => setFormPicName(e.target.value)} placeholder="Nama PIC"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
                </div>
              </div>

              {/* Notes & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan</label>
                  <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Catatan (opsional)" rows={2}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none" />
                </div>
                {!editingDist && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                    <select value={formStatus} onChange={e => setFormStatus(e.target.value as 'Draft' | 'Dikirim' | 'Diterima')}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500">
                      <option value="Draft">Draft</option><option value="Dikirim">Dikirim</option><option value="Diterima">Diterima</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Menu Ompreng Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                    <label className="text-sm font-medium text-slate-700">Menu Ompreng</label>
                    <span className="text-xs text-slate-400">({formItems.length} menu, {totalPorsi(formItems)} porsi)</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={autoFillMenuItems} disabled={loadingMenus}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                      {loadingMenus ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                      Ambil dari Menu Ahli Gizi
                    </button>
                    <button type="button" onClick={addManualItem}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium transition-colors">
                      <Plus className="w-3 h-3" /> Manual
                    </button>
                  </div>
                </div>

                {formItems.length === 0 ? (
                  <div className="bg-orange-50/50 border border-dashed border-orange-200 rounded-xl p-8 text-center">
                    <UtensilsCrossed className="w-8 h-8 text-orange-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-1">Belum ada menu ompreng</p>
                    <p className="text-xs text-slate-400">Klik <strong>"Ambil dari Menu Ahli Gizi"</strong> untuk otomatis mengisi menu hari ini, atau <strong>"Manual"</strong> untuk input sendiri.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formItems.map((item, idx) => {
                      const porsiCfg = PORSI_CONFIG[item.tipe_porsi] || PORSI_CONFIG.porsi_besar;
                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex gap-2">
                                <select value={item.tipe_porsi} onChange={e => updateItemRow(idx, 'tipe_porsi', e.target.value)}
                                  className="w-32 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                                  <option value="porsi_besar">Porsi Besar</option><option value="porsi_kecil">Porsi Kecil</option><option value="porsi_bayi">Porsi Bayi</option>
                                </select>
                                <input type="text" value={item.menu_name} onChange={e => updateItemRow(idx, 'menu_name', e.target.value)} placeholder="Nama menu"
                                  className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
                                <div className="flex items-center gap-1 w-24">
                                  <input type="number" min="1" value={item.jumlah_porsi || ''} onChange={e => updateItemRow(idx, 'jumlah_porsi', parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
                                  <span className="text-[10px] text-slate-400 whitespace-nowrap">porsi</span>
                                </div>
                                <button type="button" onClick={() => removeItemRow(idx)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                                <div className="flex gap-1"><span className="text-slate-400 shrink-0">Nasi:</span><span className="text-slate-600 truncate">{item.nasi || '-'}</span></div>
                                <div className="flex gap-1"><span className="text-slate-400 shrink-0">Lauk:</span><span className="text-slate-600 truncate">{item.lauk_pauk || '-'}</span></div>
                                <div className="flex gap-1"><span className="text-slate-400 shrink-0">Sayur:</span><span className="text-slate-600 truncate">{item.sayur || '-'}</span></div>
                                <div className="flex gap-1"><span className="text-slate-400 shrink-0">Buah:</span><span className="text-slate-600 truncate">{item.buah || '-'}</span></div>
                                <div className="flex gap-1"><span className="text-slate-400 shrink-0">Minum:</span><span className="text-slate-600 truncate">{item.minuman || '-'}</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-50 active:scale-95">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                {editingDist ? 'Perbarui' : 'Simpan Distribusi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
