'use client'

import { useAppStore } from '@/store/use-app-store'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard, FolderKanban, ListTodo, Activity, Bot,
  LogOut, ChevronLeft, BarChart3,
} from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { key: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { key: 'proyek', label: 'Proyek', icon: FolderKanban },
  { key: 'tugas', label: 'Tugas', icon: ListTodo },
  { key: 'aktivitas', label: 'Aktivitas', icon: Activity },
  { key: 'ai', label: 'Asisten AI', icon: Bot },
]

export function Sidebar() {
  const { currentPage, setCurrentPage, user, sidebarOpen, setSidebarOpen, logout } = useAppStore()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    logout()
  }

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground z-40 transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-0 md:w-16'
      )}
    >
      <div className="flex items-center justify-between p-4 h-16">
        <div className={cn('flex items-center gap-3 overflow-hidden', !sidebarOpen && 'md:justify-center md:w-full')}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold text-lg whitespace-nowrap"
            >
              ProyekKu
            </motion.span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 w-8"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
        </Button>
      </div>

      <Separator className="bg-sidebar-border" />

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.key
            return (
              <button
                key={item.key}
                onClick={() => setCurrentPage(item.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  !sidebarOpen && 'md:justify-center md:px-2'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
                {sidebarOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{item.label}</motion.span>}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      <div className="p-4">
        <div className={cn('flex items-center gap-3', !sidebarOpen && 'md:justify-center md:w-full')}>
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-sidebar-accent text-sidebar-accent-foreground">
                {user?.role}
              </Badge>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('text-sidebar-foreground/70 hover:text-red-400 hover:bg-red-400/10 h-8 w-8 flex-shrink-0', !sidebarOpen && 'md:hidden')}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
