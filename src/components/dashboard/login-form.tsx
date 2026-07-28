'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Mail, Loader2, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

export function LoginForm() {
  const [email, setEmail] = useState('admin@dashboard.id')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ProyekKu</h1>
          <p className="text-muted-foreground mt-1">Dashboard Manajemen Proyek</p>
        </div>
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Masuk ke Dashboard</CardTitle>
            <CardDescription>Masukkan kredensial Anda untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@dashboard.id" className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" className="pl-10" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Masuk
              </Button>
            </form>
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-2">Akun Demo:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="font-medium text-foreground">Admin</p>
                  <p>admin@dashboard.id</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="font-medium text-foreground">Manajer</p>
                  <p>budi@dashboard.id</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">Kata sandi: password123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
