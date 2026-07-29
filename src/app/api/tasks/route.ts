import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    const where = projectId ? { projectId } : {}

    const tasks = await db.task.findMany({
      where,
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat tugas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description || null,
        status: body.status || 'menunggu',
        priority: body.priority || 'sedang',
        projectId: body.projectId,
        assigneeId: body.assigneeId || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    })
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat tugas' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const task = await db.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    })
    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memperbarui tugas' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    await db.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus tugas' }, { status: 500 })
  }
}
