import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    let reply: string
    try {
      const { Chat } = await import('z-ai-web-dev-sdk')
      const chat = new Chat({ apiKey: process.env.AI_API_KEY || 'default-key' })
      const result = await chat.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'Kamu adalah Asisten Analitik Dashboard ProyekKu. Kamu membantu pengguna menganalisis data proyek, memberikan insight, dan rekomendasi manajemen proyek. Jawab dalam Bahasa Indonesia dengan gaya profesional. Gunakan format yang mudah dibaca dengan poin-poin jika diperlukan.',
          },
          { role: 'user', content: message },
        ],
      })
      reply = result.choices[0].message.content
    } catch {
      reply =
        'Maaf, saya tidak dapat terhubung ke layanan AI saat ini. Berikut beberapa tips manajemen proyek yang mungkin berguna:\n\n' +
        '- **Prioritaskan tugas** berdasarkan dampak dan urgensi\n' +
        '- **Pantau progress** secara berkala melalui dashboard\n' +
        '- **Komunikasikan hambatan** segera kepada tim\n' +
        '- **Evaluasi anggaran** setiap sprint/minggu\n' +
        '- **Dokumentasikan keputusan** penting untuk referensi\n\n' +
        'Silakan coba lagi nanti.'
    }

    return NextResponse.json({ reply })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memproses permintaan' }, { status: 500 })
  }
}