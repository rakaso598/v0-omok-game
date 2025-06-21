// app/api/rooms/join/route.js
// 이 파일은 프로젝트 루트의 /app/api/rooms/join/ 폴더 안에 위치해야 합니다.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; // npm install bcrypt 필요
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// POST 요청 핸들러: 기존 게임 방에 참여합니다.
export async function POST(request) {
  try {
    const { roomId, userId, password } = await request.json(); // 요청 본문 파싱

    // 입력 검증
    if (!roomId || !userId) {
      return NextResponse.json({ message: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { games: { include: { players: true } } } // 게임과 플레이어 정보도 함께 가져옴
    });

    if (!room) {
      return NextResponse.json({ message: '방을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 방이 이미 가득 찼는지 확인
    if (room.currentPlayerCount >= room.maxPlayers) {
      return NextResponse.json({ message: '방이 가득 찼습니다.' }, { status: 400 });
    }

    // 이미 해당 유저가 이 방의 게임에 참여중인지 확인
    const existingPlayer = room.games[0]?.players.find(p => p.userId === userId);
    if (existingPlayer) {
      return NextResponse.json({ message: '이미 이 방의 게임에 참여 중입니다.' }, { status: 400 });
    }

    // 비밀번호 확인
    if (room.passwordHash && password) { // 비밀번호 해시가 존재하고 비밀번호가 제공된 경우
      const isValidPassword = await bcrypt.compare(password, room.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ message: '비밀번호가 틀렸습니다.' }, { status: 401 }); // 401 Unauthorized
      }
    } else if (room.passwordHash && !password) {
      // 비밀번호가 설정된 방인데 비밀번호를 제공하지 않은 경우
      return NextResponse.json({ message: '비밀번호가 필요한 방입니다.' }, { status: 401 }); // 401 Unauthorized
    }

    // 참여할 게임 찾기 (방당 하나의 게임이 있다고 가정)
    const game = room.games[0];
    if (!game) {
      return NextResponse.json({ message: '방에 연결된 게임을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 플레이어 추가 (두 번째 플레이어는 항상 백돌)
    await prisma.player.create({
      data: {
        userId,
        gameId: game.id,
        color: 'WHITE' // 방에 참여하는 플레이어는 항상 백돌
      }
    });

    // 방 인원 수 업데이트 및 상태 변경 (2명 모두 참여 완료 시 PLAYING으로 변경)
    const newPlayerCount = room.currentPlayerCount + 1;
    const newRoomStatus = newPlayerCount === room.maxPlayers ? 'PLAYING' : 'WAITING'; // Prisma Enum 값은 대문자

    await prisma.room.update({
      where: { id: roomId },
      data: {
        currentPlayerCount: newPlayerCount,
        status: newRoomStatus // 방 상태를 업데이트합니다.
      }
    });

    // 게임 상태도 업데이트합니다. (두 번째 플레이어 참여 시 게임 시작)
    if (newRoomStatus === 'PLAYING') {
      await prisma.game.update({
        where: { id: game.id },
        data: {
          status: 'PLAYING' // Prisma Enum 값은 대문자
        }
      });
    }

    return NextResponse.json({
      roomId: room.id,
      gameId: game.id,
      message: "방에 성공적으로 참여했습니다."
    }, { status: 200 });

  } catch (error) {
    console.error('방 참여 오류:', error);
    return NextResponse.json({
      message: '서버 오류: 방 참여 중 문제가 발생했습니다.',
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
