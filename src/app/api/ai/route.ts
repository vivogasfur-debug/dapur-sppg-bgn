import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    let reply: string
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const result = await zai.chat.completions.create({
        model: 'GLM-5.3',
        messages: [
          {
            role: 'system',
            content:
              'Kamu adalah Asisten Analitik Dashboard Dapur SPPG Sangia Wambulu. Kamu membantu pengguna menganalisis data penerima manfaat, rekapitulasi, gizi, stok gudang, dan rekomendasi operasional SPPG. Jawab dalam Bahasa Indonesia dengan gaya profesional. Gunakan format yang mudah dibaca dengan poin-poin jika diperlukan.',
          },
          { role: 'user', content: message },
        ],
      })
      reply = result.choices[0].message.content
    } catch (aiError: any) {
      console.error('AI SDK error:', aiError?.message || aiError)
      reply =
        'Maaf, saya tidak dapat terhubung ke layanan AI saat ini. Berikut beberapa tips operasional SPPG yang mungkin berguna:\n\n' +
        '- **Prioritaskan distribusi** berdasarkan jumlah penerima manfaat per posyandu\n' +
        '- **Pantau stok gudang** secara berkala untuk menghindari kehabisan bahan\n' +
        '- **Evaluasi status gizi** setiap periode 2 minggu\n' +
        '- **Cek rekapitulasi** sebelum membuat laporan ke stakeholder\n' +
        '- **Dokumentasikan perubahan data** melalui audit trail yang tersedia\n\n' +
        'Silakan coba lagi nanti.'
    }

    return NextResponse.json({ reply })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memproses permintaan' }, { status: 500 })
  }
}
