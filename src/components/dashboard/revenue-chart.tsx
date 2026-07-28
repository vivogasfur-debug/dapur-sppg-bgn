'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { type ChartConfig } from '@/components/ui/chart'

interface BudgetItem {
  name: string
  budget: number
  spent: number
}

const chartConfig = {
  budget: { label: 'Anggaran', color: 'oklch(0.40 0.12 255)' },
  spent: { label: 'Realisasi', color: 'oklch(0.65 0.10 180)' },
} satisfies ChartConfig

function formatShort(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}Jt`
  return `${(n / 1_000).toFixed(0)}K`
}

export function RevenueChart() {
  const [data, setData] = useState<BudgetItem[]>([])

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((json) => setData(json.projectBudgetData || []))
  }, [])

  const chartData = data.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
    anggaran: p.budget / 1_000_000,
    realisasi: p.spent / 1_000_000,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Anggaran vs Realisasi per Proyek</CardTitle>
        <CardDescription>Dalam satuan juta Rupiah</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}Jt`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="anggaran" fill="var(--color-budget)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realisasi" fill="var(--color-spent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
