'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Search, X, Trash2, Pencil, Loader2, Package, ArrowDownCircle, ArrowUpCircle,
  AlertTriangle, ShoppingCart, History, Warehouse, Database, Copy, Check, ExternalLink,
  Receipt, Link2
} from 'lucide-react';

interface StockItem {
  id: string; name: string; category: string; unit: string;
  stock_qty: number; min_stock: number; location: string; description: string;
}

interface StockTransaction {
  id: string; item_id: string; type: string; quantity: number;
  transaction_date: string; notes: string; reference: string;
  stock_items?: { name: string; unit: string; category: string };
}

const CATEGORIES = ['Bahan Makanan', 'Bumbu Dapur', 'Peralatan Masak', 'Bahan Kemasan', 'Lainnya'];
const UNITS = ['kg', 'gram', 'liter', 'ml', 'pcs', 'bungkus', 'karton', 'dos', 'rim', 'lusin'];

export default function StockModule() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupSql, setSetupSql] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subTab, setSubTab] = useState<'items' | 'transactions'>('items');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [formItem, setFormItem] = useState({
    name: '', category: 'Bahan Makanan', unit: 'kg', stock_qty: '', min_stock: '', location: '', description: ''
  });
  const [formTx, setFormTx] = useState({
    itemId: '', type: 'Masuk' as 'Masuk' | 'Keluar', quantity: '', date: new Date().toISOString().slice(0, 10), notes: '', reference: '',
    supplier: '', hargaTotal: '',
  });

  const fetchData = useCallback(async () => {
    try {
      // First check if tables exist
      const checkRes = await fetch('/api/seed-stock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check' })
      });
      const checkData = await checkRes.json();
      if (!checkData.exists) {
        setNeedsSetup(true);
        setSetupSql(checkData.sql || '');
        setLoading(false);
        return;
      }
      setNeedsSetup(false);

      const [iRes, tRes] = await Promise.all([
        fetch('/api/stock-items').then(r => r.json()),
        fetch('/api/stock-transactions').then(r => r.json()),
      ]);
      if (Array.isArray(iRes)) setItems(iRes.map((s: any) => ({
        id: s.id, name: s.name, category: s.category || 'Lainnya', unit: s.unit || 'pcs',
        stock_qty: Number(s.stock_qty) || 0, min_stock: Number(s.min_stock) || 0,
        location: s.location || '-', description: s.description || '-'
      })));
      if (Array.isArray(tRes)) setTransactions(tRes.map((t: any) => ({
        id: t.id, item_id: t.item_id, type: t.type, quantity: Number(t.quantity),
        transaction_date: t.transaction_date, notes: t.notes || '-', reference: t.reference || '-',
        stock_items: t.stock_items ? { name: t.stock_items.name, unit: t.stock_items.unit, category: t.stock_items.category } : undefined
      })));
    } catch { toast.error('Gagal memuat data stok'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived data
  const lowStockItems = items.filter(i => i.min_stock > 0 && i.stock_qty <= i.min_stock);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTx = transactions.filter(t => t.transaction_date?.startsWith(thisMonth));
  const totalMasuk = monthTx.filter(t => t.type === 'Masuk').reduce((s, t) => s + t.quantity, 0);
  const totalKeluar = monthTx.filter(t => t.type === 'Keluar').reduce((s, t) => s + t.quantity, 0);

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const openAddItem = () => {
    setEditingItem(null);
    setFormItem({ name: '', category: 'Bahan Makanan', unit: 'kg', stock_qty: '', min_stock: '', location: '', description: '' });
    setShowItemModal(true);
  };

  const openEditItem = (item: StockItem) => {
    setEditingItem(item);
    setFormItem({
      name: item.name, category: item.category, unit: item.unit,
      stock_qty: String(item.stock_qty), min_stock: String(item.min_stock),
      location: item.location, description: item.description
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingItem ? `/api/stock-items?id=${editingItem.id}` : '/api/stock-items';
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formItem)
      });
      if (!res.ok) throw new Error();
      toast.success(editingItem ? 'Barang diperbarui' : 'Barang ditambahkan');
      setShowItemModal(false); fetchData();
    } catch { toast.error('Gagal menyimpan barang'); }
    finally { setSaving(false); }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Hapus barang ini? Semua riwayat transaksinya juga akan terhapus.')) return;
    try {
      const res = await fetch(`/api/stock-items?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Barang dihapus'); fetchData();
    } catch { toast.error('Gagal menghapus barang'); }
  };

  const openTxModal = (type: 'Masuk' | 'Keluar') => {
    setFormTx({ itemId: items[0]?.id || '', type, quantity: '', date: new Date().toISOString().slice(0, 10), notes: '', reference: '', supplier: '', hargaTotal: '' });
    setShowTxModal(true);
  };

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTx.itemId) { toast.error('Pilih barang terlebih dahulu'); return; }
    if (Number(formTx.quantity) <= 0) { toast.error('Jumlah harus lebih dari 0'); return; }
    if (formTx.type === 'Keluar') {
      const item = items.find(i => i.id === formTx.itemId);
      if (item && Number(formTx.quantity) > item.stock_qty) {
        toast.error(`Stok tidak cukup! Tersedia: ${item.stock_qty} ${item.unit}`);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch('/api/stock-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: formTx.itemId, type: formTx.type, quantity: Number(formTx.quantity), date: formTx.date, notes: formTx.notes, reference: formTx.reference })
      });
      if (!res.ok) throw new Error();
      const txData = await res.json();
      toast.success(`Stok ${formTx.type.toLowerCase()} berhasil dicatat`);

      // If Stok Masuk with supplier & harga, auto-create payment in Akuntan
      if (formTx.type === 'Masuk' && formTx.supplier && formTx.hargaTotal && Number(formTx.hargaTotal) > 0) {
        try {
          var d = new Date(formTx.date + 'T00:00:00');
          var bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
          var item = items.find(function(i) { return i.id === formTx.itemId; });
          await fetch('/api/akun-pembayaran', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jenis: 'barang_masuk', tanggal: formTx.date, bulan: bulanList[d.getMonth()], tahun: String(d.getFullYear()),
              penerima: formTx.supplier,
              keterangan: (item ? item.name + ' ' : '') + Number(formTx.quantity) + (item ? ' ' + item.unit : '') + (formTx.reference ? ' (' + formTx.reference + ')' : ''),
              jumlah: Number(formTx.hargaTotal), status: 'Belum Bayar', stock_tx_id: txData.id,
            })
          });
          toast.success('Pembayaran otomatis dicatat di Akuntan & Keuangan');
        } catch { /* silent - stock tx already saved */ }
      }

      setShowTxModal(false); fetchData();
    } catch { toast.error('Gagal menyimpan transaksi'); }
    finally { setSaving(false); }
  };

  const handleDeleteTx = async (id: string) => {
    if (!confirm('Hapus transaksi ini? Stok akan dikembalikan.')) return;
    try {
      const res = await fetch(`/api/stock-transactions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Transaksi dihapus, stok dikembalikan'); fetchData();
    } catch { toast.error('Gagal menghapus transaksi'); }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed-stock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'seed' })
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(data.message || 'Data simulasi berhasil dimuat!');
      setNeedsSetup(false);
      fetchData();
    } catch { toast.error('Gagal seeding data'); }
    finally { setSeeding(false); }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(setupSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckAgain = () => { setLoading(true); fetchData(); };

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  );

  // Setup screen when tables don't exist
  if (needsSetup) return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
          <Database className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Setup Database Diperlukan</h2>
          <p className="text-sm text-slate-500 mt-1">Tabel gudang & stok belum dibuat di Supabase. Ikuti langkah berikut:</p>
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
              <p className="text-sm font-semibold text-slate-700">Klik "Cek Ulang" di bawah</p>
              <p className="text-xs text-slate-500 mt-0.5">Setelah SQL berhasil, klik tombol untuk memuat data simulasi</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-[11px] overflow-auto max-h-48 font-mono leading-relaxed">{setupSql}</pre>
          <button onClick={handleCopySql} className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors" title="Salin SQL">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCheckAgain} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
            Cek Ulang & Muat Data
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Barang</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Package className="w-4 h-4" /></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{items.length}</h2>
          <p className="text-[10px] text-slate-400 mt-1">jenis barang terdaftar</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Stok Menipis</span>
            <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg"><AlertTriangle className="w-4 h-4" /></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-rose-600">{lowStockItems.length}</h2>
          <p className="text-[10px] text-slate-400 mt-1">perlu segera restock</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Masuk Bulan Ini</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><ArrowDownCircle className="w-4 h-4" /></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-700">{totalMasuk}</h2>
          <p className="text-[10px] text-slate-400 mt-1">unit barang masuk</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Keluar Bulan Ini</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><ArrowUpCircle className="w-4 h-4" /></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-amber-700">{totalKeluar}</h2>
          <p className="text-[10px] text-slate-400 mt-1">unit barang keluar</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-rose-700">Peringatan Stok Menipis</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(i => (
              <span key={i.id} className="px-2 py-1 bg-white rounded-lg text-[11px] font-semibold text-rose-600 border border-rose-200">
                {i.name}: <span className="font-extrabold">{i.stock_qty}</span>/{i.min_stock} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tabs & Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSubTab('items')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${subTab === 'items' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Warehouse className="w-3.5 h-3.5" />Daftar Barang
          </button>
          <button onClick={() => setSubTab('transactions')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${subTab === 'transactions' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-50'}`}>
            <History className="w-3.5 h-3.5" />Riwayat Mutasi
          </button>
        </div>

        {subTab === 'items' && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari barang..." className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <button onClick={openAddItem} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                <Plus className="w-4 h-4" /><span>Tambah Barang</span>
              </button>
              <button onClick={() => openTxModal('Masuk')} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                <ArrowDownCircle className="w-4 h-4" /><span className="sm:inline">Stok Masuk</span>
              </button>
              <button onClick={() => openTxModal('Keluar')} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                <ArrowUpCircle className="w-4 h-4" /><span className="sm:inline">Stok Keluar</span>
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-max w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Nama Barang</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Kategori</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">Stok</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">Min</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Lokasi</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Keterangan</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.length > 0 ? filteredItems.map((item, idx) => {
                    const isLow = item.min_stock > 0 && item.stock_qty <= item.min_stock;
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isLow ? 'bg-rose-50/50' : ''}`}>
                        <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-900">{item.name}</td>
                        <td className="py-2.5 px-3 border-r border-slate-100"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.category === 'Bahan Makanan' ? 'bg-emerald-50 text-emerald-700' : item.category === 'Bumbu Dapur' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{item.category}</span></td>
                        <td className={`py-2.5 px-3 text-center border-r border-slate-100 font-extrabold ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>{item.stock_qty} <span className="font-normal text-slate-400">{item.unit}</span></td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-100 text-slate-500">{item.min_stock}</td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-slate-500">{item.location}</td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-slate-500 max-w-[150px] truncate">{item.description}</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button onClick={() => openEditItem(item)} className="text-blue-400 hover:text-blue-600 p-1" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-rose-500 p-1" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={8} className="py-8 text-center text-slate-400 italic">Belum ada data barang</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {filteredItems.length > 0 ? filteredItems.map((item, idx) => {
                const isLow = item.min_stock > 0 && item.stock_qty <= item.min_stock;
                return (
                  <div key={item.id} className={`bg-white rounded-xl border p-3 space-y-2 ${isLow ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-400">{item.category}</p>
                        </div>
                      </div>
                      {isLow && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div><span className="text-slate-400">Stok:</span> <span className={`font-extrabold ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>{item.stock_qty} {item.unit}</span></div>
                      <div><span className="text-slate-400">Min:</span> <span className="text-slate-600">{item.min_stock} {item.unit}</span></div>
                      <div><span className="text-slate-400">Lokasi:</span> <span className="text-slate-600">{item.location}</span></div>
                      <div><span className="text-slate-400">Ket:</span> <span className="text-slate-600 truncate">{item.description}</span></div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1 border-t border-slate-100">
                      <button onClick={() => openEditItem(item)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-semibold hover:bg-blue-100"><Pencil className="w-3 h-3" />Edit</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-500 text-[11px] font-semibold hover:bg-rose-100"><Trash2 className="w-3 h-3" />Hapus</button>
                    </div>
                  </div>
                );
              }) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 italic">Belum ada data barang</div>
              )}
            </div>
          </>
        )}

        {subTab === 'transactions' && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => openTxModal('Masuk')} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                <Plus className="w-4 h-4" />Stok Masuk
              </button>
              <button onClick={() => openTxModal('Keluar')} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                <Plus className="w-4 h-4" />Stok Keluar
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-max w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Tanggal</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Barang</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">Tipe</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">Jumlah</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Referensi</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Keterangan</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {transactions.length > 0 ? transactions.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 border-r border-slate-100">{tx.transaction_date}</td>
                      <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-900">{tx.stock_items?.name || '-'}</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'Masuk' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tx.type}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 font-extrabold">{tx.quantity} <span className="font-normal text-slate-400">{tx.stock_items?.unit || ''}</span></td>
                      <td className="py-2.5 px-3 border-r border-slate-100 text-slate-500">{tx.reference}</td>
                      <td className="py-2.5 px-3 border-r border-slate-100 text-slate-500 max-w-[150px] truncate">{tx.notes}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button onClick={() => handleDeleteTx(tx.id)} className="text-slate-400 hover:text-rose-500 p-1" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="py-8 text-center text-slate-400 italic">Belum ada riwayat transaksi</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {transactions.length > 0 ? transactions.map((tx, idx) => (
                <div key={tx.id} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{tx.stock_items?.name || '-'}</p>
                        <p className="text-[11px] text-slate-400">{tx.transaction_date}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'Masuk' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tx.type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div><span className="text-slate-400">Jumlah:</span> <span className="font-extrabold text-slate-800">{tx.quantity} {tx.stock_items?.unit || ''}</span></div>
                    <div><span className="text-slate-400">Referensi:</span> <span className="text-slate-600">{tx.reference}</span></div>
                    <div className="col-span-2"><span className="text-slate-400">Keterangan:</span> <span className="text-slate-600">{tx.notes}</span></div>
                  </div>
                  <div className="flex justify-end pt-1 border-t border-slate-100">
                    <button onClick={() => handleDeleteTx(tx.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-500 text-[11px] font-semibold hover:bg-rose-100"><Trash2 className="w-3 h-3" />Hapus</button>
                  </div>
                </div>
              )) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 italic">Belum ada riwayat transaksi</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal: Add/Edit Item */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowItemModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
              <button onClick={() => setShowItemModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveItem} className="p-4 space-y-3">
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Nama Barang *</label><input type="text" required value={formItem.name} onChange={e => setFormItem({...formItem, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Contoh: Beras Premium" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Kategori</label><select value={formItem.category} onChange={e => setFormItem({...formItem, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Satuan</label><select value={formItem.unit} onChange={e => setFormItem({...formItem, unit: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Stok Awal</label><input type="number" min="0" step="any" value={formItem.stock_qty} onChange={e => setFormItem({...formItem, stock_qty: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Stok Minimum (Alert)</label><input type="number" min="0" step="any" value={formItem.min_stock} onChange={e => setFormItem({...formItem, min_stock: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" /></div>
              </div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Lokasi Penyimpanan</label><input type="text" value={formItem.location} onChange={e => setFormItem({...formItem, location: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Contoh: Rak A-1" /></div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Keterangan</label><input type="text" value={formItem.description} onChange={e => setFormItem({...formItem, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Opsional" /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{editingItem ? 'Simpan Perubahan' : 'Tambah Barang'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transaksi Stok */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTxModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formTx.type === 'Masuk' ? <ArrowDownCircle className="w-5 h-5 text-blue-500" /> : <ArrowUpCircle className="w-5 h-5 text-amber-500" />}
                <h3 className="font-bold text-slate-800">Stok {formTx.type}</h3>
              </div>
              <button onClick={() => setShowTxModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveTx} className="p-4 space-y-3">
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Pilih Barang *</label>
                <select value={formTx.itemId} onChange={e => setFormTx({...formTx, itemId: e.target.value})} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="">-- Pilih Barang --</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} (stok: {i.stock_qty} {i.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Jumlah *</label><input type="number" required min="0.01" step="any" value={formTx.quantity} onChange={e => setFormTx({...formTx, quantity: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="0" /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Tanggal *</label><input type="date" required value={formTx.date} onChange={e => setFormTx({...formTx, date: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" /></div>
              </div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Referensi (Sumber/Tujuan)</label><input type="text" value={formTx.reference} onChange={e => setFormTx({...formTx, reference: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Contoh: Dinas Kesehatan" /></div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Keterangan</label><input type="text" value={formTx.notes} onChange={e => setFormTx({...formTx, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Opsional" /></div>
              {formTx.type === 'Masuk' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-3">
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1"><Receipt className="w-3.5 h-3.5" />Catat Pembayaran ke Akuntan <span className="font-normal text-emerald-500">(opsional)</span></p>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Supplier</label><input type="text" value={formTx.supplier} onChange={e => setFormTx({...formTx, supplier: e.target.value})} className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Contoh: CV Pangan Sehat" /></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1 block">Harga Total (Rp)</label><input type="number" min="0" value={formTx.hargaTotal} onChange={e => setFormTx({...formTx, hargaTotal: e.target.value})} className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="0" /></div>
                  <p className="text-[10px] text-emerald-600">Jika diisi, pembayaran akan otomatis terekam di menu Akuntan & Keuangan</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowTxModal(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving} className={`flex-1 py-2.5 rounded-lg text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1 ${formTx.type === 'Masuk' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-amber-500 hover:bg-amber-600'}`}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Simpan Transaksi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
