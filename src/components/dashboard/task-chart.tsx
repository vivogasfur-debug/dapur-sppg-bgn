'use client'

import { useEffect, useState } from 'react'
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { type ChartConfig } from '@/components/ui/chart'

const STATUS_COLORS: Record<string, string> = {
  menunggu: 'oklch(0.72 0.15 75)',
  berjalan: 'oklch(0.40 0.12 255)',
  selesai: 'oklch(0.60 0.12 160)',
  dibatalkan: 'oklch(0.55 0.18 15)',
}

const PRIORITY_COLORS: Record<string, string> = {
  rendah: 'oklch(0.60 0.12 160)',
  sedang: 'oklch(0.72 0.15 75)',
  tinggi: 'oklch(0.65 0.18 30)',
  kritis: 'oklch(0.55 0.20 15)',
}

const pieConfig: ChartConfig = {
  menunggu: { label: 'Menunggu', color: STATUS_COLORS.menunggu },
  berjalan: { label: 'Berjalan', color: STATUS_COLORS.berjalan },
  selesai: { label: 'Selesai', color: STATUS_COLORS.selesai },
  dibatalkan: { label: 'Dibatalkan', color: STATUS_COLORS.dibatalkan },
}

const barConfig: ChartConfig = {
  jumlah: { label: 'Jumlah Tugas', color: 'oklch(0.40 0.12 255)' },
}

export function TaskChart() {
  const [taskByStatus, setTaskByStatus] = useState<Record<string, number>>({})
  const [taskByPriority, setTaskByPriority] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((json) => {
        setTaskByStatus(json.taskByStatus || {})
        setTaskByPriority(json.taskByPriority || {})
      })
  }, [])

  const pieData = Object.entries(taskByStatus).map(([name, value]) => ({ name, value }))

  const priorityLabels: Record<string, string> = { rendah: 'Rendah', sedang: 'Sedang', tinggi: 'Tinggi', kritis: 'Kritis' }
  const barData = Object.entries(taskByPriority).map(([name, value]) => ({
    name: priorityLabels[name] || name,
    jumlah: value,
    fill: PRIORITY_COLORS[name] || 'oklch(0.5 0 0)',
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribusi Status Tugas</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieConfig} className="h-[260px] w-full">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={2}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#888'} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Prioritas Tugas</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barConfig} className="h-[260px] w-full">
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="jumlah" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
