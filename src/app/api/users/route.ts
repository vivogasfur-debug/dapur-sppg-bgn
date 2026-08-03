import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

const SETUP_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Asisten Lapangan' CHECK (role IN ('Admin', 'Ahli Gizi', 'Akuntan', 'Gudang', 'Distribusi', 'Asisten Lapangan')),
  phone TEXT,
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
`

const RLS_FIX_SQL = `ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
`

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'check') {
      const { error } = await supabase.from('users').select('id').limit(1)
      if (error) {
        const errMsg = error.message || ''
        const isMissing = errMsg.includes('does not exist') || errMsg.includes('relation')
        const isRls = errMsg.includes('permission denied') || errMsg.includes('policy') || errMsg.includes('42501')
        return NextResponse.json({ needsSetup: isMissing, needsRlsFix: isRls, sql: isRls ? RLS_FIX_SQL : SETUP_SQL, error: errMsg })
      }
      return NextResponse.json({ needsSetup: false, needsRlsFix: false })
    }

    if (action === 'setup') {
      return NextResponse.json({ sql: SETUP_SQL })
    }

    if (action === 'summary') {
      const { data, error } = await supabase.from('users').select('id, role, active')
      if (error) throw error
      const total = data?.length || 0
      const active = data?.filter(u => u.active).length || 0
      const roles: Record<string, number> = {}
      for (const u of data || []) {
        roles[u.role] = (roles[u.role] || 0) + 1
      }
      return NextResponse.json({ total, active, inactive: total - active, roles })
    }

    // Default: list users (tanpa password)
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    let query = supabase
      .from('users')
      .select('id, name, email, role, phone, active, last_login, created_at')
      .order('created_at', { ascending: false })

    if (role) query = query.eq('role', role)
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,role.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data user'
    const isRls = msg.includes('permission denied') || msg.includes('policy') || msg.includes('42501')
    return NextResponse.json({ error: msg, needsRlsFix: isRls, sql: isRls ? RLS_FIX_SQL : undefined }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role, phone } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Nama, email, kata sandi, dan role wajib diisi' }, { status: 400 })
    }

    const validRoles = ['Admin', 'Ahli Gizi', 'Akuntan', 'Gudang', 'Distribusi', 'Asisten Lapangan']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Role tidak valid. Pilih: ${validRoles.join(', ')}` }, { status: 400 })
    }

    // Cek email duplikat
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).limit(1)
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase.from('users').insert([{
      name, email, password: hashedPassword, role,
      phone: phone || null, active: true,
    }]).select('id, name, email, role, phone, active, created_at')

    if (error) throw error
    return NextResponse.json(data![0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menambah user'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const body = await req.json()
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.role !== undefined) updateData.role = body.role
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.active !== undefined) updateData.active = body.active

    // Hash password baru jika ada
    if (body.password && body.password.length > 0) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, role, phone, active, last_login, created_at')

    if (error) throw error
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memperbarui user'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus user'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
