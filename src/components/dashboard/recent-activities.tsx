'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
  return `${days} hari lalu`
}

const categoryColors: Record<string, string> = {
  proyek: 'bg-blue-500/10 text-blue-600',
  tugas: 'bg-emerald-500/10 text-emerald-600',
  sistem: 'bg-amber-500/10 text-amber-600',
  umum: 'bg-gray-500/10 text-gray-600',
}

export function RecentActivities() {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    fetch('/api/activities').then((r) => r.json()).then(setActivities)

    let socket: ReturnType<typeof io> | null = null
    try {
      socket = io('/?XTransformPort=3003')
      socket.on('activity-update', (data: ActivityItem) => {
        setActivities((prev) => [data, ...prev].slice(0, 50))
      })
    } catch {
      // WebSocket not available
    }
    return () => { socket?.disconnect() }
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-3">
          <div className="space-y-4">
            {activities.map((a) => {
              const initials = a.user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{a.user?.name}</span>{' '}
                      <span className="text-muted-foreground">{a.action}</span>
                    </p>
                    {a.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.details}</p>
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
        </ScrollArea>
      </CardContent>
    </Card>
  )
}