// pages/api/game/aiMove.js

const { PrismaClient } = require("@prisma/client");
const { updateBoardState, checkWinner, calculateAIMove } = require('../../../lib/gameLogic'); // 유틸리티 함수 임포트
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { gameId, boardState, difficulty = "medium" } = req.body;

    // 입력 검증
    if (!gameId || !boardState || !Array.isArray(boardState) || boardState.length !== 15) {
      return res.status(400).json({ message: "필수 파라미터가 누락되었거나 보드 상태가 유효하지 않습니다." });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: { user: true }
        },
        room: true,
        moves: { orderBy: { moveNumber: 'desc' } }
      },
    });

    if (!game) {
      return res.status(404).json({ message: "게임을 찾을 수 없습니다." });
    }

    if (game.status !== "PLAYING" || game.currentTurn !== 'WHITE') { // AI는 WHITE 턴일 때만 움직임
      return res.status(400).json({ message: "게임이 진행 중이 아니거나 AI 턴이 아닙니다." });
    }

    // AI 플레이어 ID (Prisma 스키마의 User ID와 일치해야 함)
    // create.js 에서 AI 유저를 미리 생성했음을 가정합니다.
    const aiPlayer = game.players.find(p => p.color === 'WHITE' && p.userId === 'AI'); // AI 유저 ID가 'AI'라고 가정
    if (!aiPlayer) {
      return res.status(404).json({ message: "AI 플레이어를 찾을 수 없습니다." });
    }

    // AI 착수 계산
    const aiMove = calculateAIMove(boardState, 'WHITE', difficulty); // AI는 항상 백돌
    if (!aiMove) {
      return res.status(400).json({ message: "AI 착수를 계산할 수 없습니다. 빈 칸이 없거나 로직 오류." });
    }

    // 보드 상태 업데이트
    const newBoardState = updateBoardState(boardState, aiMove.x, aiMove.y, 'WHITE');

    // 착수 기록
    const moveNumber = game.moves.length + 1;
    await prisma.move.create({
      data: {
        gameId,
        playerId: aiPlayer.userId, // AI 플레이어의 userId 사용
        x: aiMove.x,
        y: aiMove.y,
        moveNumber,
      },
    });

    // 승자 확인
    const winnerColor = checkWinner(newBoardState, aiMove.x, aiMove.y, 'WHITE');
    let nextTurn = winnerColor ? null : 'BLACK'; // 승자 있으면 턴 없음, 아니면 BLACK 턴
    let gameStatus = winnerColor ? 'FINISHED' : 'PLAYING';
    let winnerId = winnerColor ? aiPlayer.userId : null;
    let endTime = winnerColor ? new Date() : null;

    // 보드가 모두 채워졌는데 승자가 없는 경우 (무승부)
    if (!winnerColor && newBoardState.flat().every(cell => cell !== null)) {
      gameStatus = 'FINISHED';
      endTime = new Date();
      nextTurn = null;
    }

    await prisma.game.update({
      where: { id: gameId },
      data: {
        boardState: JSON.stringify(newBoardState),
        currentTurn: nextTurn,
        status: gameStatus,
        winnerId: winnerId,
        endTime: endTime,
      },
    });

    res.status(200).json({
      move: aiMove,
      boardState: newBoardState,
      winner: winnerColor ? 'WHITE' : null, // AI는 백돌
      gameStatus: gameStatus,
      nextTurn: nextTurn,
    });
  } catch (error) {
    console.error("AI 착수 처리 오류:", error);
    res.status(500).json({
      message: "AI 착수 처리 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    await prisma.$disconnect();
  }
}
