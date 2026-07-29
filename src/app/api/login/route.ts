import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan kata sandi diperlukan' }, { status: 400 })
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error || !users || users.length === 0) {
      return NextResponse.json({ error: 'Email tidak ditemukan' }, { status: 401 })
    }

    const user = users[0]
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Kata sandi salah' }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
