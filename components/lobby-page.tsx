"use client" // 이 지시어는 파일 시작 부분에 있어야 합니다.

import { useState, useEffect, useCallback } from "react"
// import { useRouter } from "next/router" // useRouter는 이 컴포넌트에서는 직접 사용되지 않으므로 제거 가능 (필요 없다면)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Bot, Lock, ArrowLeft } from "lucide-react"
import CustomModal from "@/components/custom-modal" // CustomModal 컴포넌트가 존재해야 함
import io from 'socket.io-client' // Socket.IO 클라이언트 임포트
import { useAuth } from "@/components/hooks/useAuth" // useAuth 훅 임포트

interface Room {
  id: string
  title: string
  currentPlayers: number
  maxPlayers: number
  status: "waiting" | "playing" | "finished" // 'finished' 상태 추가
  gameMode: "online" | "ai"
  hasPassword: boolean
}

interface LobbyPageProps {
  onStartGame: (gameData: any) => void
  onBack: () => void
}

export default function LobbyPage({ onStartGame, onBack }: LobbyPageProps) {
  const [userNickname, setUserNickname] = useState("익명 사용자") // useAuth 훅에서 가져올 것이므로 초기값 의미 없음
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [roomTitle, setRoomTitle] = useState("")
  const [roomPassword, setRoomPassword] = useState("")
  const [gameMode, setGameMode] = useState<"online" | "ai">("online")
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // useAuth 훅에서 userId, nickname, generateNewUser를 가져옵니다.
  const { userId, nickname, generateNewUser, isLoading: authLoading } = useAuth();

  // 닉네임 로드 또는 생성 (useAuth 훅에서 이미 처리하지만 안전 장치)
  useEffect(() => {
    if (nickname) {
      setUserNickname(nickname);
    } else if (!authLoading && !userId) { // userId가 없고 아직 인증 로딩 중이 아니라면 새로 생성 시도
      generateNewUser();
    }
  }, [nickname, authLoading, userId, generateNewUser]);


  // 방 목록을 불러오는 함수 (useCallback으로 메모이제이션)
  const fetchRooms = useCallback(async () => {
    // userId가 없으면 아직 인증이 안 된 상태이므로 로드하지 않음 (400 Bad Request 방지)
    if (!userId) {
      console.log('User ID가 없어 방 목록 로드를 건너킵니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log("방 목록 로드 중...");
      const response = await fetch('/api/rooms/list'); // 실제 API 호출
      if (!response.ok) {
        // 서버에서 전달하는 오류 메시지를 가져와서 출력
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // 'waiting' 또는 'playing' 상태의 방만 표시 (FINISHED는 표시하지 않음)
      const activeRooms = data.rooms.filter((room: Room) => room.status === 'waiting' || room.status === 'playing');
      setRooms(activeRooms);
    } catch (e: any) {
      console.error('방 목록 로드 실패:', e);
      setError(e.message || '방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId]); // userId가 변경될 때마다 fetchRooms 함수 재생성

  // 초기 방 목록 로드 및 Socket.IO 연결
  useEffect(() => {
    // userId가 없으면 Socket.IO 연결을 시도하지 않습니다.
    if (!userId) {
      console.log('User ID가 없어 로비 소켓 연결을 건너킵니다.');
      return;
    }

    // 초기 방 목록 로드
    fetchRooms();

    // Socket.IO 클라이언트 연결 설정
    // NEXT_PUBLIC_SITE_URL이 없으면 기본적으로 localhost:3000으로 연결됩니다.
    // 이는 개발 환경에서 편리하지만, 배포 시에는 실제 URL로 설정해야 합니다.
    const socket = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      path: '/api/socket', // Socket.IO 서버 API 경로
      transports: ['websocket'], // 웹소켓 우선 사용
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('Lobby Socket.IO 연결 성공:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Lobby Socket.IO 연결 해제:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Lobby Socket.IO 연결 오류:', error);
      setError('Socket.IO 연결에 실패했습니다. (콘솔 확인)'); // 사용자에게 알림
    });

    // 서버로부터 방 목록 갱신 이벤트 수신
    socket.on('room-list-updated', () => {
      console.log('방 목록 갱신 이벤트 수신, 방 목록 다시 로드합니다.');
      fetchRooms(); // 방 목록 다시 불러오기
    });

    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('Lobby Socket.IO 연결 정리 중...');
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userId, fetchRooms]); // userId 또는 fetchRooms가 변경될 때 훅 재실행

  const onCreateRoomSubmit = async () => {
    if (!roomTitle.trim()) {
      alert("방 제목을 입력해주세요.");
      return;
    }
    // userId와 nickname이 유효한지 다시 한번 확인
    if (!userId || !nickname) {
      alert("사용자 정보가 없어 방을 생성할 수 없습니다. 잠시 기다리거나 페이지를 새로고침해주세요.");
      console.error("방 생성 실패: userId 또는 nickname이 없습니다.", { userId, nickname });
      return;
    }

    try {
      console.log("방 생성 요청:", { roomTitle, roomPassword, gameMode, userId: userId, nickname: nickname }); // API에 보내는 필드명 로깅

      const response = await fetch('/api/rooms/create', { // 실제 API 호출
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: roomTitle,
          password: roomPassword,
          gameMode,
          userId: userId, // API 라우트가 userId를 받으므로 일치시킵니다.
          // nickname: nickname, // API 스키마에 nickname 필드가 없으므로 제거 (필요하다면 API에 추가)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '방 생성에 실패했습니다.');
      }

      const result = await response.json();
      console.log("방 생성 성공:", result);

      setShowCreateModal(false);
      setRoomTitle("");
      setRoomPassword("");

      // 방 생성 후 바로 게임 화면으로 이동 (서버에서 받은 roomId 사용)
      onStartGame({
        roomId: result.roomId, // 생성된 방 ID 사용
        gameId: result.gameId, // 생성된 게임 ID 사용
        gameMode: gameMode, // 클라이언트의 gameMode를 그대로 전달 (AI/ONLINE)
        isHost: true, // 방 생성자이므로 true
        playerNickname: nickname,
        userId: userId, // userId도 전달
      });
    } catch (err: any) { // 에러 객체에 명시적 타입 Any 지정
      console.error("방 생성 오류:", err);
      alert(`방 생성 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  const onJoinRoom = async (room: Room) => {
    if (room.status === "playing") {
      alert("이미 게임 중인 방입니다.");
      return;
    }
    if (!userId || !nickname) {
      alert("사용자 정보가 없어 방에 참여할 수 없습니다. 잠시 기다리거나 페이지를 새로고침해주세요.");
      console.error("방 참여 실패: userId 또는 nickname이 없습니다.", { userId, nickname });
      return;
    }
    if (room.currentPlayers >= room.maxPlayers) {
      alert("방이 꽉 찼습니다.");
      return;
    }

    let password = ''; // 비밀번호 변수 초기화
    if (room.hasPassword) {
      // 비밀번호 입력 모달 로직 (여기서는 간단히 prompt 사용, 실제는 CustomModal 사용 권장)
      const enteredPassword = prompt("비밀번호를 입력하세요:");
      if (enteredPassword === null) return; // 사용자가 취소한 경우
      password = enteredPassword;
    }

    try {
      console.log("방 참여 요청:", room.id, { userId, nickname, password: room.hasPassword ? '입력됨' : '없음' }); // 비밀번호는 로깅하지 않음

      const response = await fetch('/api/rooms/join', { // 실제 API 호출
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          userId: userId, // 사용자 ID 전달
          // nickname: nickname, // API 스키마에 nickname 필드가 없으므로 제거 (필요하다면 API에 추가)
          password: room.hasPassword ? password : undefined,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '방 참여에 실패했습니다.');
      }

      const result = await response.json();
      console.log("방 참여 성공:", result);

      onStartGame({
        roomId: room.id,
        gameId: result.gameId, // 참여 API에서 gameId를 반환하도록 API 코드에 추가해야 합니다.
        gameMode: room.gameMode,
        isHost: result.isHost, // 서버에서 호스트 여부 반환 (선택 사항, 필요하다면 API에서 반환)
        playerNickname: nickname,
        userId: userId,
      });
    } catch (err: any) {
      console.error("방 참여 오류:", err);
      alert(`방 참여 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
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

        <div className="text-center mb-8">
          <Button
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg rounded-xl"
          >
            <Plus className="mr-2 h-5 w-5" />새 게임 시작
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">현재 진행 중인 방</h2>
          {loading && <p className="text-gray-400 text-center">방 목록을 불러오는 중...</p>}
          {error && <p className="text-red-500 text-center">오류: {error}</p>}
          {!loading && !error && rooms.length === 0 && (
            <p className="text-gray-400 text-center">현재 활성화된 방이 없습니다. 새로운 방을 만들어보세요!</p>
          )}
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
                        disabled={room.status === "playing" || room.currentPlayers >= room.maxPlayers}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                      >
                        {room.status === "waiting" && room.currentPlayers < room.maxPlayers ? "참여하기" : "게임중"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

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
