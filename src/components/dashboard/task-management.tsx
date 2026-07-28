'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { io } from 'socket.io-client'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  projectId: string
  assigneeId: string | null
  dueDate: string | null
  project: { name: string }
  assignee: { name: string; avatar: string | null } | null
}

interface Project { id: string; name: string }
interface User { id: string; name: string }

const statusColors: Record<string, string> = {
  menunggu: 'bg-gray-100 text-gray-700 border-gray-200',
  berjalan: 'bg-blue-500/10 text-blue-600 border-blue-200',
  selesai: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  dibatalkan: 'bg-red-500/10 text-red-600 border-red-200',
}

const priorityColors: Record<string, string> = {
  rendah: 'bg-emerald-100 text-emerald-700',
  sedang: 'bg-amber-100 text-amber-700',
  tinggi: 'bg-orange-100 text-orange-700',
  kritis: 'bg-red-100 text-red-700',
}

const emptyForm = { title: '', description: '', status: 'menunggu', priority: 'sedang', projectId: '', assigneeId: '', dueDate: '' }

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    fetch('/api/tasks').then((r) => r.json()).then(setTasks)
    fetch('/api/projects').then((r) => r.json()).then(setProjects)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/activities').then((r) => r.json()).then((acts: any[]) => {
      const userIds = [...new Set(acts.map((a) => a.userId))]
      // Users are implicitly known from activity data
    })
    // Also load users - we'll use a simple approach via projects
    const userNames = ['Admin Utama', 'Budi Santoso', 'Siti Rahayu', 'Ahmad Hidayat']
    setUsers([
      { id: 'admin', name: 'Admin Utama' },
      { id: 'budi', name: 'Budi Santoso' },
      { id: 'siti', name: 'Siti Rahayu' },
      { id: 'ahmad', name: 'Ahmad Hidayat' },
    ])
  }, [])

  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null
    try {
      socket = io('/?XTransformPort=3003')
      socket.on('task-update', load)
    } catch { /* */ }
    return () => { socket?.disconnect() }
  }, [load])

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'semua' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true) }
  const openEdit = (t: Task) => {
    setForm({
      title: t.title,
      description: t.description || '',
      status: t.status,
      priority: t.priority,
      projectId: t.projectId,
      assigneeId: t.assigneeId || '',
      dueDate: t.dueDate?.slice(0, 10) || '',
    })
    setEditingId(t.id)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      }
      if (editingId) {
        await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...payload }) })
        toast.success('Tugas berhasil diperbarui')
      } else {
        await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        toast.success('Tugas berhasil dibuat')
      }
      setDialogOpen(false)
      load()
    } catch { toast.error('Gagal menyimpan tugas') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/tasks?id=${deleteId}`, { method: 'DELETE' })
      toast.success('Tugas berhasil dihapus')
      load()
    } catch { toast.error('Gagal menghapus tugas') }
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Tugas</h2>
          <p className="text-muted-foreground mt-1">Kelola dan pantau semua tugas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Tambah Tugas</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Tugas' : 'Tambah Tugas Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Tugas</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proyek</Label>
                  <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih proyek" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Penanggung Jawab</Label>
                  <Select value={form.assigneeId} onValueChange={(v) => setForm({ ...form, assigneeId: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih anggota" /></SelectTrigger>
                    <SelectContent>
                      {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="menunggu">Menunggu</SelectItem>
                      <SelectItem value="berjalan">Berjalan</SelectItem>
                      <SelectItem value="selesai">Selesai</SelectItem>
                      <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioritas</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rendah">Rendah</SelectItem>
                      <SelectItem value="sedang">Sedang</SelectItem>
                      <SelectItem value="tinggi">Tinggi</SelectItem>
                      <SelectItem value="kritis">Kritis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tenggat</Label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari tugas..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                <SelectItem value="menunggu">Menunggu</SelectItem>
                <SelectItem value="berjalan">Berjalan</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
                <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Proyek</TableHead>
                  <TableHead>Penanggung Jawab</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenggat</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium max-w-[180px] truncate">{t.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{t.project?.name}</TableCell>
                    <TableCell className="text-sm">{t.assignee?.name || '—'}</TableCell>
                    <TableCell><Badge className={priorityColors[t.priority] || ''}>{t.priority}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[t.status] || ''}>{t.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('id-ID') : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Tidak ada tugas ditemukan</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tugas</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}