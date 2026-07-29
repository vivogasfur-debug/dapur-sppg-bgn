import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AppState {
  currentPage: string
  user: User | null
  isAuthenticated: boolean
  sidebarOpen: boolean
  setCurrentPage: (page: string) => void
  setUser: (user: User | null) => void
  setAuthenticated: (v: boolean) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  user: null,
  isAuthenticated: false,
  sidebarOpen: true,
  setCurrentPage: (page) => set({ currentPage: page }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthenticated: (v) => set({ isAuthenticated: v }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  logout: () => set({ user: null, isAuthenticated: false, currentPage: 'dashboard' }),
}))
