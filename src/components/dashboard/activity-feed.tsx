'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { io } from 'socket.io-client'

interface ActivityItem {
  id: string
  action: string
  details: string | null
  category: string
  createdAt: string
  user: { name: string; avatar: string | null }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  return new Date(dateStr).toLocaleDateString('id-ID')
}

function getDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) return 'Hari Ini'
  if (isYesterday) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

const categoryColors: Record<string, string> = {
  proyek: 'bg-blue-500/10 text-blue-600',
  tugas: 'bg-emerald-500/10 text-emerald-600',
  sistem: 'bg-amber-500/10 text-amber-600',
  umum: 'bg-gray-500/10 text-gray-600',
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [category, setCategory] = useState('semua')

  const loadActivities = useCallback(() => {
    fetch('/api/activities').then((r) => r.json()).then(setActivities)
  }, [])

  useEffect(() => { loadActivities() }, [loadActivities])

  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null
    try {
      socket = io('/?XTransformPort=3003')
      socket.on('activity-update', (data: ActivityItem) => {
        setActivities((prev) => [data, ...prev].slice(0, 100))
      })
    } catch { /* */ }
    return () => { socket?.disconnect() }
  }, [])

  const filtered = category === 'semua' ? activities : activities.filter((a) => a.category === category)

  // Group by date
  const grouped: { label: string; items: ActivityItem[] }[] = []
  let currentLabel = ''
  for (const a of filtered) {
    const label = getDateLabel(a.createdAt)
    if (label !== currentLabel) {
      grouped.push({ label, items: [a] })
      currentLabel = label
    } else {
      grouped[grouped.length - 1].items.push(a)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Log Aktivitas</h2>
        <p className="text-muted-foreground mt-1">Riwayat aktivitas tim secara real-time</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Aktivitas Tim</CardTitle>
            <Tabs value={category} onValueChange={setCategory}>
              <TabsList>
                <TabsTrigger value="semua">Semua</TabsTrigger>
                <TabsTrigger value="proyek">Proyek</TabsTrigger>
                <TabsTrigger value="tugas">Tugas</TabsTrigger>
                <TabsTrigger value="sistem">Sistem</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-3">
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">{group.label}</h3>
                    <div className="flex-1 border-t border-border" />
                  </div>
                  <div className="space-y-3 ml-2">
                    {group.items.map((a) => {
                      const initials = a.user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'
                      return (
                        <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{a.user?.name}</span>{' '}
                              <span className="text-muted-foreground">{a.action}</span>
                            </p>
                            {a.details && (
                              <p className="text-xs text-muted-foreground mt-0.5">{a.details}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${categoryColors[a.category] || ''}`}>
                                {a.category}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {grouped.length === 0 && (
                <p className="text-center text-muted-foreground py-12">Belum ada aktivitas</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}