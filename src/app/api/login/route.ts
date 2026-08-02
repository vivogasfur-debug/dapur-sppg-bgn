import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan kata sandi diperlukan' }, { status: 400 })
    }

    // Debug: log Supabase connection status
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase env vars:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey })
      return NextResponse.json({ error: 'Konfigurasi server belum lengkap (env vars missing)' }, { status: 500 })
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) {
      console.error('Supabase query error:', error.message)
      return NextResponse.json({ error: `Gagal mengambil data: ${error.message}` }, { status: 500 })
    }
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Email tidak ditemukan di database' }, { status: 401 })
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
