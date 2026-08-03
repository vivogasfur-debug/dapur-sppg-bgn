'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, Mail, Loader2, Eye, EyeOff, UtensilsCrossed } from 'lucide-react'
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
        toast.success('Selamat datang!')
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-emerald-900/40" />
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Login Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-4 shadow-lg overflow-hidden">
            <Image 
              src="/bgn.png" 
              alt="Logo BGN" 
              width={56} 
              height={56}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow-lg tracking-tight">
            Dapur SPPG
          </h1>
          <p className="text-emerald-200 text-lg font-semibold mt-1 drop-shadow">Sangia Wambulu</p>
          <p className="text-white/50 text-sm mt-2">Sistem Operasional BGN</p>
        </div>

        {/* Card Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-lg font-bold text-white text-center mb-1">Masuk ke Dashboard</h2>
          <p className="text-white/50 text-xs text-center mb-6">Masukkan kredensial Anda untuk melanjutkan</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@dashboard.id" className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-emerald-500/25">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
              Masuk
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          Badan Gizi Nasional — Dapur SPPG Sangia Wambulu
        </p>
      </div>
    </div>
  )
}