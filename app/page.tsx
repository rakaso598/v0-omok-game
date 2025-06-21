"use client"

import { useState } from "react"
import StartPage from "@/components/start-page"
import LobbyPage from "@/components/lobby-page"
import GamePage from "@/components/game-page"

type PageType = "start" | "lobby" | "game"

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>("start")
  const [gameData, setGameData] = useState<any>(null)

  const handlePageChange = (page: PageType, data?: any) => {
    setCurrentPage(page)
    if (data) setGameData(data)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {currentPage === "start" && <StartPage onEnterLobby={() => handlePageChange("lobby")} />}
      {currentPage === "lobby" && (
        <LobbyPage onStartGame={(data) => handlePageChange("game", data)} onBack={() => handlePageChange("start")} />
      )}
      {currentPage === "game" && <GamePage gameData={gameData} onBackToLobby={() => handlePageChange("lobby")} />}
    </div>
  )
}
