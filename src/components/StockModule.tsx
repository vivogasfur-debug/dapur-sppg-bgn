'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Search, X, Trash2, Pencil, Loader2, Package, ArrowDownCircle, ArrowUpCircle,
  AlertTriangle, ShoppingCart, History, Warehouse, Database, Copy, Check, ExternalLink,
  Receipt, Upload, Download, Filter, TrendingUp, TrendingDown, BarChart3
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

const CAT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  'Bahan Makanan': { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '🍚' },
  'Bumbu Dapur':   { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: '🧂' },
  'Peralatan Masak':{ bg: 'bg-blue-50',  text: 'text-blue-700',  icon: '🍳' },
  'Bahan Kemasan': { bg: 'bg-violet-50', text: 'text-violet-700', icon: '📦' },
  'Lainnya':       { bg: 'bg-slate-50',  text: 'text-slate-600', icon: '📋' },
};

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
  const [catFilter, setCatFilter] = useState<string>('all');
  const [itemPage, setItemPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const PAGE_SIZE = 15;

  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const csvRef = useCallback(() => { const el = document.createElement('input'); el.type = 'file'; el.accept = '.csv'; return el; }, []);

  const [formItem, setFormItem] = useState({
    name: '', category: 'Bahan Makanan', unit: 'kg', stock_qty: '', min_stock: '', location: '', description: ''
  });
  const [formTx, setFormTx] = useState({
    itemId: '', type: 'Masuk' as 'Masuk' | 'Keluar', quantity: '', date: new Date().toISOString().slice(0, 10), notes: '', reference: '',
    supplier: '', hargaTotal: '',
  });

  const fetchData = useCallback(async () => {
    try {
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
  useEffect(() => { setItemPage(1); }, [searchTerm, catFilter]);

  // Derived data
  const lowStockItems = items.filter(i => i.min_stock > 0 && i.stock_qty <= i.min_stock);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTx = transactions.filter(t => t.transaction_date?.startsWith(thisMonth));
  const totalMasuk = monthTx.filter(t => t.type === 'Masuk').reduce((s, t) => s + t.quantity, 0);
  const totalKeluar = monthTx.filter(t => t.type === 'Keluar').reduce((s, t) => s + t.quantity, 0);
  const totalValue = items.reduce((s, i) => s + i.stock_qty, 0);

  // Category stats
  const catStats = CATEGORIES.map(c => ({
    name: c,
    count: items.filter(i => i.category === c).length,
    totalQty: items.filter(i => i.category === c).reduce((s, i) => s + i.stock_qty, 0),
  })).filter(c => c.count > 0);

  const filteredItems = items.filter(i =>
    (i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (catFilter === 'all' || i.category === catFilter)
  );
  const itemTotalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const pagedItems = filteredItems.slice((itemPage - 1) * PAGE_SIZE, itemPage * PAGE_SIZE);

  const filteredTx = transactions.filter(t => {
    if (!searchTerm) return true;
    return (t.stock_items?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (t.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
  });
  const txTotalPages = Math.ceil(filteredTx.length / PAGE_SIZE);
  const pagedTx = filteredTx.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE);

  // Stock level color
  const stockColor = (item: StockItem) => {
    if (item.min_stock <= 0) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
    const ratio = item.stock_qty / item.min_stock;
    if (ratio <= 0.5) return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' };
    if (ratio <= 1) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

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
          const d = new Date(formTx.date + 'T00:00:00');
          const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
          const item = items.find(i => i.id === formTx.itemId);
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
        } catch { /* silent */ }
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

  // Export Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const ExcelJS = (await import('exceljs') as any).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Dapur SPPG BGN';

      // Items sheet
      const ws1 = wb.addWorksheet('Daftar Barang');
      ws1.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Barang', key: 'name', width: 25 },
        { header: 'Kategori', key: 'category', width: 16 },
        { header: 'Stok', key: 'stock_qty', width: 10 },
        { header: 'Satuan', key: 'unit', width: 10 },
        { header: 'Stok Min', key: 'min_stock', width: 10 },
        { header: 'Lokasi', key: 'location', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
      ];
      items.forEach((item, i) => {
        const isLow = item.min_stock > 0 && item.stock_qty <= item.min_stock;
        ws1.addRow({
          no: i + 1, name: item.name, category: item.category,
          stock_qty: item.stock_qty, unit: item.unit, min_stock: item.min_stock,
          location: item.location, status: isLow ? 'MENIPIS' : 'Aman',
        });
      });

      // Transactions sheet
      const ws2 = wb.addWorksheet('Riwayat Transaksi');
      ws2.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Tanggal', key: 'date', width: 12 },
        { header: 'Barang', key: 'item', width: 25 },
        { header: 'Tipe', key: 'type', width: 8 },
        { header: 'Jumlah', key: 'qty', width: 10 },
        { header: 'Satuan', key: 'unit', width: 10 },
        { header: 'Referensi', key: 'ref', width: 20 },
        { header: 'Keterangan', key: 'notes', width: 25 },
      ];
      transactions.forEach((tx, i) => {
        ws2.addRow({
          no: i + 1, date: tx.transaction_date, item: tx.stock_items?.name || '-',
          type: tx.type, qty: tx.quantity, unit: tx.stock_items?.unit || '',
          ref: tx.reference, notes: tx.notes,
        });
      });

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gudang-stok-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export berhasil!');
    } catch { toast.error('Gagal export Excel'); }
    finally { setExporting(false); }
  };

  // CSV Import
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) { toast.error('CSV kosong'); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const rows = lines.slice(1).filter(r => r.trim());

      const records = rows.map(row => {
        const vals = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return {
          name: obj.name || obj.nama || obj.nama_barang || '-',
          category: obj.category || obj.kategori || 'Lainnya',
          unit: obj.unit || obj.satuan || 'pcs',
          stock_qty: parseFloat(obj.stock_qty || obj.stok || obj.jumlah || '0') || 0,
          min_stock: parseFloat(obj.min_stock || obj.stok_min || '0') || 0,
          location: obj.location || obj.lokasi || '-',
          description: obj.description || obj.keterangan || null,
        };
      }).filter(r => r.name !== '-');

      if (records.length === 0) { toast.error('Tidak ada data valid'); return; }

      const res = await fetch('/api/stock-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, items: records })
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(`${records.length} barang berhasil diimport!`);
      fetchData();
    } catch { toast.error('Gagal import CSV'); }
    finally { setImporting(false); }
    e.target.value = '';
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  );

  // Setup screen
  if (needsSetup) return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
          <Database className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Setup Database Gudang Diperlukan</h2>
          <p className="text-sm text-slate-500 mt-1">Tabel gudang & stok belum dibuat di Supabase.</p>
        </div>
        <div className="relative">
          <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-[11px] overflow-auto max-h-48 font-mono leading-relaxed text-left">{setupSql}</pre>
          <button onClick={handleCopySql} className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors" title="Salin SQL">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCheckAgain} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
            <Database className="w-4 h-4" /> Cek Ulang & Muat Data
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ══════ STAT CARDS ══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 p-3 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Total Barang</span>
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Package className="w-3.5 h-3.5" /></div>
          </div>
          <h2 className="text-2xl font-extrabold text-blue-800">{items.length}</h2>
          <p className="text-[10px] text-blue-400 mt-0.5">jenis terdaftar</p>
        </div>
        <div className={`bg-gradient-to-br ${lowStockItems.length > 0 ? 'from-rose-50 to-red-50 border-rose-200/60' : 'from-emerald-50 to-green-50 border-emerald-200/50'} border p-3 rounded-2xl`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-bold uppercase ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Stok Menipis</span>
            <div className={`p-1.5 rounded-lg ${lowStockItems.length > 0 ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}><AlertTriangle className="w-3.5 h-3.5" /></div>
          </div>
          <h2 className={`text-2xl font-extrabold ${lowStockItems.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{lowStockItems.length}</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">{lowStockItems.length > 0 ? 'perlu restock!' : 'semua aman'}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 p-3 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Masuk Bulan Ini</span>
            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingDown className="w-3.5 h-3.5" /></div>
          </div>
          <h2 className="text-2xl font-extrabold text-emerald-800">{totalMasuk}</h2>
          <p className="text-[10px] text-emerald-400 mt-0.5">unit masuk</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-3 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Keluar Bulan Ini</span>
            <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><TrendingUp className="w-3.5 h-3.5" /></div>
          </div>
          <h2 className="text-2xl font-extrabold text-amber-800">{totalKeluar}</h2>
          <p className="text-[10px] text-amber-400 mt-0.5">unit keluar</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/50 p-3 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-violet-600 uppercase">Total Unit Stok</span>
            <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg"><BarChart3 className="w-3.5 h-3.5" /></div>
          </div>
          <h2 className="text-2xl font-extrabold text-violet-800">{totalValue}</h2>
          <p className="text-[10px] text-violet-400 mt-0.5">unit total</p>
        </div>
      </div>

      {/* ══════ LOW STOCK ALERT ══════ */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-rose-700 uppercase">Peringatan Stok Menipis</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white border border-rose-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <span className="text-xs font-bold text-rose-700">{item.name}</span>
                <span className="text-[10px] text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded-full font-bold">{item.stock_qty}/{item.min_stock} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════ CATEGORY FILTER + TOOLBAR ══════ */}
      <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 space-y-2.5">
        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setSubTab('items')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${subTab === 'items' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
            <Package className="w-3.5 h-3.5" /><span>Daftar Barang ({items.length})</span>
          </button>
          <button onClick={() => setSubTab('transactions')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${subTab === 'transactions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
            <History className="w-3.5 h-3.5" /><span>Riwayat Transaksi ({transactions.length})</span>
          </button>
        </div>

        {/* Category pills */}
        {subTab === 'items' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
            <button onClick={() => setCatFilter('all')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${catFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              Semua ({items.length})
            </button>
            {catStats.map(c => (
              <button key={c.name} onClick={() => setCatFilter(c.name)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${catFilter === c.name ? 'bg-slate-800 text-white' : `${CAT_COLORS[c.name]?.bg || 'bg-slate-100'} ${CAT_COLORS[c.name]?.text || 'text-slate-500'} hover:opacity-80`}`}>
                {CAT_COLORS[c.name]?.icon || '📋'} {c.name} ({c.count})
              </button>
            ))}
          </div>
        )}

        {/* Search + Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari barang, kategori, lokasi..." className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>

          <button onClick={openAddItem} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
            <Plus className="w-4 h-4" /><span className="sm:inline hidden">Tambah</span>
          </button>
          <button onClick={() => openTxModal('Masuk')} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
            <ArrowDownCircle className="w-4 h-4" /><span className="sm:inline hidden">Masuk</span>
          </button>
          <button onClick={() => openTxModal('Keluar')} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
            <ArrowUpCircle className="w-4 h-4" /><span className="sm:inline hidden">Keluar</span>
          </button>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-1 bg-violet-500 hover:bg-violet-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50" title="Export Excel">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="sm:inline hidden">Export</span>
          </button>
          <label className="flex items-center gap-1 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50" title="Import CSV">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="sm:inline hidden">Import</span>
            <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" disabled={importing} />
          </label>
        </div>
      </div>

      {/* ══════ CONTENT ══════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {subTab === 'items' ? (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Nama Barang</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Kategori</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">Stok</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">Min</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Level</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Lokasi</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedItems.map((item, idx) => {
                    const sc = stockColor(item);
                    const pct = item.min_stock > 0 ? Math.min((item.stock_qty / item.min_stock) * 100, 100) : 100;
                    const cc = CAT_COLORS[item.category] || CAT_COLORS['Lainnya'];
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/50 ${item.min_stock > 0 && item.stock_qty <= item.min_stock ? 'bg-rose-50/30' : ''}`}>
                        <td className="py-2.5 px-3 text-center text-slate-400 border-r border-slate-100 font-bold">{(itemPage - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="py-2.5 px-3 border-r border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{cc.icon}</span>
                            <div>
                              <p className="font-bold text-slate-800">{item.name}</p>
                              {item.description !== '-' && <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{item.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cc.bg} ${cc.text}`}>{item.category}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-100">
                          <span className={`font-extrabold ${sc.text}`}>{item.stock_qty}</span>
                          <span className="text-slate-400 ml-0.5">{item.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-100 text-slate-500">{item.min_stock || '-'}</td>
                        <td className="py-2.5 px-3 border-r border-slate-100 w-24">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${sc.bar} transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-slate-500">{item.location}</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEditItem(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredItems.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm italic">Tidak ada barang ditemukan</div>
              )}
            </div>

            {/* Mobile: Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {pagedItems.map((item) => {
                const sc = stockColor(item);
                const pct = item.min_stock > 0 ? Math.min((item.stock_qty / item.min_stock) * 100, 100) : 100;
                const cc = CAT_COLORS[item.category] || CAT_COLORS['Lainnya'];
                const isLow = item.min_stock > 0 && item.stock_qty <= item.min_stock;
                return (
                  <div key={item.id} className={`p-3 space-y-2 ${isLow ? 'bg-rose-50/30' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cc.icon}</span>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cc.bg} ${cc.text}`}>{item.category}</span>
                        </div>
                      </div>
                      {isLow && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div><span className="text-slate-400">Stok:</span> <span className={`font-extrabold ${sc.text}`}>{item.stock_qty}</span> <span className="text-slate-400">{item.unit}</span></div>
                      <div><span className="text-slate-400">Min:</span> {item.min_stock || '-'}</div>
                      <div><span className="text-slate-400">Lokasi:</span> {item.location}</div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${sc.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-end gap-1 pt-1">
                      <button onClick={() => openEditItem(item)} className="p-1.5 rounded-lg bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {itemTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-xs">
                <span className="text-slate-400">{filteredItems.length} barang • Hal {itemPage}/{itemTotalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setItemPage(p => Math.max(1, p - 1))} disabled={itemPage === 1} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 font-bold">‹</button>
                  <button onClick={() => setItemPage(p => Math.min(itemTotalPages, p + 1))} disabled={itemPage === itemTotalPages} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 font-bold">›</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Transaction List */}
            <div className="divide-y divide-slate-100">
              {pagedTx.length > 0 ? pagedTx.map((tx, idx) => (
                <div key={tx.id} className="p-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'Masuk' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {tx.type === 'Masuk' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{tx.stock_items?.name || '-'}</p>
                        <p className="text-[11px] text-slate-400">{tx.transaction_date} • {tx.stock_items?.category || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'Masuk' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tx.type}</span>
                      <button onClick={() => handleDeleteTx(tx.id)} className="p-1 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="ml-10 mt-1.5 grid grid-cols-3 gap-x-4 text-xs">
                    <div><span className="text-slate-400">Jumlah:</span> <span className="font-extrabold text-slate-800">{tx.quantity} {tx.stock_items?.unit || ''}</span></div>
                    <div><span className="text-slate-400">Ref:</span> <span className="text-slate-600 truncate">{tx.reference}</span></div>
                    <div><span className="text-slate-400">Ket:</span> <span className="text-slate-600 truncate">{tx.notes}</span></div>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-slate-400 text-sm italic">Belum ada riwayat transaksi</div>
              )}
            </div>

            {/* Pagination */}
            {txTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-xs">
                <span className="text-slate-400">{filteredTx.length} transaksi • Hal {txPage}/{txTotalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 font-bold">‹</button>
                  <button onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))} disabled={txPage === txTotalPages} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 font-bold">›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════ CATEGORY SUMMARY ══════ */}
      {subTab === 'items' && catStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Ringkasan per Kategori</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {catStats.map(c => {
              const cc = CAT_COLORS[c.name] || CAT_COLORS['Lainnya'];
              return (
                <div key={c.name} className={`${cc.bg} border border-slate-200/50 rounded-xl p-2.5 text-center`}>
                  <span className="text-xl">{cc.icon}</span>
                  <p className={`text-xs font-bold ${cc.text} mt-1`}>{c.name}</p>
                  <p className="text-lg font-extrabold text-slate-800">{c.count}</p>
                  <p className="text-[10px] text-slate-400">barang • {c.totalQty} unit</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════ MODAL: Add/Edit Item ══════ */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowItemModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Package className="w-4 h-4" /></div>
                <h3 className="font-bold text-slate-800">{editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
              </div>
              <button onClick={() => setShowItemModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveItem} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Nama Barang *</label>
                <input type="text" required value={formItem.name} onChange={e => setFormItem({...formItem, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Contoh: Beras Premium" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Kategori</label>
                  <select value={formItem.category} onChange={e => setFormItem({...formItem, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Satuan</label>
                  <select value={formItem.unit} onChange={e => setFormItem({...formItem, unit: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Stok Awal</label>
                  <input type="number" min="0" step="any" value={formItem.stock_qty} onChange={e => setFormItem({...formItem, stock_qty: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Stok Minimum (Alert)</label>
                  <input type="number" min="0" step="any" value={formItem.min_stock} onChange={e => setFormItem({...formItem, min_stock: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Lokasi Penyimpanan</label>
                <input type="text" value={formItem.location} onChange={e => setFormItem({...formItem, location: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Contoh: Rak A-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Keterangan</label>
                <input type="text" value={formItem.description} onChange={e => setFormItem({...formItem, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Opsional" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{editingItem ? 'Simpan' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════ MODAL: Transaksi Stok ══════ */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTxModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${formTx.type === 'Masuk' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {formTx.type === 'Masuk' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-slate-800">Stok {formTx.type}</h3>
              </div>
              <button onClick={() => setShowTxModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveTx} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Pilih Barang *</label>
                <select value={formTx.itemId} onChange={e => setFormTx({...formTx, itemId: e.target.value})} required className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  <option value="">-- Pilih Barang --</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} (stok: {i.stock_qty} {i.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Jumlah *</label>
                  <input type="number" required min="0.01" step="any" value={formTx.quantity} onChange={e => setFormTx({...formTx, quantity: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Tanggal *</label>
                  <input type="date" required value={formTx.date} onChange={e => setFormTx({...formTx, date: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Referensi (Sumber/Tujuan)</label>
                <input type="text" value={formTx.reference} onChange={e => setFormTx({...formTx, reference: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Contoh: Dinas Kesehatan" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Keterangan</label>
                <input type="text" value={formTx.notes} onChange={e => setFormTx({...formTx, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Opsional" />
              </div>
              {formTx.type === 'Masuk' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-3">
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1"><Receipt className="w-3.5 h-3.5" />Catat Pembayaran ke Akuntan <span className="font-normal text-emerald-500">(opsional)</span></p>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Supplier</label>
                    <input type="text" value={formTx.supplier} onChange={e => setFormTx({...formTx, supplier: e.target.value})} className="w-full px-3 py-2 border border-emerald-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Contoh: CV Pangan Sehat" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Harga Total (Rp)</label>
                    <input type="number" min="0" value={formTx.hargaTotal} onChange={e => setFormTx({...formTx, hargaTotal: e.target.value})} className="w-full px-3 py-2 border border-emerald-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="0" />
                  </div>
                  <p className="text-[10px] text-emerald-600">Jika diisi, pembayaran otomatis terekam di menu Akuntan & Keuangan</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowTxModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all ${formTx.type === 'Masuk' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Simpan Transaksi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
