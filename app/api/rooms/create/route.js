// app/api/rooms/create/route.js
// 이 파일은 프로젝트 루트의 /app/api/rooms/create/ 폴더 안에 위치해야 합니다.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; // npm install bcrypt 필요
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// POST 요청 핸들러: 새로운 게임 방을 생성합니다.
export async function POST(request) {
  try {
    const { title, password, gameMode, userId } = await request.json(); // 요청 본문 파싱

    // 입력 검증
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ message: "방 제목을 입력해주세요." }, { status: 400 });
    }
    if (title.length > 50) {
      return NextResponse.json({ message: "방 제목은 50자 이하로 입력해주세요." }, { status: 400 });
    }
    const lowerGameMode = gameMode?.toLowerCase();
    if (!["online", "ai"].includes(lowerGameMode)) {
      return NextResponse.json({ message: "올바른 게임 모드를 선택해주세요." }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ message: "사용자 정보가 필요합니다." }, { status: 400 });
    }

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 비밀번호 해시화
    let passwordHash = null;
    let hasPassword = false;
    if (password && password.trim().length > 0) {
      if (password.length < 4) {
        return NextResponse.json({ message: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
      }
      passwordHash = await bcrypt.hash(password.trim(), 10);
      hasPassword = true; // 비밀번호가 설정됨
    }

    // Prisma 트랜잭션을 사용하여 방, 게임, 플레이어를 원자적으로 생성합니다.
    const result = await prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          title: title.trim(),
          passwordHash, // 비밀번호 해시 저장
          gameMode: lowerGameMode.toUpperCase(), // Prisma enum 값은 대문자
          currentPlayerCount: 1, // 방 생성자는 첫 번째 플레이어이므로 1
          maxPlayers: 2, // 기본적으로 2인용
          status: lowerGameMode === 'ai' ? 'PLAYING' : 'WAITING', // AI 모드는 즉시 플레이 중, 온라인은 대기 중
        },
      });

      // 15x15 크기의 빈 보드 상태를 JSON 문자열로 초기화합니다.
      const initialBoardState = JSON.stringify(
        Array(15).fill(null).map(() => Array(15).fill(null))
      );

      const game = await tx.game.create({
        data: {
          roomId: room.id,
          boardState: initialBoardState,
          currentTurn: 'BLACK', // 항상 BLACK (선수)이 먼저 시작
          status: room.status === 'PLAYING' ? 'PLAYING' : 'WAITING', // AI 게임이면 PLAYING, 아니면 WAITING
        },
      });

      // 방 생성자를 첫 번째 플레이어(BLACK)로 추가합니다.
      await tx.player.create({
        data: {
          userId,
          gameId: game.id,
          color: 'BLACK', // 방 생성자는 항상 흑돌
        },
      });

      // AI 모드인 경우, AI 플레이어(WHITE)를 추가합니다.
      if (lowerGameMode === 'ai') {
        // AI 사용자 ID가 없다면 생성 (또는 미리 생성된 AI 사용자 ID 사용)
        let aiUser = await tx.user.findUnique({ where: { id: "AI" } }); // Prisma schema의 User.id가 String @id 이므로 "AI" 가능
        if (!aiUser) {
          aiUser = await tx.user.create({ data: { id: "AI", nickname: "Gomoku AI" } });
        }
        await tx.player.create({
          data: {
            userId: aiUser.id,
            gameId: game.id,
            color: 'WHITE', // AI는 항상 백돌
          },
        });
      }

      return { room, game };
    });

    return NextResponse.json({
      roomId: result.room.id,
      gameId: result.game.id,
      message: "방이 성공적으로 생성되었습니다.",
    }, { status: 201 }); // 201 Created 응답

  } catch (error) {
    console.error("방 생성 오류:", error);

    // Prisma 고유 제약 조건 위반 (예: 이미 존재하는 방 제목) 처리
    if (error.code === "P2002") {
      return NextResponse.json({ message: "이미 존재하는 방 제목입니다." }, { status: 409 }); // 409 Conflict 응답
    }

    return NextResponse.json({
      message: "방 생성 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined, // 개발 환경에서만 자세한 오류 메시지 제공
    }, { status: 500 }); // 500 Internal Server Error 응답
  } finally {
    await prisma.$disconnect();
  }
}
