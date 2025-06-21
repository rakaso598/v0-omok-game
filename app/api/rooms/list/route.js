// app/api/rooms/list/route.js
// 이 파일은 프로젝트 루트의 /app/api/rooms/list/ 폴더 안에 위치해야 합니다.

import { PrismaClient } from "@prisma/client";
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET 요청 핸들러: 활성화된 방 목록을 가져옵니다.
export async function GET(request) { // <<< 이 부분이 정확해야 합니다.
  try {
    const rooms = await prisma.room.findMany({
      where: {
        // 'WAITING' 또는 'PLAYING' 상태의 방만 가져옵니다. (Prisma enum 값은 대문자)
        status: {
          in: ['WAITING', 'PLAYING']
        }
      },
      // 최신 생성된 방이 먼저 표시되도록 정렬합니다.
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        currentPlayerCount: true,
        maxPlayers: true,
        status: true,
        gameMode: true,
        passwordHash: true, // 비밀번호 해시가 존재하는지 여부를 확인하기 위해 가져옵니다.
      },
    });

    // 클라이언트 Room 인터페이스에 맞춰 데이터를 가공합니다.
    const formattedRooms = rooms.map(room => ({
      id: room.id,
      title: room.title,
      currentPlayers: room.currentPlayerCount,
      maxPlayers: room.maxPlayers,
      status: room.status.toLowerCase(), // 클라이언트 Room 인터페이스에 맞춰 소문자로 변환
      gameMode: room.gameMode.toLowerCase(), // 클라이언트 Room 인터페이스에 맞춰 소문자로 변환
      hasPassword: room.passwordHash !== null, // passwordHash가 있으면 비밀번호가 있는 방으로 간주
    }));

    // 성공 응답을 반환합니다.
    return NextResponse.json({ rooms: formattedRooms }, { status: 200 });

  } catch (error) {
    console.error("방 목록 로드 오류 (API):", error);
    // 오류 응답을 반환합니다.
    return NextResponse.json({
      message: "방 목록을 불러오는데 실패했습니다.",
      details: error.message,
    }, { status: 500 });
  } finally {
    // Prisma 클라이언트 연결을 해제하여 자원을 효율적으로 관리합니다.
    await prisma.$disconnect();
  }
}
