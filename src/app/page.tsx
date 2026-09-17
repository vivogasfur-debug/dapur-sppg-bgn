'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck, Heart, Apple, Wheat, Droplets } from 'lucide-react'
import Image from 'next/image'
import MainApp from '@/components/MainApp'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('admin@dashboard.id')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      const data = await res.json()
      if (res.ok) {
        setIsAuthenticated(true)
        toast.success(`Selamat datang, ${data.name}!`, { style: { backgroundColor: '#047857', color: 'white', border: 'none' } })
      } else {
        toast.error(data.error || 'Email atau kata sandi salah')
      }
    } catch {
      toast.error('Terjadi kesalahan saat masuk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ===== LEFT PANEL: Branding & Visuals ===== */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-10 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #047857 50%, #059669 75%, #0d9488 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-20 w-60 h-60 rounded-full bg-emerald-300/10" />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-teal-300/8" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-white/3 -translate-x-1/2 -translate-y-1/2" />

        {/* Floating nutrition icons */}
        <div className="absolute top-20 right-16 text-white/10 animate-pulse"><Apple className="w-16 h-16" /></div>
        <div className="absolute bottom-32 left-12 text-white/8" style={{ animationDelay: '1s' }}><Wheat className="w-14 h-14 animate-pulse" /></div>
        <div className="absolute top-1/2 right-8 text-white/8" style={{ animationDelay: '2s' }}><Droplets className="w-12 h-12 animate-pulse" /></div>
        <div className="absolute bottom-16 right-1/3 text-white/8" style={{ animationDelay: '0.5s' }}><Heart className="w-10 h-10 animate-pulse" /></div>

        {/* Top: Logo & Institution */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl overflow-hidden">
              <Image src="/bgn.png" alt="Logo BGN" width={44} height={44} className="object-contain" />
            </div>
            <div>
              <h2 className="text-white/90 text-sm font-bold tracking-widest uppercase">Badan Gizi Nasional</h2>
              <p className="text-emerald-200/70 text-xs">Kementerian Kesehatan Republik Indonesia</p>
            </div>
          </div>
        </div>

        {/* Center: Main Title */}
        <div className="relative z-10 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="text-emerald-200 text-xs font-semibold">Sistem Operasional Resmi</span>
            </div>
            <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
              Dapur<br />
              <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent">SPPG</span>
            </h1>
            <h2 className="text-3xl font-bold text-emerald-100/90 mt-2">Sangia Wambulu</h2>
            <p className="text-white/60 text-base mt-4 max-w-md leading-relaxed">
              Sediaan Pangan Pemulihan Gizi — Platform operasional terintegrasi untuk pengelolaan penerima manfaat, distribusi pangan, dan pemantauan status gizi.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: Heart, label: 'Penerima Manfaat', desc: 'Siswa, Guru, Bumil, Busui, Balita' },
              { icon: Apple, label: 'Distribusi Pangan', desc: 'Porsi kecil & besar per periode' },
              { icon: ShieldCheck, label: 'Rekapitulasi & Audit', desc: 'Snapshot 2 minggu + audit trail' },
              { icon: Wheat, label: 'Manajemen Gudang', desc: 'Stok, transaksi, alert kekurangan' },
            ].map((f, i) => (
              <div key={i} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/12 transition-colors group">
                <f.icon className="w-5 h-5 text-emerald-300 mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-white text-xs font-bold">{f.label}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="relative z-10">
          <div className="h-px bg-white/10 mb-4" />
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-xs">© 2026 Badan Gizi Nasional</p>
            <p className="text-white/40 text-xs">SPPG Sangia Wambulu v2.1</p>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL: Login Form ===== */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 relative"
        style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 30%, #f8fafc 100%)' }}
      >
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-emerald-100/40 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-teal-50/60 translate-y-1/3 -translate-x-1/4" />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile-only logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30 overflow-hidden mb-3">
              <Image src="/bgn.png" alt="Logo BGN" width={40} height={40} className="object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">Dapur SPPG</h1>
            <p className="text-emerald-600 text-sm font-semibold">Sangia Wambulu</p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Masuk</h2>
            <p className="text-slate-500 text-sm mt-1.5">Silakan masuk ke akun Anda untuk mengakses dashboard operasional</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-7">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Email</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-100 group-focus-within:bg-emerald-100 flex items-center justify-center transition-colors">
                    <Mail className="w-3 h-3 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@dashboard.id"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Kata Sandi</label>
                </div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-100 group-focus-within:bg-emerald-100 flex items-center justify-center transition-colors">
                    <Lock className="w-3 h-3 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25 hover:shadow-emerald-700/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Masuk
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] text-slate-400 uppercase tracking-wider">Aman & Terlindungi</span></div>
            </div>

            {/* Security info */}
            <div className="bg-emerald-50 rounded-xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">Koneksi Aman</p>
                <p className="text-[10px] text-emerald-600/80 mt-0.5">Data Anda terenkripsi dan dilindungi sesuai standar keamanan informasi pemerintah</p>
              </div>
            </div>
          </div>

          {/* Bottom links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-slate-400 text-xs">
              Sistem ini milik <span className="font-semibold text-slate-500">Badan Gizi Nasional</span>
            </p>
            <p className="text-slate-300 text-[10px]">
              Dapur SPPG Sangia Wambulu — Sistem Operasional BGN
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
