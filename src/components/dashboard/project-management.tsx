'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { io } from 'socket.io-client'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  budget: number
  spent: number
  taskCount: number
  progress: number
  startDate: string | null
  endDate: string | null
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

const statusColors: Record<string, string> = {
  aktif: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  selesai: 'bg-blue-500/10 text-blue-600 border-blue-200',
  ditunda: 'bg-amber-500/10 text-amber-600 border-amber-200',
  dibatalkan: 'bg-red-500/10 text-red-600 border-red-200',
}

const emptyForm = { name: '', description: '', status: 'aktif', budget: 0, startDate: '', endDate: '' }

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadProjects = useCallback(() => {
    fetch('/api/projects').then((r) => r.json()).then(setProjects)
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null
    try {
      socket = io('/?XTransformPort=3003')
      socket.on('project-update', loadProjects)
    } catch { /* */ }
    return () => { socket?.disconnect() }
  }, [loadProjects])

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'semua' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true) }
  const openEdit = (p: Project) => {
    setForm({
      name: p.name,
      description: p.description || '',
      status: p.status,
      budget: p.budget,
      startDate: p.startDate?.slice(0, 10) || '',
      endDate: p.endDate?.slice(0, 10) || '',
    })
    setEditingId(p.id)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingId) {
        await fetch('/api/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...form, budget: Number(form.budget) }) })
        toast.success('Proyek berhasil diperbarui')
      } else {
        await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        toast.success('Proyek berhasil dibuat')
      }
      setDialogOpen(false)
      loadProjects()
    } catch { toast.error('Gagal menyimpan proyek') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/projects?id=${deleteId}`, { method: 'DELETE' })
      toast.success('Proyek berhasil dihapus')
      loadProjects()
    } catch { toast.error('Gagal menghapus proyek') }
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Proyek</h2>
          <p className="text-muted-foreground mt-1">Kelola semua proyek tim Anda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Tambah Proyek</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Proyek' : 'Tambah Proyek Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Proyek</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="selesai">Selesai</SelectItem>
                      <SelectItem value="ditunda">Ditunda</SelectItem>
                      <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Anggaran (Rp)</Label>
                  <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Selesai</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
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
              <Input placeholder="Cari proyek..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
                <SelectItem value="ditunda">Ditunda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Anggaran</TableHead>
                  <TableHead className="text-right">Realisasi</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Tugas</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[p.status] || ''}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatRp(p.budget)}</TableCell>
                    <TableCell className="text-right text-sm">{formatRp(p.spent)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={p.progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{p.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.taskCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Tidak ada proyek ditemukan</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Proyek</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus proyek ini? Semua tugas terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
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