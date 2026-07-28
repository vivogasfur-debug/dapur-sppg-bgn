'use client'

import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Search, Bell, LogOut, LayoutDashboard, FolderKanban, ListTodo, Activity, Bot, BarChart3 } from 'lucide-react'
import { signOut } from 'next-auth/react'

const pageTitles: Record<string, string> = {
  dashboard: 'Beranda',
  proyek: 'Manajemen Proyek',
  tugas: 'Manajemen Tugas',
  aktivitas: 'Log Aktivitas',
  ai: 'Asisten AI',
}

const mobileNav = [
  { key: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { key: 'proyek', label: 'Proyek', icon: FolderKanban },
  { key: 'tugas', label: 'Tugas', icon: ListTodo },
  { key: 'aktivitas', label: 'Aktivitas', icon: Activity },
  { key: 'ai', label: 'Asisten AI', icon: Bot },
]

export function Header() {
  const { currentPage, user, setCurrentPage, sidebarOpen, setSidebarOpen, logout } = useAppStore()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    logout()
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground">
            <div className="flex items-center gap-3 p-4 h-16">
              <div className="w-9 h-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">ProyekKu</span>
            </div>
            <nav className="px-3 space-y-1">
              {mobileNav.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => { setCurrentPage(item.key) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                )
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 mt-4"
              >
                <LogOut className="h-5 w-5" />
                Keluar
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="text-lg font-semibold hidden sm:block">{pageTitles[currentPage] || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari..." className="pl-9 w-64 h-9" />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-2 border-card">
            3
          </Badge>
        </Button>

        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
