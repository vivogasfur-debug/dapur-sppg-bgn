'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAppStore } from '@/store/use-app-store'
import { LoginForm } from '@/components/dashboard/login-form'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { ProjectManagement } from '@/components/dashboard/project-management'
import { TaskManagement } from '@/components/dashboard/task-management'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { AIChat } from '@/components/dashboard/ai-chat'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppStore()

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className={cn('flex-1 flex flex-col transition-all duration-300', sidebarOpen ? 'md:ml-64' : 'md:ml-16')}>
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
        <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground">
          ProyekKu Dashboard &copy; {new Date().getFullYear()} &mdash; Sistem Manajemen Proyek Korporat
        </footer>
      </div>
    </div>
  )
}

function PageContent() {
  const { currentPage } = useAppStore()

  switch (currentPage) {
    case 'proyek':
      return <ProjectManagement />
    case 'tugas':
      return <TaskManagement />
    case 'aktivitas':
      return <ActivityFeed />
    case 'ai':
      return <AIChat />
    default:
      return <DashboardView />
  }
}

export default function Home() {
  const { data: session, status } = useSession()
  const { isAuthenticated, setUser, setAuthenticated } = useAppStore()

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: (session.user as { id: string }).id,
        email: session.user.email!,
        name: session.user.name!,
        role: (session.user as { role: string }).role,
      })
      setAuthenticated(true)
    }
  }, [session, setUser, setAuthenticated])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !session) {
    return <LoginForm />
  }

  return (
    <DashboardLayout>
      <PageContent />
    </DashboardLayout>
  )
}