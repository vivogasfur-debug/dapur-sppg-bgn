'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Search, X, Trash2, Pencil, Loader2, Truck, School, Building2,
  Database, Copy, Check, ChevronDown, ChevronUp, Package, Send, CheckCircle2,
  Ban, FileText, AlertTriangle, Warehouse, ArrowRight, Calendar
} from 'lucide-react';

interface DistributionItem {
  id?: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit: string;
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

interface StockItem {
  id: string;
  name: string;
  unit: string;
  stock_qty: number;
  category: string;
}

interface Summary {
  total: number;
  draft: number;
  dikirim: number;
  diterima: number;
  dibatalkan: number;
}

const STATUS_CONFIG = {
  Draft: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText, label: 'Draft' },
  Dikirim: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send, label: 'Dikirim' },
  Diterima: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Diterima' },
  Dibatalkan: { color: 'bg-red-50 text-red-700 border-red-200', icon: Ban, label: 'Dibatalkan' },
};

const formatDate = (d: string) => {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function DistribusiModule() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
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

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDestType, setFormDestType] = useState<'Sekolah' | 'Posyandu'>('Sekolah');
  const [formDestName, setFormDestName] = useState('');
  const [formPicName, setFormPicName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<DistributionItem[]>([]);
  const [formStatus, setFormStatus] = useState<'Draft' | 'Dikirim' | 'Diterima'>('Draft');
  const [customDest, setCustomDest] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('destination_type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      if (filterMonth) params.set('month', filterMonth);
      if (searchTerm) params.set('search', searchTerm);

      const [distRes, summaryRes, stockRes, schoolRes, posRes] = await Promise.all([
        fetch(`/api/distributions?${params.toString()}`),
        fetch('/api/distributions?action=summary'),
        fetch('/api/distributions?action=stock-items'),
        fetch('/api/distributions?action=schools'),
        fetch('/api/distributions?action=posyandu'),
      ]);

      if (distRes.ok) {
        const data = await distRes.json();
        if (data.error) {
          if (data.error.includes('does not exist') || data.error.includes('relation')) {
            setNeedsSetup(true);
            const setupRes = await fetch('/api/distributions?action=setup');
            if (setupRes.ok) {
              const setupData = await setupRes.json();
              setSetupSql(setupData.sql);
            }
          }
        } else {
          setDistributions(data);
        }
      } else {
        const data = await distRes.json().catch(() => ({}));
        if (data.error?.includes('does not exist') || data.error?.includes('relation')) {
          setNeedsSetup(true);
          const setupRes = await fetch('/api/distributions?action=setup');
          if (setupRes.ok) {
            const setupData = await setupRes.json();
            setSetupSql(setupData.sql);
          }
        }
      }

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (stockRes.ok) setStockItems(await stockRes.json());
      if (schoolRes.ok) setSchools(await schoolRes.json());
      if (posRes.ok) setPosyanduList(await posRes.json());
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, filterMonth, searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (dist: Distribution) => {
    setEditingDist(dist);
    setFormDate(dist.distribution_date);
    setFormDestType(dist.destination_type);
    setFormDestName(dist.destination_name);
    setFormPicName(dist.pic_name || '');
    setFormNotes(dist.notes || '');
    setFormItems(dist.distribution_items?.map(i => ({
      item_id: i.item_id,
      item_name: i.item_name,
      quantity: Number(i.quantity),
      unit: i.unit,
      notes: i.notes || '',
    })) || []);
    setFormStatus(dist.status === 'Dibatalkan' ? 'Draft' : dist.status as 'Draft' | 'Dikirim' | 'Diterima');
    setCustomDest(false);
    setShowModal(true);
  };

  const addItemRow = () => {
    setFormItems([...formItems, { item_id: '', item_name: '', quantity: 0, unit: 'pcs', notes: '' }]);
  };

  const removeItemRow = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: string, value: string | number) => {
    const updated = [...formItems];
    (updated[idx] as Record<string, string | number>)[field] = value;
    if (field === 'item_id') {
      const si = stockItems.find(s => s.id === value);
      if (si) {
        updated[idx].item_name = si.name;
        updated[idx].unit = si.unit;
      }
    }
    setFormItems(updated);
  };

  const handleSave = async () => {
    if (!formDestName.trim()) {
      toast.error('Nama tujuan wajib diisi');
      return;
    }
    if (formItems.length === 0) {
      toast.error('Tambahkan minimal 1 barang');
      return;
    }
    const hasEmptyItem = formItems.some(i => !i.item_id || i.quantity <= 0);
    if (hasEmptyItem) {
      toast.error('Pilih barang dan isi jumlah yang valid');
      return;
    }

    setSaving(true);
    try {
      const body = {
        distribution_date: formDate,
        destination_type: formDestType,
        destination_name: formDestName,
        pic_name: formPicName,
        notes: formNotes,
        status: formStatus,
        items: formItems,
      };

      const isEdit = !!editingDist;
      const url = isEdit
        ? `/api/distributions?id=${editingDist.id}`
        : '/api/distributions';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');

      toast.success(isEdit ? 'Distribusi diperbarui' : 'Distribusi ditambahkan');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus distribusi ini? Stok akan dikembalikan jika sudah dikirim.')) return;
    try {
      const res = await fetch(`/api/distributions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
      toast.success('Distribusi dihapus');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/distributions?id=${id}&action=status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');
      toast.success(`Status diubah ke ${newStatus}`);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status');
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/distributions?action=seed', { method: 'GET' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyemai data');
      if (data.seeded) {
        toast.success(`${data.count} data distribusi disemai`);
        fetchData();
      } else {
        toast.info(data.message);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal');
    } finally {
      setSeeding(false);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(setupSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const destOptions = formDestType === 'Sekolah' ? schools : posyanduList;

  // ====================== SETUP SCREEN ======================
  if (needsSetup) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Setup Database Distribusi</h2>
                <p className="text-orange-100 text-sm">Tabel distribusi belum dibuat di Supabase</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Langkah Setup:</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-700">
                  <li>Buka <strong>Supabase Dashboard</strong> → SQL Editor</li>
                  <li>Salin SQL di bawah, lalu jalankan (Run)</li>
                  <li>Kembali ke halaman ini dan refresh</li>
                </ol>
              </div>
            </div>
            <div className="relative">
              <pre className="bg-slate-900 text-emerald-400 text-xs p-4 rounded-xl overflow-x-auto max-h-80 font-mono leading-relaxed">
                {setupSql}
              </pre>
              <button
                onClick={copySql}
                className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                title="Salin SQL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
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
          { label: 'Total', value: summary.total, icon: Truck, color: 'from-slate-600 to-slate-700', textColor: 'text-slate-600' },
          { label: 'Draft', value: summary.draft, icon: FileText, color: 'from-slate-400 to-slate-500', textColor: 'text-slate-500' },
          { label: 'Dikirim', value: summary.dikirim, icon: Send, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600' },
          { label: 'Diterima', value: summary.diterima, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-600' },
          { label: 'Dibatalkan', value: summary.dibatalkan, icon: Ban, color: 'from-red-500 to-red-600', textColor: 'text-red-600' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
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
            <input
              type="text"
              placeholder="Cari tujuan, PIC, catatan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as '' | 'Sekolah' | 'Posyandu')}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">Semua Tipe</option>
            <option value="Sekolah">Sekolah</option>
            <option value="Posyandu">Posyandu</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as '' | 'Draft' | 'Dikirim' | 'Diterima' | 'Dibatalkan')}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Dikirim">Dikirim</option>
            <option value="Diterima">Diterima</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>

          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />

          <div className="flex gap-2">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors active:scale-95"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Seed
            </button>
          </div>
        </div>
      </div>

      {/* Distribution List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : distributions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Truck className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-1">Belum Ada Distribusi</h3>
          <p className="text-sm text-slate-400 mb-4">Mulai catat distribusi barang ke sekolah atau posyandu</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Buat Distribusi Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {distributions.map((dist) => {
            const statusCfg = STATUS_CONFIG[dist.status];
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === dist.id;
            const totalItems = dist.distribution_items?.length || 0;

            return (
              <div key={dist.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Header Row */}
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Dest Icon & Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        dist.destination_type === 'Sekolah'
                          ? 'bg-blue-50 text-blue-500'
                          : 'bg-purple-50 text-purple-500'
                      }`}>
                        {dist.destination_type === 'Sekolah'
                          ? <School className="w-5 h-5" />
                          : <Building2 className="w-5 h-5" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-800 truncate">{dist.destination_name}</h3>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                            dist.destination_type === 'Sekolah'
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : 'bg-purple-50 text-purple-600 border-purple-200'
                          }`}>
                            {dist.destination_type}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(dist.distribution_date)}</span>
                          {dist.pic_name && <span>PIC: {dist.pic_name}</span>}
                          <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {totalItems} item</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Status Quick Actions */}
                      {dist.status === 'Draft' && (
                        <button
                          onClick={() => handleStatusChange(dist.id, 'Dikirim')}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          title="Kirim"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {dist.status === 'Dikirim' && (
                        <button
                          onClick={() => handleStatusChange(dist.id, 'Diterima')}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                          title="Tanda terima"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {dist.status !== 'Dibatalkan' && dist.status !== 'Diterima' && (
                        <button
                          onClick={() => {
                            if (confirm('Batalkan distribusi ini?')) handleStatusChange(dist.id, 'Dibatalkan');
                          }}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                          title="Batalkan"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : dist.id)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                        title="Detail"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(dist)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dist.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {dist.notes && (
                    <p className="mt-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">{dist.notes}</p>
                  )}
                </div>

                {/* Expanded Items */}
                {isExpanded && dist.distribution_items && dist.distribution_items.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/50">
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Daftar Barang</span>
                        <div className="flex-1 border-t border-dashed border-slate-200" />
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {dist.distribution_items.map((item, idx) => {
                          const si = stockItems.find(s => s.id === item.item_id);
                          return (
                            <div key={idx} className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-700 truncate">{item.item_name}</p>
                                <p className="text-xs text-slate-400">
                                  {Number(item.quantity)} {item.unit}
                                </p>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editingDist ? 'Edit Distribusi' : 'Distribusi Baru'}
                </h2>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Date & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Distribusi</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipe Tujuan</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setFormDestType('Sekolah'); setFormDestName(''); setCustomDest(false); }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                        formDestType === 'Sekolah'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <School className="w-4 h-4" /> Sekolah
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFormDestType('Posyandu'); setFormDestName(''); setCustomDest(false); }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                        formDestType === 'Posyandu'
                          ? 'bg-purple-50 border-purple-300 text-purple-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <Building2 className="w-4 h-4" /> Posyandu
                    </button>
                  </div>
                </div>
              </div>

              {/* Destination Name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    {formDestType === 'Sekolah' ? 'Nama Sekolah' : 'Nama Posyandu'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomDest(!customDest)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    {customDest ? 'Pilih dari database' : 'Input manual'}
                  </button>
                </div>
                {customDest ? (
                  <input
                    type="text"
                    value={formDestName}
                    onChange={e => setFormDestName(e.target.value)}
                    placeholder={formDestType === 'Sekolah' ? 'Ketik nama sekolah...' : 'Ketik nama posyandu...'}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                ) : (
                  <select
                    value={formDestName}
                    onChange={e => setFormDestName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="">-- Pilih {formDestType === 'Sekolah' ? 'Sekolah' : 'Posyandu'} --</option>
                    {destOptions.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    {destOptions.length === 0 && (
                      <option disabled>Belum ada data {formDestType === 'Sekolah' ? 'sekolah' : 'posyandu'} di database</option>
                    )}
                  </select>
                )}
                {destOptions.length === 0 && !customDest && (
                  <p className="text-xs text-amber-600 mt-1">
                    Belum ada data {formDestType === 'Sekolah' ? 'sekolah (tabel students)' : 'posyandu (tabel beneficiaries_3b)'}.
                    Klik &quot;Input manual&quot; untuk menulis sendiri.
                  </p>
                )}
              </div>

              {/* PIC & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">PIC Penerima</label>
                  <input
                    type="text"
                    value={formPicName}
                    onChange={e => setFormPicName(e.target.value)}
                    placeholder="Nama PIC"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                {!editingDist && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status Awal</label>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as 'Draft' | 'Dikirim' | 'Diterima')}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    >
                      <option value="Draft">Draft (stok belum dikurangi)</option>
                      <option value="Dikirim">Dikirim (stok dikurangi otomatis)</option>
                      <option value="Diterima">Diterima (stok dikurangi otomatis)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Catatan tambahan (opsional)"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-500" />
                    <label className="text-sm font-medium text-slate-700">Barang dari Gudang</label>
                    <span className="text-xs text-slate-400">({formItems.length} item)</span>
                  </div>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Tambah Barang
                  </button>
                </div>

                {formItems.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center">
                    <Warehouse className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Belum ada barang. Klik &quot;Tambah Barang&quot; untuk memilih dari stok gudang.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formItems.map((item, idx) => {
                      const selectedItem = stockItems.find(s => s.id === item.item_id);
                      const availableQty = selectedItem ? Number(selectedItem.stock_qty) : 0;
                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 min-w-0">
                            <select
                              value={item.item_id}
                              onChange={e => updateItemRow(idx, 'item_id', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                            >
                              <option value="">-- Pilih Barang --</option>
                              {stockItems.map(si => (
                                <option key={si.id} value={si.id}>
                                  {si.name} (stok: {si.stock_qty} {si.unit}) — {si.category}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-28">
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={item.quantity || ''}
                                onChange={e => updateItemRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                placeholder="Jumlah"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                              />
                              {selectedItem && (
                                <p className="text-[10px] text-slate-400 mt-0.5">Tersedia: {availableQty} {item.unit}</p>
                              )}
                            </div>
                            <div className="w-20 flex items-center">
                              <span className="text-sm text-slate-500 font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg w-full text-center">
                                {item.unit || '-'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors self-start"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
              >
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
