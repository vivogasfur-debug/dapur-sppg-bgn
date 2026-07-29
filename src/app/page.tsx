'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, Mail, Loader2, UtensilsCrossed } from 'lucide-react'
import MainApp from '@/components/MainApp'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('admin@dashboard.id')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <MainApp />
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        setIsAuthenticated(true)
        toast.success('Selamat datang!')
      } else {
        toast.error('Email atau kata sandi salah')
      }
    } catch {
      toast.error('Terjadi kesalahan saat masuk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white mb-4">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Dapur SPPG</h1>
          <p className="text-slate-400 mt-1 text-sm">Sistem Operasional BGN</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-lg font-bold text-slate-800 text-center mb-1">Masuk ke Dashboard</h2>
          <p className="text-slate-400 text-xs text-center mb-6">Masukkan kredensial Anda untuk melanjutkan</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@dashboard.id" className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
              Masuk
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 text-center mb-2">Akun Demo</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <div className="rounded-lg bg-slate-50 p-2"><p className="font-semibold text-slate-700">Admin</p><p>admin@dashboard.id</p></div>
              <div className="rounded-lg bg-slate-50 p-2"><p className="font-semibold text-slate-700">Manajer</p><p>budi@dashboard.id</p></div>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">Kata sandi: password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}