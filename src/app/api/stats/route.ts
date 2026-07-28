import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [totalProjects, activeProjects, completedProjects, totalTasks, completedTasks, pendingTasks, budgetAgg] =
      await Promise.all([
        db.project.count(),
        db.project.count({ where: { status: 'aktif' } }),
        db.project.count({ where: { status: 'selesai' } }),
        db.task.count(),
        db.task.count({ where: { status: 'selesai' } }),
        db.task.count({ where: { status: 'menunggu' } }),
        db.project.aggregate({ _sum: { budget: true, spent: true } }),
      ])

    const taskByStatusRaw = await db.task.groupBy({ by: ['status'], _count: { status: true } })
    const taskByPriorityRaw = await db.task.groupBy({ by: ['priority'], _count: { priority: true } })

    const taskByStatus: Record<string, number> = {}
    for (const t of taskByStatusRaw) taskByStatus[t.status] = t._count.status

    const taskByPriority: Record<string, number> = {}
    for (const t of taskByPriorityRaw) taskByPriority[t.priority] = t._count.priority

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const monthlyTaskCompletion = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const count = await db.task.count({
        where: { status: 'selesai', updatedAt: { gte: start, lt: end } },
      })
      monthlyTaskCompletion.push({ bulan: months[d.getMonth()], jumlah: count })
    }

    const projectBudgetData = await db.project.findMany({
      select: { name: true, budget: true, spent: true },
    })

    return NextResponse.json({
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalBudget: budgetAgg._sum.budget || 0,
      totalSpent: budgetAgg._sum.spent || 0,
      taskByStatus,
      taskByPriority,
      monthlyTaskCompletion,
      projectBudgetData,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat statistik' }, { status: 500 })
  }
}
