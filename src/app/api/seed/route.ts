import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    const existingUsers = await db.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({ success: true, message: 'Data sudah ada' })
    }

    const hash = await bcrypt.hash('password123', 10)

    const admin = await db.user.create({
      data: { email: 'admin@dashboard.id', name: 'Admin Utama', password: hash, role: 'admin' },
    })
    const budi = await db.user.create({
      data: { email: 'budi@dashboard.id', name: 'Budi Santoso', password: hash, role: 'manajer' },
    })
    const siti = await db.user.create({
      data: { email: 'siti@dashboard.id', name: 'Siti Rahayu', password: hash, role: 'anggota' },
    })
    const ahmad = await db.user.create({
      data: { email: 'ahmad@dashboard.id', name: 'Ahmad Hidayat', password: hash, role: 'anggota' },
    })

    const p1 = await db.project.create({
      data: { name: 'Platform E-Commerce', description: 'Pengembangan platform e-commerce modern dengan fitur lengkap', status: 'aktif', budget: 2500000000, spent: 1800000000, startDate: new Date('2024-01-15'), endDate: new Date('2024-12-31') },
    })
    const p2 = await db.project.create({
      data: { name: 'Aplikasi Mobile Banking', description: 'Aplikasi perbankan mobile untuk nasabah', status: 'aktif', budget: 1800000000, spent: 900000000, startDate: new Date('2024-03-01'), endDate: new Date('2025-02-28') },
    })
    const p3 = await db.project.create({
      data: { name: 'Sistem ERP Enterprise', description: 'Implementasi sistem Enterprise Resource Planning', status: 'selesai', budget: 3000000000, spent: 2850000000, startDate: new Date('2023-06-01'), endDate: new Date('2024-06-30') },
    })
    const p4 = await db.project.create({
      data: { name: 'Redesain Website Korporat', description: 'Redesain website perusahaan dengan tampilan modern', status: 'aktif', budget: 500000000, spent: 200000000, startDate: new Date('2024-09-01'), endDate: new Date('2025-03-31') },
    })
    const p5 = await db.project.create({
      data: { name: 'Integrasi API Payment', description: 'Integrasi berbagai metode pembayaran ke sistem', status: 'ditunda', budget: 750000000, spent: 100000000, startDate: new Date('2024-07-01'), endDate: new Date('2024-12-31') },
    })

    const tasks = [
      { title: 'Desain UI/UX halaman produk', status: 'selesai', priority: 'tinggi', projectId: p1.id, assigneeId: siti.id, dueDate: new Date('2024-03-15') },
      { title: 'Implementasi keranjang belanja', status: 'selesai', priority: 'kritis', projectId: p1.id, assigneeId: ahmad.id, dueDate: new Date('2024-05-30') },
      { title: 'Integrasi gateway pembayaran', status: 'berjalan', priority: 'kritis', projectId: p1.id, assigneeId: budi.id, dueDate: new Date('2024-08-15') },
      { title: 'Pengujian performa', status: 'menunggu', priority: 'sedang', projectId: p1.id, assigneeId: siti.id, dueDate: new Date('2024-10-30') },
      { title: 'Desain antarmuka mobile', status: 'selesai', priority: 'tinggi', projectId: p2.id, assigneeId: siti.id, dueDate: new Date('2024-04-30') },
      { title: 'Modul transfer antar bank', status: 'berjalan', priority: 'kritis', projectId: p2.id, assigneeId: ahmad.id, dueDate: new Date('2024-09-15') },
      { title: 'Fitur QR Payment', status: 'menunggu', priority: 'tinggi', projectId: p2.id, assigneeId: budi.id, dueDate: new Date('2024-11-30') },
      { title: 'Modul keuangan', status: 'selesai', priority: 'kritis', projectId: p3.id, assigneeId: budi.id, dueDate: new Date('2023-12-31') },
      { title: 'Modul sumber daya manusia', status: 'selesai', priority: 'tinggi', projectId: p3.id, assigneeId: siti.id, dueDate: new Date('2024-03-31') },
      { title: 'Modul inventaris', status: 'selesai', priority: 'sedang', projectId: p3.id, assigneeId: ahmad.id, dueDate: new Date('2024-05-31') },
      { title: 'Wireframe homepage baru', status: 'selesai', priority: 'sedang', projectId: p4.id, assigneeId: siti.id, dueDate: new Date('2024-10-15') },
      { title: 'Pengembangan komponen header', status: 'berjalan', priority: 'sedang', projectId: p4.id, assigneeId: ahmad.id, dueDate: new Date('2024-12-15') },
      { title: 'Integrasi Midtrans', status: 'menunggu', priority: 'tinggi', projectId: p5.id, assigneeId: ahmad.id, dueDate: new Date('2024-10-31') },
      { title: 'Integrasi Xendit', status: 'menunggu', priority: 'tinggi', projectId: p5.id, assigneeId: budi.id, dueDate: new Date('2024-11-30') },
      { title: 'Dokumentasi API Payment', status: 'menunggu', priority: 'rendah', projectId: p5.id, assigneeId: siti.id, dueDate: new Date('2024-12-31') },
      { title: 'Optimasi database e-commerce', status: 'berjalan', priority: 'tinggi', projectId: p1.id, assigneeId: ahmad.id, dueDate: new Date('2024-09-30') },
    ]

    for (const t of tasks) {
      await db.task.create({ data: t })
    }

    const activities = [
      { action: 'membuat proyek', details: 'Platform E-Commerce dibuat', category: 'proyek', userId: admin.id },
      { action: 'menyelesaikan tugas', details: 'Desain UI/UX halaman produk telah selesai', category: 'tugas', userId: siti.id },
      { action: 'memperbarui status', details: 'Modul keuangan ERP diperbarui menjadi selesai', category: 'tugas', userId: budi.id },
      { action: 'menambah anggota', details: 'Ahmad Hidayat ditambahkan ke proyek Mobile Banking', category: 'proyek', userId: admin.id },
      { action: 'memperbarui anggaran', details: 'Realisasi anggaran E-Commerce mencapai 72%', category: 'proyek', userId: budi.id },
      { action: 'menyelesaikan tugas', details: 'Wireframe homepage baru telah selesai', category: 'tugas', userId: siti.id },
      { action: 'menunda proyek', details: 'Integrasi API Payment ditunda hingga Q1 2025', category: 'proyek', userId: admin.id },
      { action: 'menyelesaikan proyek', details: 'Sistem ERP Enterprise telah selesai', category: 'proyek', userId: budi.id },
      { action: 'membuat tugas', details: 'Tugas baru: Optimasi database e-commerce', category: 'tugas', userId: admin.id },
      { action: 'memperbarui profil', details: 'Profil pengguna diperbarui', category: 'sistem', userId: ahmad.id },
    ]

    for (const a of activities) {
      await db.activity.create({ data: { ...a, createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) } })
    }

    return NextResponse.json({ success: true, message: 'Data sampel berhasil dimuat' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, message: 'Gagal memuat data sampel' }, { status: 500 })
  }
}
