'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ClipboardCheck, Plus, Search, X, Trash2, Pencil, Loader2,
  MapPin, School, Baby, Calendar, FileText, CheckCircle2, Clock,
  AlertCircle, BarChart3, Filter, Copy, Check, ChevronDown, Eye, EyeOff
} from 'lucide-react';

interface AslapActivity {
  id: string;
  visit_date: string;
  location_type: 'Sekolah' | 'Posyandu';
  location_name: string;
  activity_type: 'Distribusi' | 'Pendataan' | 'Pemantauan' | 'Sosialisasi' | 'Lainnya';
  status: 'Selesai' | 'Proses' | 'Dibatalkan';
  porsi_kecil: number;
  porsi_besar: number;
  notes: string | null;
  created_at: string;
}

const LOCATION_TYPES: AslapActivity['location_type'][] = ['Sekolah', 'Posyandu'];
const ACTIVITY_TYPES: AslapActivity['activity_type'][] = ['Distribusi', 'Pendataan', 'Pemantauan', 'Sosialisasi', 'Lainnya'];
const STATUSES: AslapActivity['status'][] = ['Selesai', 'Proses', 'Dibatalkan'];

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Selesai': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Proses': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Dibatalkan': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const ACTIVITY_COLORS: Record<string, string> = {
  'Distribusi': 'bg-sky-100 text-sky-700',
  'Pendataan': 'bg-violet-100 text-violet-700',
  'Pemantauan': 'bg-amber-100 text-amber-700',
  'Sosialisasi': 'bg-pink-100 text-pink-700',
  'Lainnya': 'bg-slate-100 text-slate-700',
};

const SETUP_SQL = `CREATE TABLE IF NOT EXISTS public.aslap_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_date DATE NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('Sekolah', 'Posyandu')),
  location_name TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('Distribusi', 'Pendataan', 'Pemantauan', 'Sosialisasi', 'Lainnya')),
  status TEXT NOT NULL DEFAULT 'Selesai' CHECK (status IN ('Selesai', 'Proses', 'Dibatalkan')),
  porsi_kecil INTEGER DEFAULT 0,
  porsi_besar INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.aslap_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.aslap_activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.aslap_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.aslap_activities FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.aslap_activities FOR DELETE USING (true);`;

