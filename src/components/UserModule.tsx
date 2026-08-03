'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plus, Search, X, Trash2, Pencil, Loader2, Users, UserPlus,
  Shield, Eye, EyeOff, Check, Copy, Database, UserCheck, UserX, Phone, Mail
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  active: boolean;
  last_login: string | null;
  created_at: string;
}

interface Summary {
  total: number; active: number; inactive: number; roles: Record<string, number>;
}

const ROLES = ['Admin', 'Ahli Gizi', 'Akuntan', 'Gudang', 'Distribusi', 'Asisten Lapangan'];
const ROLE_COLORS: Record<string, string> = {
  'Admin': 'bg-red-100 text-red-700',
  'Ahli Gizi': 'bg-emerald-100 text-emerald-700',
  'Akuntan': 'bg-blue-100 text-blue-700',
  'Gudang': 'bg-amber-100 text-amber-700',
  'Distribusi': 'bg-purple-100 text-purple-700',
  'Asisten Lapangan': 'bg-slate-100 text-slate-700',
};

export default function UserModule() {
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, active: 0, inactive: 0, roles: {} });
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupSql, setSetupSql] = useState('');
  const [copied, setCopied] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Asisten Lapangan');
  const [formPhone, setFormPhone] = useState('');
  const [formActive, setFormActive] = useState(true);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/users?action=summary');
      if (res.ok) setSummary(await res.json());
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterRole) params.set('role', filterRole);
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      if (res.ok) setUsers(data);
      else {
        if (data.needsSetup || data.needsRlsFix) { setNeedsSetup(true); if (data.sql) setSetupSql(data.sql); }
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); fetchSummary(); }, [search, filterRole]);

  const resetForm = () => {
    setFormName(''); setFormEmail(''); setFormPassword('');
    setFormRole('Asisten Lapangan'); setFormPhone('');
    setFormActive(true); setEditingUser(null); setShowPassword(false);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFormName(u.name); setFormEmail(u.email); setFormPassword('');
    setFormRole(u.role); setFormPhone(u.phone || '');
    setFormActive(u.active); setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) { toast.error('Nama dan email wajib diisi'); return; }
    if (!editingUser && !formPassword) { toast.error('Kata sandi wajib diisi untuk user baru'); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { name: formName, email: formEmail, role: formRole, phone: formPhone, active: formActive };
      if (formPassword) body.password = formPassword;

      const isEdit = !!editingUser;
      const url = isEdit ? `/api/users?id=${editingUser.id}` : '/api/users';
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      toast.success(isEdit ? 'User diperbarui' : 'User ditambahkan');
      setShowModal(false); resetForm(); fetchData(); fetchSummary();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
      toast.success('User dihapus'); fetchData(); fetchSummary();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gagal menghapus'); }
  };

  const toggleActive = async (u: User) => {
    try {
      const res = await fetch(`/api/users?id=${u.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !u.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');
      toast.success(u.active ? 'User dinonaktifkan' : 'User diaktifkan');
      fetchData(); fetchSummary();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gagal mengubah status'); }
  };

  const copySql = () => { navigator.clipboard.writeText(setupSql); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // ===================== SETUP SCREEN =====================
  if (needsSetup) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 rounded-xl"><Database className="w-6 h-6 text-white" /></div>
              <div><h2 className="text-lg font-bold text-white">Setup Tabel Users</h2><p className="text-indigo-100 text-xs">Tabel belum tersedia di Supabase</p></div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">Jalankan SQL berikut di <strong>Supabase SQL Editor</strong>:</p>
            <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">{setupSql}</pre>
            <div className="flex items-center space-x-3">
              <button onClick={copySql} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Disalin!' : 'Salin SQL'}</span>
              </button>
              <button onClick={() => { fetchData(); fetchSummary(); setNeedsSetup(false); }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                Sudah Dijalankan, Cek Ulang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== MAIN MODULE =====================
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Manajemen User</h1>
          <p className="text-xs text-slate-400 mt-0.5">Kelola akun pengguna dan hak akses</p>
        </div>
        <button onClick={openAdd} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all active:scale-95">
          <UserPlus className="w-4 h-4" /><span>Tambah User</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total User</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Users className="w-4 h-4" /></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{summary.total}</h2>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Aktif</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><UserCheck className="w-4 h-4" /></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-600">{summary.active}</h2>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Nonaktif</span>
            <div className="p-1.5 bg-red-50 text-red-500 rounded-lg"><UserX className="w-4 h-4" /></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-red-500">{summary.inactive}</h2>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Roles</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Shield className="w-4 h-4" /></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{Object.keys(summary.roles).length}</h2>
        </div>
      </div>

      {/* Role Distribution */}
      {Object.keys(summary.roles).length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-3">Distribusi Role</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.roles).map(([role, count]) => (
              <span key={role} className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${ROLE_COLORS[role] || 'bg-slate-100 text-slate-700'}`}>
                {role}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, email, atau role..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="">Semua Role</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users className="w-10 h-10 mb-2" />
            <p className="text-sm font-medium">Belum ada user</p>
            <p className="text-xs">Klik &quot;Tambah User&quot; untuk menambahkan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Telepon</th>
                  <th className="px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Terdaftar</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${u.active ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm truncate ${u.active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{u.name}</p>
                          <p className="text-[11px] text-slate-400 truncate flex items-center"><Mail className="w-3 h-3 mr-1" />{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-700'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {u.phone ? <span className="text-xs text-slate-600 flex items-center"><Phone className="w-3 h-3 mr-1" />{u.phone}</span> : <span className="text-xs text-slate-300">-</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <button onClick={() => toggleActive(u)} className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${u.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                        {u.active ? <><Check className="w-3 h-3 mr-1" />Aktif</> : <><X className="w-3 h-3 mr-1" />Nonaktif</>}
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => openEdit(u)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h2>
              <p className="text-indigo-100 text-xs mt-0.5">{editingUser ? 'Perbarui data user' : 'Isi data untuk menambah user baru'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Masukkan nama" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="nama@email.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kata Sandi {editingUser && <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span>}
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'} className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">No. Telepon</label>
                <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
              </div>
              {editingUser && (
                <div className="flex items-center space-x-3">
                  <label className="text-xs font-semibold text-slate-600">Status Aktif</label>
                  <button type="button" onClick={() => setFormActive(!formActive)} className={`relative w-11 h-6 rounded-full transition-colors ${formActive ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formActive ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              )}
              <div className="flex space-x-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingUser ? 'Simpan Perubahan' : 'Tambah User'}</span>
                </button>
                <button onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}