import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const activities = await db.activity.findMany({
      take: 50,
      include: {
        user: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(activities)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat aktivitas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const activity = await db.activity.create({
      data: {
        action: body.action,
        details: body.details || null,
        category: body.category || 'umum',
        userId: body.userId,
      },
      include: {
        user: { select: { name: true, avatar: true } },
      },
    })
    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat aktivitas' }, { status: 500 })
  }
}