'use client'

import { StatsCards } from './stats-cards'
import { RevenueChart } from './revenue-chart'
import { TaskChart } from './task-chart'
import { RecentActivities } from './recent-activities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useEffect, useState } from 'react'

interface Project {
  id: string
  name: string
  status: string
  progress: number
  budget: number
  spent: number
}

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(0)}Jt`
  return `Rp${n.toLocaleString('id-ID')}`
}

const statusColors: Record<string, string> = {
  aktif: 'bg-emerald-500',
  selesai: 'bg-blue-500',
  ditunda: 'bg-amber-500',
  dibatalkan: 'bg-red-500',
}

export function DashboardView() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetch('/api/projects').then((r) => r.json()).then(setProjects)
  }, [])

  const topProjects = projects.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Selamat Datang Kembali</h2>
        <p className="text-muted-foreground mt-1">Berikut ringkasan performa proyek Anda hari ini.</p>
      </div>

      <StatsCards />

      <RevenueChart />

      <TaskChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progress Proyek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProjects.map((p) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate mr-2">{p.name}</span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">{p.progress}%</span>
                </div>
                <Progress value={p.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusColors[p.status] || 'bg-gray-400'}`} />
                    <span className="capitalize">{p.status}</span>
                  </div>
                  <span>{formatRp(p.spent)} / {formatRp(p.budget)}</span>
                </div>
              </div>
            ))}
            {topProjects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada proyek</p>
            )}
          </CardContent>
        </Card>

        <RecentActivities />
      </div>
    </div>
  )
}