"use client"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface StartPageProps {
  onEnterLobby: () => void
}

export default function StartPage({ onEnterLobby }: StartPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* 로고/제목 */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white mb-2">오목</h1>
          <p className="text-xl text-gray-300">로그인 없이 바로 시작하는 온라인 오목 게임</p>
          <p className="text-sm text-gray-400">친구와 함께 또는 AI와 대결해보세요</p>
        </div>

        {/* 게임 시작 버튼 */}
        <Button
          onClick={onEnterLobby}
          size="lg"
          className="w-full h-16 text-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Play className="mr-3 h-6 w-6" />
          게임 시작하기
        </Button>

        {/* 게임 특징 */}
        <div className="grid grid-cols-2 gap-4 mt-8 text-sm text-gray-400">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">⚡</div>
            <p>빠른 접속</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">🎮</div>
            <p>AI 대전</p>
          </div>
        </div>
      </div>
    </div>
  )
}
