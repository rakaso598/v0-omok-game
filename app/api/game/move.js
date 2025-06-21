// pages/api/game/move.js

const { PrismaClient } = require('@prisma/client');
const { updateBoardState, checkWinner, calculateAIMove } = require('../../../lib/gameLogic'); // 유틸리티 함수 임포트
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { gameId, userId, x, y } = req.body;

    // 입력 검증
    if (!gameId || !userId || x === undefined || y === undefined || x < 0 || x >= 15 || y < 0 || y >= 15) {
      return res.status(400).json({ message: '잘못된 착수 정보 또는 필수 파라미터가 누락되었습니다.' });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: { user: true } // 플레이어와 사용자 정보 함께 가져옴
        },
        moves: { orderBy: { moveNumber: 'desc' } }, // 최신 착수를 확인하기 위해 정렬
        room: true // 게임 모드 확인을 위해 Room 정보 포함
      }
    });

    if (!game) {
      return res.status(404).json({ message: '게임을 찾을 수 없습니다.' });
    }
    if (game.status !== 'PLAYING') {
      return res.status(400).json({ message: '게임이 진행 중이 아닙니다.' });
    }

    const player = game.players.find(p => p.userId === userId);
    if (!player) {
      return res.status(403).json({ message: '게임 참여자가 아닙니다.' });
    }

    // 턴 확인
    if (game.currentTurn !== player.color) {
      return res.status(400).json({ message: '당신의 턴이 아닙니다.' });
    }

    // 보드 상태 파싱 및 착수 유효성 검사
    let currentBoard = JSON.parse(game.boardState);
    if (!Array.isArray(currentBoard) || currentBoard.length !== 15 || currentBoard[y][x] !== null) {
      return res.status(400).json({ message: '잘못된 착수 위치입니다 (이미 돌이 있거나 유효하지 않은 좌표).' });
    }

    // 보드 상태 업데이트
    const newBoardState = updateBoardState(currentBoard, x, y, player.color);

    // 착수 기록
    const moveNumber = game.moves.length + 1;
    await prisma.move.create({
      data: {
        gameId,
        playerId: userId, // 스키마에 따라 userId를 playerId로 저장
        x,
        y,
        moveNumber
      }
    });

    // 승자 확인
    const winnerColor = checkWinner(newBoardState, x, y, player.color);
    let nextTurn = player.color === 'BLACK' ? 'WHITE' : 'BLACK';
    let gameStatus = 'PLAYING';
    let winnerId = null;
    let endTime = null;

    if (winnerColor) {
      gameStatus = 'FINISHED';
      winnerId = userId; // 승리한 플레이어의 userId
      endTime = new Date();
      nextTurn = null; // 게임 종료 시 턴 없음
    } else if (newBoardState.flat().every(cell => cell !== null)) {
      // 보드가 모두 채워졌는데 승자가 없는 경우 (무승부)
      gameStatus = 'FINISHED';
      endTime = new Date();
      nextTurn = null;
    }

    // 게임 상태 업데이트 (보드 상태, 턴 변경, 승자)
    await prisma.game.update({
      where: { id: gameId },
      data: {
        boardState: JSON.stringify(newBoardState),
        currentTurn: nextTurn,
        status: gameStatus,
        winnerId: winnerId,
        endTime: endTime,
      }
    });

    // Socket.IO를 통해 모든 클라이언트에게 게임 상태 변경을 알림 (아래 socket.js에서 처리)
    // 이 API는 클라이언트에 응답만 보내고, 실시간 동기화는 Socket.IO가 담당

    res.status(200).json({
      success: true,
      move: { x, y, stone: player.color },
      boardState: newBoardState,
      winner: winnerColor ? player.color : null,
      gameStatus: gameStatus,
      nextTurn: nextTurn,
      gameMode: game.room.gameMode, // AI 모드인지 판단을 위해 추가
    });

    // AI 모드이고, 현재 턴이 AI였다면 AI 착수 트리거
    // NOTE: 여기서 직접 AI API를 호출하기보다, Socket.IO를 통해 AI 턴임을 알리고
    // 클라이언트나 별도의 서버에서 AI API를 호출하는 것이 더 안정적일 수 있습니다.
    // 하지만 간편화를 위해 여기서 직접 호출하는 예시를 제공합니다.
    if (game.room.gameMode === 'AI' && nextTurn === 'WHITE' && !winnerColor) {
      // AI 착수 API 호출 (비동기로 실행하여 현재 요청 응답에 영향을 주지 않음)
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/game/aiMove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          boardState: newBoardState, // 업데이트된 보드 상태 전달
          difficulty: 'medium', // 필요에 따라 난이도 설정
        }),
      }).then(aiRes => aiRes.json())
        .then(aiData => {
          console.log("AI 착수 요청 성공:", aiData);
          // AI 착수 결과는 socket.js를 통해 클라이언트에 브로드캐스트될 것입니다.
        })
        .catch(aiError => console.error("AI 착수 요청 실패:", aiError));
    }


  } catch (error) {
    console.error('착수 처리 오류:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
