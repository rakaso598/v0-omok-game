"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Bot, Lock, ArrowLeft } from "lucide-react"
import CustomModal from "@/components/custom-modal"

interface Room {
  id: string
  title: string
  currentPlayers: number
  maxPlayers: number
  status: "waiting" | "playing"
  gameMode: "online" | "ai"
  hasPassword: boolean
}

interface LobbyPageProps {
  onStartGame: (gameData: any) => void
  onBack: () => void
}

export default function LobbyPage({ onStartGame, onBack }: LobbyPageProps) {
  const [userNickname, setUserNickname] = useState("익명 사용자 1234")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [roomTitle, setRoomTitle] = useState("")
  const [roomPassword, setRoomPassword] = useState("")
  const [gameMode, setGameMode] = useState<"online" | "ai">("online")

  // 더미 방 목록 데이터
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: "1",
      title: "초보자 환영 방",
      currentPlayers: 1,
      maxPlayers: 2,
      status: "waiting",
      gameMode: "online",
      hasPassword: false,
    },
    {
      id: "2",
      title: "고수만 오세요",
      currentPlayers: 2,
      maxPlayers: 2,
      status: "playing",
      gameMode: "online",
      hasPassword: true,
    },
    {
      id: "3",
      title: "AI 연습방",
      currentPlayers: 1,
      maxPlayers: 2,
      status: "waiting",
      gameMode: "ai",
      hasPassword: false,
    },
  ])

  useEffect(() => {
    // 백엔드 연동 필요: 초기 접속 시 고유한 임시 닉네임 생성
    // API 호출: /api/auth/generateNickname
    // 중복되지 않는 닉네임을 서버에서 생성하여 클라이언트에 전달
    generateNickname()

    // 백엔드 연동 필요: 현재 활성화된 게임 방 목록 불러오기
    // API 호출: /api/rooms/list
    // 실시간 업데이트를 위한 웹소켓 연결 설정
    loadRoomList()
  }, [])

  const generateNickname = () => {
    // 백엔드 연동 필요: 임시 닉네임 생성 로직
    const randomNum = Math.floor(Math.random() * 9999) + 1
    setUserNickname(`익명 사용자 ${randomNum}`)
  }

  const loadRoomList = () => {
    // 백엔드 연동 필요: 방 목록 로드 및 웹소켓 실시간 업데이트 설정
    //
    // 1. 초기 방 목록 로드
    // fetch('/api/rooms/list')
    //   .then(response => response.json())
    //   .then(data => setRooms(data.rooms))
    //   .catch(error => console.error('방 목록 로드 오류:', error))
    //
    // 2. 웹소켓 연결 및 실시간 업데이트
    // const socket = io(process.env.NEXT_PUBLIC_SITE_URL, { path: '/api/socket' })
    //
    // socket.on('room-created', (newRoom) => {
    //   setRooms(prev => [newRoom, ...prev])
    // })
    //
    // socket.on('room-updated', (updatedRoom) => {
    //   setRooms(prev => prev.map(room =>
    //     room.id === updatedRoom.id ? updatedRoom : room
    //   ))
    // })
    //
    // socket.on('room-deleted', (roomId) => {
    //   setRooms(prev => prev.filter(room => room.id !== roomId))
    // })

    console.log("방 목록 로드 중...")
  }

  const onCreateRoomSubmit = async () => {
    if (!roomTitle.trim()) return

    try {
      // 백엔드 연동 필요: 새로운 게임 방 생성
      // const response = await fetch('/api/rooms/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     title: roomTitle,
      //     password: roomPassword,
      //     gameMode,
      //     creatorNickname: userNickname
      //   })
      // })
      //
      // if (!response.ok) {
      //   throw new Error('방 생성에 실패했습니다.')
      // }
      //
      // const result = await response.json()

      console.log("방 생성:", { roomTitle, roomPassword, gameMode })

      setShowCreateModal(false)
      setRoomTitle("")
      setRoomPassword("")

      // 방 생성 후 바로 게임 화면으로 이동
      onStartGame({
        roomId: "new-room",
        gameMode,
        isHost: true,
        playerNickname: userNickname,
      })
    } catch (error) {
      // 방 생성 실패 시 에러 처리
      console.error("방 생성 오류:", error)
      // 커스텀 모달로 에러 알림
      // setShowErrorModal(true)
      // setErrorMessage('방 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const onJoinRoom = async (room: Room) => {
    if (room.status === "playing") return

    try {
      // 백엔드 연동 필요: 특정 방 참여 요청
      // 비밀번호가 있는 방의 경우 비밀번호 입력 모달 표시
      // if (room.hasPassword) {
      //   const password = await showPasswordModal()
      //   if (!password) return
      // }

      // const response = await fetch('/api/rooms/join', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     roomId: room.id,
      //     userId: userNickname,
      //     password: room.hasPassword ? password : undefined
      //   })
      // })
      //
      // if (!response.ok) {
      //   const error = await response.json()
      //   throw new Error(error.message || '방 참여에 실패했습니다.')
      // }

      console.log("방 참여:", room.id)

      onStartGame({
        roomId: room.id,
        gameMode: room.gameMode,
        isHost: false,
        playerNickname: userNickname,
      })
    } catch (error) {
      // 방 참여 실패 시 에러 처리
      console.error("방 참여 오류:", error)
      // 커스텀 모달로 에러 알림
      // setShowErrorModal(true)
      // setErrorMessage(error.message || '방 참여 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* 헤더 */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로가기
            </Button>
            <h1 className="text-3xl font-bold text-white">오목 로비</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">현재 접속자</p>
            <p className="text-lg font-semibold text-white">{userNickname}</p>
          </div>
        </div>

        {/* 방 생성 버튼 */}
        <div className="text-center mb-8">
          <Button
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg rounded-xl"
          >
            <Plus className="mr-2 h-5 w-5" />새 게임 시작
          </Button>
        </div>

        {/* 방 목록 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">현재 진행 중인 방</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{room.title}</CardTitle>
                    {room.hasPassword && <Lock className="h-4 w-4 text-gray-400" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {room.gameMode === "online" ? (
                          <Users className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Bot className="h-4 w-4 text-purple-400" />
                        )}
                        <span className="text-sm text-gray-300">
                          {room.gameMode === "online" ? "온라인 대전" : "AI 대전"}
                        </span>
                      </div>
                      <Badge
                        variant={room.status === "waiting" ? "default" : "secondary"}
                        className={room.status === "waiting" ? "bg-green-600" : "bg-red-600"}
                      >
                        {room.status === "waiting" ? "대기중" : "게임중"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        참여자: {room.currentPlayers}/{room.maxPlayers}
                      </span>
                      <Button
                        onClick={() => onJoinRoom(room)}
                        disabled={room.status === "playing"}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                      >
                        {room.status === "waiting" ? "참여하기" : "게임중"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 방 생성 모달 */}
      <CustomModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="새 게임 방 만들기">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">방 제목</label>
            <Input
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="방 제목을 입력하세요"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호 (선택사항)</label>
            <Input
              type="password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder="비밀번호 (비워두면 공개방)"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">게임 모드</label>
            <div className="flex space-x-4">
              <Button
                variant={gameMode === "online" ? "default" : "outline"}
                onClick={() => setGameMode("online")}
                className={gameMode === "online" ? "bg-blue-600" : "border-gray-600 text-gray-300"}
              >
                <Users className="mr-2 h-4 w-4" />
                온라인 플레이어와 대결
              </Button>
              <Button
                variant={gameMode === "ai" ? "default" : "outline"}
                onClick={() => setGameMode("ai")}
                className={gameMode === "ai" ? "bg-purple-600" : "border-gray-600 text-gray-300"}
              >
                <Bot className="mr-2 h-4 w-4" />
                컴퓨터와 대결
              </Button>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={onCreateRoomSubmit}
              disabled={!roomTitle.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              방 만들기
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              취소
            </Button>
          </div>
        </div>
      </CustomModal>
    </div>
  )
}
