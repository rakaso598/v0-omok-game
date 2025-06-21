// pages/api/game/leave.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { gameId, userId } = req.body;

    // 입력 검증
    if (!gameId || !userId) {
      return res.status(400).json({ message: "게임 ID와 사용자 ID가 필요합니다." });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { room: true, players: true }
    });

    if (!game) {
      return res.status(404).json({ message: '게임을 찾을 수 없습니다.' });
    }

    // 트랜잭션을 사용하여 원자적으로 처리
    await prisma.$transaction(async (tx) => {
      // 해당 플레이어를 게임에서 제거
      await tx.player.deleteMany({
        where: {
          gameId,
          userId
        }
      });

      // 방의 현재 플레이어 수 감소
      const updatedRoom = await tx.room.update({
        where: { id: game.roomId },
        data: {
          currentPlayerCount: {
            decrement: 1 // 플레이어 수 1 감소
          }
        }
      });

      // 만약 플레이어가 0명이 되면 방 상태를 FINISHED로 변경하고 게임도 종료 처리
      if (updatedRoom.currentPlayerCount === 0) {
        await tx.room.update({
          where: { id: game.roomId },
          data: {
            status: 'FINISHED',
          }
        });
        await tx.game.update({
          where: { id: gameId },
          data: {
            status: 'FINISHED',
            endTime: new Date(),
            winnerId: game.players.find(p => p.userId !== userId)?.userId || null, // 남아있는 플레이어가 있다면 그 플레이어가 승자
          }
        });
      } else if (game.players.length === 2 && updatedRoom.currentPlayerCount === 1) {
        // 2인 게임에서 1명이 나가 1명만 남은 경우, 게임을 종료하고 남아있는 플레이어를 승자로
        const remainingPlayer = game.players.find(p => p.userId !== userId);
        await tx.game.update({
          where: { id: gameId },
          data: {
            status: 'FINISHED',
            endTime: new Date(),
            winnerId: remainingPlayer?.userId || null, // 남아있는 플레이어가 승자
          }
        });
        await tx.room.update({
          where: { id: game.roomId },
          data: {
            status: 'FINISHED', // 방도 종료 상태로 변경
          }
        });
      }
    });


    res.status(200).json({ success: true, message: "게임에서 나갔습니다." });

  } catch (error) {
    console.error('게임 나가기 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  } finally {
    await prisma.$disconnect();
  }
}
