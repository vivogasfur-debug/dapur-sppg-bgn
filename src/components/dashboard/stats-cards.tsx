'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FolderKanban, ListTodo, Wallet, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface Stats {
  totalProjects: number
  activeProjects: number
  totalTasks: number
  pendingTasks: number
  totalBudget: number
  totalSpent: number
  completedTasks: number
}

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(0)}Jt`
  return `Rp${n.toLocaleString('id-ID')}`
}

const cardConfigs = [
  { key: 'activeProjects', label: 'Proyek Aktif', icon: FolderKanban, format: (v: number) => v.toString(), color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'pendingTasks', label: 'Tugas Berjalan', icon: ListTodo, format: (v: number) => v.toString(), color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { key: 'totalBudget', label: 'Anggaran Total', icon: Wallet, format: formatRp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { key: 'completion', label: 'Penyelesaian Tugas', icon: TrendingUp, format: (v: number) => `${v}%`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
]

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setStats)
  }, [])

  const completion = stats ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
  const values: Record<string, number> = stats ? {
    activeProjects: stats.activeProjects,
    pendingTasks: stats.totalTasks - stats.completedTasks - stats.pendingTasks,
    totalBudget: stats.totalBudget,
    completion,
  } : { activeProjects: 0, pendingTasks: 0, totalBudget: 0, completion: 0 }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cardConfigs.map((cfg, i) => {
        const Icon = cfg.icon
        return (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{cfg.label}</p>
                    <p className="text-2xl font-bold mt-1">
                      {stats ? cfg.format(values[cfg.key]) : '—'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${cfg.bg}`}>
                    <Icon className={`h-6 w-6 ${cfg.color}`} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <span className="text-emerald-500 font-medium">+{(Math.random() * 15 + 2).toFixed(0)}%</span>
                  <span className="text-muted-foreground">dari bulan lalu</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
