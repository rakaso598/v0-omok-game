// Next.js API Routes 구조 제안
// 각 파일은 pages/api/ 디렉토리에 생성하세요

// 1. pages/api/auth/generateNickname.js
// 익명 사용자를 위한 고유 닉네임 생성
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    // Prisma를 사용하여 중복되지 않는 닉네임 생성
    const { PrismaClient } = require("@prisma/client")
    const prisma = new PrismaClient()

    let nickname
    let isUnique = false

    while (!isUnique) {
      const randomNum = Math.floor(Math.random() * 9999) + 1
      nickname = `익명 사용자 ${randomNum}`

      const existingUser = await prisma.user.findUnique({
        where: { nickname },
      })

      if (!existingUser) {
        isUnique = true
      }
    }

    // 새 사용자 생성
    const user = await prisma.user.create({
      data: { nickname },
    })

    res.status(200).json({
      userId: user.id,
      nickname: user.nickname,
    })
  } catch (error) {
    console.error("닉네임 생성 오류:", error)
    res.status(500).json({ message: "서버 오류" })
  }
}

// 2. pages/api/rooms/list.js
// 현재 활성화된 게임 방 목록 조회
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const rooms = await prisma.room.findMany({
      where: {
        status: {
          in: ['WAITING', 'PLAYING']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json({ rooms });
    
  } catch (error) {
    console.error('방 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
}

// 3. pages/api/rooms/create.js
// 새로운 게임 방 생성
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { title, password, gameMode, userId } = req.body;
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    const prisma = new PrismaClient();
    
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }
    
    const room = await prisma.room.create({
      data: {
        title,
        passwordHash,
        gameMode: gameMode.toUpperCase(),
        currentPlayerCount: 1,
        maxPlayers: 2 // 추가된 코드: 방의 최대 인원 수 설정
      }
    });
    
    // 게임 생성
    const game = await prisma.game.create({
      data: {
        roomId: room.id
      }
    });
    
    // 플레이어 추가
    await prisma.player.create({
      data: {
        userId,
        gameId: game.id,
        color: 'BLACK'
      }
    });
    
    res.status(201).json({ 
      roomId: room.id, 
      gameId: game.id 
    });
    
  } catch (error) {
    console.error('방 생성 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
}

// 4. pages/api/rooms/join.js
// 기존 방 참여
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { roomId, userId, password } = req.body;
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    const prisma = new PrismaClient();
    
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { games: true }
    });
    
    if (!room) {
      return res.status(404).json({ message: '방을 찾을 수 없습니다' });
    }
    
    if (room.currentPlayerCount >= room.maxPlayers) {
      return res.status(400).json({ message: '방이 가득 찼습니다' });
    }
    
    // 비밀번호 확인
    if (room.passwordHash && password) {
      const isValidPassword = await bcrypt.compare(password, room.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: '비밀번호가 틀렸습니다' });
      }
    }
    
    // 플레이어 추가
    const game = room.games[0];
    await prisma.player.create({
      data: {
        userId,
        gameId: game.id,
        color: 'WHITE'
      }
    });
    
    // 방 인원 수 업데이트
    await prisma.room.update({
      where: { id: roomId },
      data: { 
        currentPlayerCount: room.currentPlayerCount + 1,
        status: 'PLAYING'
      }
    });
    
    res.status(200).json({ 
      roomId: room.id, 
      gameId: game.id 
    });
    
  } catch (error) {
    console.error('방 참여 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
}

// 5. pages/api/game/move.js
// 게임 착수 처리
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { gameId, userId, x, y } = req.body;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { 
        players: true,
        moves: { orderBy: { moveNumber: 'desc' } }
      }
    });
    
    if (!game) {
      return res.status(404).json({ message: '게임을 찾을 수 없습니다' });
    }
    
    const player = game.players.find(p => p.userId === userId);
    if (!player) {
      return res.status(403).json({ message: '게임 참여자가 아닙니다' });
    }
    
    // 턴 확인
    if (game.currentTurn !== player.color) {
      return res.status(400).json({ message: '당신의 턴이 아닙니다' });
    }
    
    // 착수 기록
    const moveNumber = game.moves.length + 1;
    await prisma.move.create({
      data: {
        gameId,
        playerId: userId,
        x,
        y,
        moveNumber
      }
    });
    
    // 게임 상태 업데이트 (보드 상태, 턴 변경)
    const boardState = JSON.parse(game.boardState || '[]');
    // 보드 상태 업데이트 로직...
    
    const nextTurn = game.currentTurn === 'BLACK' ? 'WHITE' : 'BLACK';
    await prisma.game.update({
      where: { id: gameId },
      data: {
        boardState: JSON.stringify(boardState),
        currentTurn: nextTurn
      }
    });
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('착수 처리 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
}

// 6. pages/api/game/leave.js
// 게임 나가기
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { gameId, userId } = req.body;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // 플레이어 제거 및 게임 상태 업데이트
    await prisma.player.deleteMany({
      where: {
        gameId,
        userId
      }
    });
    
    // 게임 종료 처리
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'FINISHED',
        endTime: new Date()
      }
    });
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('게임 나가기 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
}
