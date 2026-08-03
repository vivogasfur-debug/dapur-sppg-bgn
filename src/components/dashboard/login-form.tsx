'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Mail, Loader2, UtensilsCrossed, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export function LoginForm() {
  const [email, setEmail] = useState('admin@dashboard.id')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { setUser } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        toast.error('Email atau kata sandi salah')
      } else {
        const res = await fetch('/api/auth/session')
        const session = await res.json()
        if (session.user) {
          setUser({
            id: (session.user as { id: string }).id,
            email: session.user.email!,
            name: session.user.name!,
            role: (session.user as { role: string }).role,
          })
          await fetch('/api/seed', { method: 'POST' })
          toast.success('Selamat datang, ' + session.user.name!)
        }
      }
    } catch {
      toast.error('Terjadi kesalahan saat masuk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      />
      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-emerald-900/40" />
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-4 shadow-lg">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg tracking-tight">
            Dapur SPPG
          </h1>
          <p className="text-emerald-200 text-lg font-medium mt-1 drop-shadow">Sangia Wambulu</p>
          <p className="text-white/60 text-sm mt-2">Dashboard Manajemen Dapar</p>
        </div>

        {/* Card */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-white">Masuk ke Dashboard</CardTitle>
            <CardDescription className="text-white/60">
              Masukkan kredensial Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@dashboard.id"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/30"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Masuk
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          Badan Gizi Nasional — Dapur SPPG Sangia Wambulu
        </p>
      </div>
    </div>
  )
}
