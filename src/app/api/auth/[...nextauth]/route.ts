import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Kredensial',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Kata Sandi', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.userId = user.id; token.role = (user as any).role }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId
        (session.user as any).role = token.role
      }
      return session
    },
  },
  pages: { signIn: '/' },
  session: { strategy: 'jwt' },
  secret: 'dashboard-secret-key-2024',
})

export { handler as GET, handler as POST }
