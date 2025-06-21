// 개선된 API Routes 구조 (에러 처리 및 검증 강화)

// 1. pages/api/game/aiMove.js - 서버 사이드 AI 착수
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { gameId, boardState, difficulty = "medium" } = req.body

    // 입력 검증
    if (!gameId || !boardState) {
      return res.status(400).json({ message: "필수 파라미터가 누락되었습니다." })
    }

    const { PrismaClient } = require("@prisma/client")
    const prisma = new PrismaClient()

    // 게임 상태 확인
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    })

    if (!game) {
      return res.status(404).json({ message: "게임을 찾을 수 없습니다." })
    }

    if (game.status !== "PLAYING") {
      return res.status(400).json({ message: "게임이 진행 중이 아닙니다." })
    }

    // AI 착수 계산 (실제 AI 로직 구현 필요)
    const aiMove = calculateAIMove(boardState, difficulty)

    if (!aiMove) {
      return res.status(400).json({ message: "AI 착수를 계산할 수 없습니다." })
    }

    // 착수 기록
    const moveNumber = (await prisma.move.count({ where: { gameId } })) + 1
    await prisma.move.create({
      data: {
        gameId,
        playerId: "AI", // AI 플레이어 ID
        x: aiMove.x,
        y: aiMove.y,
        moveNumber,
      },
    })

    // 게임 상태 업데이트
    const newBoardState = updateBoardState(boardState, aiMove.x, aiMove.y, "WHITE")
    const winner = checkWinner(newBoardState, aiMove.x, aiMove.y)

    await prisma.game.update({
      where: { id: gameId },
      data: {
        boardState: JSON.stringify(newBoardState),
        currentTurn: winner ? "FINISHED" : "BLACK",
        status: winner ? "FINISHED" : "PLAYING",
        winnerId: winner ? "AI" : null,
        endTime: winner ? new Date() : null,
      },
    })

    res.status(200).json({
      move: aiMove,
      boardState: newBoardState,
      winner,
      gameStatus: winner ? "finished" : "playing",
    })
  } catch (error) {
    console.error("AI 착수 처리 오류:", error)
    res.status(500).json({
      message: "AI 착수 처리 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

function calculateAIMove(boardState, difficulty) {
  // 실제 AI 로직 구현
  // minimax, Monte Carlo Tree Search 등 알고리즘 사용

  // 임시 구현 (실제로는 더 정교한 AI 로직 필요)
  const emptyCells = []
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      if (!boardState[y][x]) {
        emptyCells.push({ x, y })
      }
    }
  }

  if (emptyCells.length === 0) return null

  // 난이도별 AI 로직
  switch (difficulty) {
    case "easy":
      return emptyCells[Math.floor(Math.random() * emptyCells.length)]
    case "medium":
      return calculateStrategicMove(boardState, emptyCells)
    case "hard":
      return calculateMinimaxMove(boardState, emptyCells)
    default:
      return emptyCells[Math.floor(Math.random() * emptyCells.length)]
  }
}

function calculateStrategicMove(boardState, emptyCells) {
  // 전략적 AI 로직 구현
  return emptyCells[Math.floor(Math.random() * emptyCells.length)]
}

function calculateMinimaxMove(boardState, emptyCells) {
  // Minimax 알고리즘을 사용한 AI 로직 구현
  return emptyCells[Math.floor(Math.random() * emptyCells.length)]
}

function updateBoardState(boardState, x, y, stone) {
  // 보드 상태 업데이트 로직 구현
  const newBoardState = JSON.parse(JSON.stringify(boardState))
  newBoardState[y][x] = stone
  return newBoardState
}

function checkWinner(boardState, x, y) {
  // 승자 확인 로직 구현
  return null
}

// 2. pages/api/rooms/create.js - 개선된 방 생성 (검증 강화)
export async function createRoomHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { title, password, gameMode, userId } = req.body

    // 입력 검증
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: "방 제목을 입력해주세요." })
    }

    if (title.length > 50) {
      return res.status(400).json({ message: "방 제목은 50자 이하로 입력해주세요." })
    }

    if (!["online", "ai"].includes(gameMode?.toLowerCase())) {
      return res.status(400).json({ message: "올바른 게임 모드를 선택해주세요." })
    }

    if (!userId) {
      return res.status(400).json({ message: "사용자 정보가 필요합니다." })
    }

    const { PrismaClient } = require("@prisma/client")
    const bcrypt = require("bcrypt")
    const prisma = new PrismaClient()

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })
    }

    // 비밀번호 해시화
    let passwordHash = null
    if (password && password.trim().length > 0) {
      if (password.length < 4) {
        return res.status(400).json({ message: "비밀번호는 4자 이상이어야 합니다." })
      }
      passwordHash = await bcrypt.hash(password.trim(), 10)
    }

    // 트랜잭션으로 방 생성
    const result = await prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          title: title.trim(),
          passwordHash,
          gameMode: gameMode.toUpperCase(),
          currentPlayerCount: 1,
          maxPlayers: 2,
        },
      })

      const game = await tx.game.create({
        data: {
          roomId: room.id,
          boardState: JSON.stringify(
            Array(15)
              .fill(null)
              .map(() => Array(15).fill(null)),
          ),
        },
      })

      await tx.player.create({
        data: {
          userId,
          gameId: game.id,
          color: "BLACK",
        },
      })

      return { room, game }
    })

    res.status(201).json({
      roomId: result.room.id,
      gameId: result.game.id,
      message: "방이 성공적으로 생성되었습니다.",
    })
  } catch (error) {
    console.error("방 생성 오류:", error)

    // Prisma 에러 처리
    if (error.code === "P2002") {
      return res.status(409).json({ message: "이미 존재하는 방 제목입니다." })
    }

    res.status(500).json({
      message: "방 생성 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// 3. 웹소켓 에러 처리 및 재연결 로직 강화
const { Server } = require("socket.io")

export function socketHandler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_SITE_URL : "*",
        methods: ["GET", "POST"],
      },
      // 연결 옵션 설정
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ["websocket", "polling"],
    })

    io.on("connection", (socket) => {
      console.log("클라이언트 연결:", socket.id)

      // 연결 에러 처리
      socket.on("error", (error) => {
        console.error("소켓 에러:", error)
        socket.emit("error", { message: "연결 오류가 발생했습니다." })
      })

      // 방 참여 (검증 강화)
      socket.on("join-room", async (data) => {
        try {
          const { roomId, userId } = data

          if (!roomId || !userId) {
            socket.emit("error", { message: "필수 정보가 누락되었습니다." })
            return
          }

          // 방 존재 확인
          const { PrismaClient } = require("@prisma/client")
          const prisma = new PrismaClient()

          const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { games: { include: { players: true } } },
          })

          if (!room) {
            socket.emit("error", { message: "방을 찾을 수 없습니다." })
            return
          }

          socket.join(roomId)
          socket.roomId = roomId
          socket.userId = userId

          // 방 참여 성공 알림
          socket.emit("room-joined", { roomId, gameState: room.games[0] })
          socket.to(roomId).emit("player-joined", {
            playerId: socket.id,
            userId,
            timestamp: new Date(),
          })
        } catch (error) {
          console.error("방 참여 오류:", error)
          socket.emit("error", { message: "방 참여 중 오류가 발생했습니다." })
        }
      })

      // 게임 착수 (검증 강화)
      socket.on("game-move", async (data) => {
        try {
          const { roomId, x, y, stone, gameId } = data

          // 입력 검증
          if (!roomId || x < 0 || x >= 15 || y < 0 || y >= 15 || !stone || !gameId) {
            socket.emit("error", { message: "잘못된 착수 정보입니다." })
            return
          }

          // 게임 상태 확인 및 착수 처리
          const { PrismaClient } = require("@prisma/client")
          const prisma = new PrismaClient()

          const game = await prisma.game.findUnique({
            where: { id: gameId },
            include: { players: true },
          })

          if (!game || game.status !== "PLAYING") {
            socket.emit("error", { message: "게임이 진행 중이 아닙니다." })
            return
          }

          // 착수 유효성 검사
          const boardState = JSON.parse(game.boardState)
          if (boardState[y][x] !== null) {
            socket.emit("error", { message: "이미 돌이 놓인 위치입니다." })
            return
          }

          // 착수 처리 및 브로드캐스트
          socket.to(roomId).emit("move-received", {
            x,
            y,
            stone,
            playerId: socket.id,
            timestamp: new Date(),
          })
        } catch (error) {
          console.error("착수 처리 오류:", error)
          socket.emit("error", { message: "착수 처리 중 오류가 발생했습니다." })
        }
      })

      // 연결 해제 처리
      socket.on("disconnect", (reason) => {
        console.log("클라이언트 연결 해제:", socket.id, "이유:", reason)

        if (socket.roomId) {
          socket.to(socket.roomId).emit("player-disconnected", {
            playerId: socket.id,
            userId: socket.userId,
            reason,
            timestamp: new Date(),
          })
        }
      })
    })

    res.socket.server.io = io
  }

  res.end()
}
