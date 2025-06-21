"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EmoticonPanelProps {
  onSendEmoticon: (emoticon: string) => void
}

const emoticons = [
  { id: "thumbs-up", emoji: "👍", label: "좋아요" },
  { id: "laugh", emoji: "😂", label: "웃음" },
  { id: "cry", emoji: "😭", label: "울음" },
  { id: "thinking", emoji: "🤔", label: "생각중" },
  { id: "clap", emoji: "👏", label: "박수" },
]

export default function EmoticonPanel({ onSendEmoticon }: EmoticonPanelProps) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm">감정 표현</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-gray-400 mb-3">상대방에게 감정을 표현해보세요</p>
        <div className="grid grid-cols-3 gap-2">
          {emoticons.map((emoticon) => (
            <Button
              key={emoticon.id}
              variant="outline"
              size="sm"
              onClick={() => onSendEmoticon(emoticon.emoji)}
              className="h-12 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-2xl"
              title={emoticon.label}
            >
              {emoticon.emoji}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
