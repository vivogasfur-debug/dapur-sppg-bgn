'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const quickQuestions = [
  'Ringkasan status proyek',
  'Tugas mana yang perlu perhatian?',
  'Analisis anggaran',
  'Tips meningkatkan produktivitas tim',
]

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Halo! Saya adalah **Asisten Analitik Dashboard**. Saya siap membantu Anda menganalisis data proyek, memberikan insight, dan rekomendasi untuk pengambilan keputusan. Ada yang bisa saya bantu hari ini?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply || 'Maaf, saya tidak dapat menjawab saat ini.' }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Maaf, terjadi kesalahan saat menghubungi layanan AI. Silakan coba lagi.' }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Asisten AI</h2>
        <p className="text-muted-foreground mt-1">Dapatkan insight dan analisis cerdas untuk proyek Anda</p>
      </div>

      <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Asisten Analitik</CardTitle>
              <p className="text-xs text-muted-foreground">Dipersembahkan oleh AI</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs">
              <Sparkles className="h-3 w-3 mr-1" />Online
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-emerald-100 text-emerald-700'}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-md'
                    : 'bg-muted rounded-tl-md'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="ai-markdown text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Berpikir...
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q) => (
                <Button key={q} variant="outline" size="sm" className="text-xs h-7" onClick={() => sendMessage(q)} disabled={loading}>
                  {q}
                </Button>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
              className="flex gap-2"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pertanyaan Anda..."
                className="min-h-[44px] max-h-[120px] resize-none flex-1"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="h-11 w-11">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}