export default function AslapModule() {
  const [activities, setActivities] = useState<AslapActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupSql, setSetupSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AslapActivity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterActivity, setFilterActivity] = useState('');

  // Form
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLocationType, setFormLocationType] = useState<AslapActivity['location_type']>('Sekolah');
  const [formLocationName, setFormLocationName] = useState('');
  const [formActivityType, setFormActivityType] = useState<AslapActivity['activity_type']>('Distribusi');
  const [formStatus, setFormStatus] = useState<AslapActivity['status']>('Selesai');
  const [formPorsiKecil, setFormPorsiKecil] = useState('');
  const [formPorsiBesar, setFormPorsiBesar] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/aslap-activities');
      const json = await res.json();
      if (json.needsSetup) {
        setNeedsSetup(true);
        setSetupSql(json.sql || SETUP_SQL);
        setLoading(false);
        return;
      }
      if (json.error) {
        // If error but no needsSetup flag, check if it looks like missing table
        const errMsg = (json.error || '').toLowerCase();
        if (errMsg.includes('aslap') || errMsg.includes('schema') || errMsg.includes('does not exist')) {
          setNeedsSetup(true);
          setSetupSql(SETUP_SQL);
        } else {
          toast.error(json.error);
        }
        setLoading(false);
        return;
      }
      setActivities(Array.isArray(json) ? json : []);
    } catch {
      toast.error('Gagal memuat data aktivitas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const resetForm = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormLocationType('Sekolah');
    setFormLocationName('');
    setFormActivityType('Distribusi');
    setFormStatus('Selesai');
    setFormPorsiKecil('');
    setFormPorsiBesar('');
    setFormNotes('');
    setEditingItem(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (item: AslapActivity) => {
    setEditingItem(item);
    setFormDate(item.visit_date);
    setFormLocationType(item.location_type);
    setFormLocationName(item.location_name);
    setFormActivityType(item.activity_type);
    setFormStatus(item.status);
    setFormPorsiKecil(String(item.porsi_kecil || ''));
    setFormPorsiBesar(String(item.porsi_besar || ''));
    setFormNotes(item.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formLocationName.trim()) { toast.error('Nama lokasi wajib diisi'); return; }
    if (!formDate) { toast.error('Tanggal kunjungan wajib diisi'); return; }

    setSaving(true);
    try {
      const body = {
        visitDate: formDate,
        locationType: formLocationType,
        locationName: formLocationName.trim(),
        activityType: formActivityType,
        status: formStatus,
        porsiKecil: parseInt(formPorsiKecil) || 0,
        porsiBesar: parseInt(formPorsiBesar) || 0,
        notes: formNotes.trim() || null,
      };

      if (editingItem) {
        const res = await fetch(`/api/aslap-activities?id=${editingItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        toast.success('Aktivitas berhasil diperbarui');
      } else {
        const res = await fetch('/api/aslap-activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        toast.success('Aktivitas berhasil ditambahkan');
      }
      setShowModal(false);
      fetchActivities();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/aslap-activities?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success('Aktivitas berhasil dihapus');
      setDeleteConfirm(null);
      fetchActivities();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menghapus');
    } finally {
      setSaving(false);
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(setupSql || SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered data
  const filtered = activities.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterLocation && a.location_type !== filterLocation) return false;
    if (filterActivity && a.activity_type !== filterActivity) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.location_name.toLowerCase().includes(q) || (a.notes || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const totalActivities = activities.length;
  const selesai = activities.filter(a => a.status === 'Selesai').length;
  const proses = activities.filter(a => a.status === 'Proses').length;
  const dibatalkan = activities.filter(a => a.status === 'Dibatalkan').length;
  const totalPorsiKecil = activities.reduce((s, a) => s + (a.porsi_kecil || 0), 0);
  const totalPorsiBesar = activities.reduce((s, a) => s + (a.porsi_besar || 0), 0);
  const sekolahVisits = activities.filter(a => a.location_type === 'Sekolah').length;
  const posyanduVisits = activities.filter(a => a.location_type === 'Posyandu').length;

  // Setup needed
  if (needsSetup) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">ASLAP</h2>
              <p className="text-sm text-slate-400">Asisten Lapangan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-50 rounded-xl shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Setup Tabel Diperlukan</h3>
              <p className="text-sm text-slate-500 mb-4">Jalankan SQL berikut di <strong>Supabase SQL Editor</strong> (<a href="https://supabase.com/dashboard/project/zwbspstsbpzsnphdohko/sql" target="_blank" className="text-emerald-600 underline">buka di sini</a>), lalu refresh halaman ini.</p>
              <div className="relative">
                <pre className="bg-slate-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto max-h-64 overflow-y-auto font-mono leading-relaxed">{setupSql || SETUP_SQL}</pre>
                <button onClick={copySQL} className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ASLAP</h2>
              <p className="text-xs text-slate-400">Asisten Lapangan — Aktivitas Kunjungan</p>
            </div>
          </div>
          <button onClick={openAddModal} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-emerald-500/30">
            <Plus className="w-4 h-4" /> Tambah Aktivitas
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Kunjungan</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><ClipboardCheck className="w-3.5 h-3.5" /></div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">{totalActivities}</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Selesai {selesai} | Proses {proses}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Lokasi</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><MapPin className="w-3.5 h-3.5" /></div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">{sekolahVisits + posyanduVisits}</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Sekolah {sekolahVisits} | Posyandu {posyanduVisits}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Porsi Terdistribusi</span>
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg"><BarChart3 className="w-3.5 h-3.5" /></div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-sky-600">{totalPorsiKecil}</span>
            <span className="text-[10px] text-slate-400">kecil +</span>
            <span className="text-sm font-bold text-orange-500">{totalPorsiBesar}</span>
            <span className="text-[10px] text-slate-400">besar</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Total: {totalPorsiKecil + totalPorsiBesar} porsi</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Dibatalkan</span>
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="w-3.5 h-3.5" /></div>
          </div>
          <h2 className="text-2xl font-extrabold text-red-600">{dibatalkan}</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">dari {totalActivities} aktivitas</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Cari lokasi atau catatan..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" /></button>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
              <option value="">Semua Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
              <option value="">Semua Lokasi</option>
              {LOCATION_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filterActivity} onChange={e => setFilterActivity(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
              <option value="">Semua Aktivitas</option>
              {ACTIVITY_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="p-3 bg-slate-100 rounded-2xl inline-block mb-3"><ClipboardCheck className="w-8 h-8 text-slate-300" /></div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Belum Ada Aktivitas</h3>
          <p className="text-xs text-slate-400">Klik &quot;Tambah Aktivitas&quot; untuk mencatat kunjungan lapangan pertama.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-slate-400 uppercase">Tanggal</th>
                  <th className="py-3 px-3 text-left text-[10px] font-bold text-slate-400 uppercase">Lokasi</th>
                  <th className="py-3 px-3 text-left text-[10px] font-bold text-slate-400 uppercase">Aktivitas</th>
                  <th className="py-3 px-3 text-center text-[10px] font-bold text-slate-400 uppercase">Porsi Kcl</th>
                  <th className="py-3 px-3 text-center text-[10px] font-bold text-slate-400 uppercase">Porsi Bsr</th>
                  <th className="py-3 px-3 text-center text-[10px] font-bold text-slate-400 uppercase">Status</th>
                  <th className="py-3 px-3 text-left text-[10px] font-bold text-slate-400 uppercase">Catatan</th>
                  <th className="py-3 px-3 text-center text-[10px] font-bold text-slate-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(a => {
                  const st = STATUS_STYLES[a.status] || STATUS_STYLES['Selesai'];
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{new Date(a.visit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {a.location_type === 'Sekolah' ? <School className="w-3.5 h-3.5 text-blue-500" /> : <Baby className="w-3.5 h-3.5 text-amber-500" />}
                          <div>
                            <span className="text-xs font-medium text-slate-700 block">{a.location_name}</span>
                            <span className="text-[10px] text-slate-400">{a.location_type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${ACTIVITY_COLORS[a.activity_type] || 'bg-slate-100 text-slate-700'}`}>{a.activity_type}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-xs font-bold text-sky-600">{a.porsi_kecil || 0}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-xs font-bold text-orange-500">{a.porsi_besar || 0}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{a.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-slate-500 line-clamp-1 max-w-[150px] block">{a.notes || '-'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditModal(a)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                          {deleteConfirm === a.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(a.id)} disabled={saving} className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-md hover:bg-red-600">Ya</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-md hover:bg-slate-300">Tidak</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filtered.map(a => {
              const st = STATUS_STYLES[a.status] || STATUS_STYLES['Selesai'];
              return (
                <div key={a.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {a.location_type === 'Sekolah' ? <School className="w-4 h-4 text-blue-500" /> : <Baby className="w-4 h-4 text-amber-500" />}
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block">{a.location_name}</span>
                        <span className="text-[10px] text-slate-400">{a.location_type}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.bg} ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{a.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.visit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className={`px-1.5 py-0.5 rounded-md font-semibold ${ACTIVITY_COLORS[a.activity_type]}`}>{a.activity_type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span className="text-[10px] text-slate-500">Porsi Kecil:</span>
                      <span className="text-xs font-bold text-sky-600">{a.porsi_kecil || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="text-[10px] text-slate-500">Porsi Besar:</span>
                      <span className="text-xs font-bold text-orange-500">{a.porsi_besar || 0}</span>
                    </div>
                  </div>
                  {a.notes && <p className="text-[10px] text-slate-400 italic">{a.notes}</p>}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                    <button onClick={() => openEditModal(a)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                    {deleteConfirm === a.id ? (
                      <>
                        <button onClick={() => handleDelete(a.id)} disabled={saving} className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-md">Hapus</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-md">Batal</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer count */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Menampilkan {filtered.length} dari {activities.length} aktivitas</span>
            <span className="text-[10px] text-slate-400">Total porsi: <strong className="text-sky-600">{totalPorsiKecil}</strong> kecil + <strong className="text-orange-500">{totalPorsiBesar}</strong> besar = <strong>{totalPorsiKecil + totalPorsiBesar}</strong></span>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">{editingItem ? 'Edit Aktivitas' : 'Tambah Aktivitas Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal Kunjungan <span className="text-red-500">*</span></label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </div>

              {/* Tipe Lokasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipe Lokasi</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATION_TYPES.map(lt => (
                    <button key={lt} type="button" onClick={() => setFormLocationType(lt)} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${formLocationType === lt ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                      {lt === 'Sekolah' ? <School className="w-4 h-4" /> : <Baby className="w-4 h-4" />}{lt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nama Lokasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lokasi <span className="text-red-500">*</span></label>
                <input type="text" placeholder={formLocationType === 'Sekolah' ? 'Contoh: SDN 1 Baubau' : 'Contoh: Posyandu Melati'} value={formLocationName} onChange={e => setFormLocationName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </div>

              {/* Jenis Aktivitas */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jenis Aktivitas</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.map(at => (
                    <button key={at} type="button" onClick={() => setFormActivityType(at)} className={`py-2 rounded-lg text-[10px] font-semibold transition-all ${formActivityType === at ? ACTIVITY_COLORS[at] + ' ring-2 ring-offset-1 ring-emerald-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{at}</button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUSES.map(s => {
                    const st = STATUS_STYLES[s];
                    return (
                      <button key={s} type="button" onClick={() => setFormStatus(s)} className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold transition-all ${formStatus === s ? st.bg + ' ' + st.text + ' ring-2 ring-offset-1 ring-emerald-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />{s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Porsi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Porsi Kecil</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <input type="number" min="0" placeholder="0" value={formPorsiKecil} onChange={e => setFormPorsiKecil(e.target.value)} className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Porsi Besar</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-orange-400" />
                    <input type="number" min="0" placeholder="0" value={formPorsiBesar} onChange={e => setFormPorsiBesar(e.target.value)} className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
                  </div>
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan</label>
                <textarea rows={3} placeholder="Catatan tambahan (opsional)..." value={formNotes} onChange={e => setFormNotes(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none" />
              </div>
            </div>
            <div className="flex items-center gap-2 p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors">Batal</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : (editingItem ? 'Simpan Perubahan' : 'Tambah Aktivitas')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
