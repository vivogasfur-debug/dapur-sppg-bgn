import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const projects = await db.project.findMany({
      include: {
        _count: { select: { tasks: true } },
        tasks: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = projects.map((p) => {
      const totalTasks = p.tasks.length
      const completedTasks = p.tasks.filter((t) => t.status === 'selesai').length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        budget: p.budget,
        spent: p.spent,
        startDate: p.startDate,
        endDate: p.endDate,
        taskCount: p._count.tasks,
        progress,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat proyek' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const project = await db.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        status: body.status || 'aktif',
        budget: body.budget || 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    })
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat proyek' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const project = await db.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })
    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memperbarui proyek' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    await db.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus proyek' }, { status: 500 })
  }
}
