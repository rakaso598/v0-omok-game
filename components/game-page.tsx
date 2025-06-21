"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, User, Bot } from "lucide-react"
import GameBoard from "@/components/game-board"
import EmoticonPanel from "@/components/emoticon-panel"
import CustomModal from "@/components/custom-modal"

interface GamePageProps {
  gameData: any
  onBackToLobby: () => void
}

type Stone = "black" | "white" | null
type GameStatus = "waiting" | "playing" | "finished"

export default function GamePage({ gameData, onBackToLobby }: GamePageProps) {
  const [board, setBoard] = useState<Stone[][]>(
    Array(15)
      .fill(null)
      .map(() => Array(15).fill(null)),
  )
  const [currentTurn, setCurrentTurn] = useState<"black" | "white">("black")
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing")
  const [winner, setWinner] = useState<string | null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showGameEndModal, setShowGameEndModal] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)

  // 플레이어 정보
  const [player1] = useState({
    nickname: gameData?.playerNickname || "익명 사용자",
    isBlack: true,
    remainingTime: 300, // 5분
  })

  const [player2] = useState({
    nickname: gameData?.gameMode === "ai" ? "컴퓨터" : "상대방",
    isBlack: false,
    remainingTime: 300,
  })

  const [receivedEmoticon, setReceivedEmoticon] = useState<string | null>(null)

  useEffect(() => {
    // 백엔드 연동 필요: 웹소켓 연결 설정
    // 게임 상태, 착수, 이모티콘 등 실시간 데이터 수신
    setupWebSocketConnection()

    return () => {
      // 웹소켓 연결 해제
      cleanupWebSocketConnection()
    }
  }, [])

  const setupWebSocketConnection = () => {
    // 백엔드 연동 필요: 웹소켓 서버 연결
    // 이벤트 리스너: move, game-state, emoticon, player-disconnect 등
    console.log("웹소켓 연결 설정 중...")
  }

  const cleanupWebSocketConnection = () => {
    // 백엔드 연동 필요: 웹소켓 연결 정리
    console.log("웹소켓 연결 해제 중...")
  }

  const onBoardClick = (x: number, y: number) => {
    if (board[y][x] !== null || gameStatus !== "playing") return

    // 착수 처리
    const newBoard = board.map((row) => [...row])
    newBoard[y][x] = currentTurn
    setBoard(newBoard)

    // 백엔드 연동 필요: 착수 정보 전송
    if (gameData?.gameMode === "online") {
      // 온라인 대전: 웹소켓으로 상대방에게 착수 정보 전송
      // API 호출: /api/game/move 또는 웹소켓 이벤트
      // 데이터베이스(Prisma Move 모델)에 착수 기록 저장
      sendMoveToServer(x, y, currentTurn)
    } else {
      // AI 대전: 컴퓨터 턴 처리
      handleAiTurn(newBoard)
    }

    // 승부 판정
    if (checkWinner(newBoard, x, y, currentTurn)) {
      setWinner(currentTurn === "black" ? player1.nickname : player2.nickname)
      setGameStatus("finished")
      setShowGameEndModal(true)
    } else {
      setCurrentTurn(currentTurn === "black" ? "white" : "black")
    }
  }

  const sendMoveToServer = (x: number, y: number, stone: Stone) => {
    // 백엔드 연동 필요: 착수 정보를 서버로 전송
    // 웹소켓 또는 API를 통한 실시간 게임 상태 동기화
    console.log("착수 전송:", { x, y, stone })
  }

  const handleAiTurn = (currentBoard: Stone[][]) => {
    if (gameData?.gameMode !== "ai") return

    setIsAiThinking(true)

    // 백엔드 연동 필요: AI 착수 로직
    // AI 엔진 또는 서버 사이드 AI 로직 호출
    // 실제 구현에서는 서버에서 AI 착수를 계산하여 반환
    setTimeout(() => {
      // 간단한 랜덤 착수 (실제로는 AI 로직으로 대체)
      const emptyCells = []
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          if (currentBoard[y][x] === null) {
            emptyCells.push({ x, y })
          }
        }
      }

      if (emptyCells.length > 0) {
        const randomMove = emptyCells[Math.floor(Math.random() * emptyCells.length)]
        const newBoard = currentBoard.map((row) => [...row])
        newBoard[randomMove.y][randomMove.x] = "white"
        setBoard(newBoard)

        if (checkWinner(newBoard, randomMove.x, randomMove.y, "white")) {
          setWinner(player2.nickname)
          setGameStatus("finished")
          setShowGameEndModal(true)
        } else {
          setCurrentTurn("black")
        }
      }

      setIsAiThinking(false)
    }, 1500)
  }

  const checkWinner = (board: Stone[][], lastX: number, lastY: number, lastStone: Stone): boolean => {
    // 오목 승부 판정 로직 (5개 연속)
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1], // 가로, 세로, 대각선
    ]

    for (const [dx, dy] of directions) {
      let count = 1

      // 한 방향으로 확인
      for (let i = 1; i < 5; i++) {
        const nx = lastX + dx * i
        const ny = lastY + dy * i
        if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[ny][nx] === lastStone) {
          count++
        } else {
          break
        }
      }

      // 반대 방향으로 확인
      for (let i = 1; i < 5; i++) {
        const nx = lastX - dx * i
        const ny = lastY - dy * i
        if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[ny][nx] === lastStone) {
          count++
        } else {
          break
        }
      }

      if (count >= 5) return true
    }

    return false
  }

  const onSendEmoticon = (emoticon: string) => {
    if (gameData?.gameMode !== "online") return

    // 백엔드 연동 필요: 이모티콘을 상대방에게 전송
    // 웹소켓을 통한 실시간 이모티콘 전송
    console.log("이모티콘 전송:", emoticon)
  }

  const onLeaveGame = () => {
    // 백엔드 연동 필요: 게임 방에서 나가기
    // API 호출: /api/game/leave
    // 웹소켓 연결 종료 및 서버 리소스 정리
    console.log("게임 나가기")
    onBackToLobby()
  }

  const handleEmoticonReceived = (emoticon: string) => {
    // 백엔드 연동 필요: 상대방으로부터 이모티콘 수신 시 호출
    setReceivedEmoticon(emoticon)
    setTimeout(() => setReceivedEmoticon(null), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setShowLeaveModal(true)} className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            나가기
          </Button>
          <Badge variant="outline" className="text-white border-gray-600">
            {gameData?.gameMode === "ai" ? "AI 대전" : "온라인 대전"}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* 게임 정보 패널 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 플레이어 1 정보 */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{player1.nickname}</p>
                    <p className="text-sm text-gray-400">흑돌</p>
                  </div>
                  {receivedEmoticon && currentTurn === "white" && (
                    <div className="text-2xl animate-bounce">{receivedEmoticon}</div>
                  )}
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    {Math.floor(player1.remainingTime / 60)}:{(player1.remainingTime % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                {currentTurn === "black" && gameStatus === "playing" && (
                  <Badge className="mt-2 bg-green-600">내 턴</Badge>
                )}
              </CardContent>
            </Card>

            {/* 플레이어 2 정보 */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                    {gameData?.gameMode === "ai" ? (
                      <Bot className="h-6 w-6 text-white" />
                    ) : (
                      <User className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{player2.nickname}</p>
                    <p className="text-sm text-gray-400">백돌</p>
                  </div>
                  {receivedEmoticon && currentTurn === "black" && (
                    <div className="text-2xl animate-bounce">{receivedEmoticon}</div>
                  )}
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    {Math.floor(player2.remainingTime / 60)}:{(player2.remainingTime % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                {currentTurn === "white" && gameStatus === "playing" && (
                  <Badge className="mt-2 bg-blue-600">{gameData?.gameMode === "ai" ? "컴퓨터 턴" : "상대방 턴"}</Badge>
                )}
                {isAiThinking && <p className="text-sm text-yellow-400 mt-2">컴퓨터가 생각 중입니다...</p>}
              </CardContent>
            </Card>

            {/* 이모티콘 패널 (온라인 대전 시에만 표시) */}
            {gameData?.gameMode === "online" && <EmoticonPanel onSendEmoticon={onSendEmoticon} />}
          </div>

          {/* 게임판 */}
          <div className="lg:col-span-3">
            <GameBoard board={board} onCellClick={onBoardClick} disabled={gameStatus !== "playing" || isAiThinking} />
          </div>
        </div>
      </div>

      {/* 나가기 확인 모달 */}
      <CustomModal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="게임 나가기">
        <div className="space-y-4">
          <p className="text-gray-300">정말로 게임을 나가시겠습니까?</p>
          <div className="flex space-x-3">
            <Button onClick={onLeaveGame} className="flex-1 bg-red-600 hover:bg-red-700">
              나가기
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLeaveModal(false)}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              취소
            </Button>
          </div>
        </div>
      </CustomModal>

      {/* 게임 종료 모달 */}
      <CustomModal isOpen={showGameEndModal} onClose={() => setShowGameEndModal(false)} title="게임 종료">
        <div className="space-y-4 text-center">
          <div className="text-6xl mb-4">{winner === player1.nickname ? "🎉" : "😢"}</div>
          <p className="text-xl font-semibold text-white">{winner === player1.nickname ? "승리!" : "패배!"}</p>
          <p className="text-gray-300">{winner}님이 승리했습니다!</p>
          <Button onClick={onBackToLobby} className="w-full bg-blue-600 hover:bg-blue-700">
            로비로 돌아가기
          </Button>
        </div>
      </CustomModal>
    </div>
  )
}
