// app/api/auth/generateNickname/route.js
// 이 파일은 프로젝트 루트의 /app/api/auth/generateNickname/ 폴더 안에 위치해야 합니다.

import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid'; // uuid 라이브러리 임포트 (npm install uuid 필요!)
import { NextResponse } from 'next/server'; // Next.js 서버 응답을 위한 임포트

const prisma = new PrismaClient();

// POST 요청 핸들러: 새로운 익명 사용자를 생성합니다.
export async function POST(request) { // <<< 이 부분이 정확해야 합니다.
  try {
    let nickname;
    let isUnique = false;
    const newUserId = uuidv4(); // 고유한 사용자 ID를 미리 생성

    // 고유한 닉네임이 생성될 때까지 반복합니다.
    while (!isUnique) {
      const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4자리 숫자
      nickname = `익명 사용자 ${randomNum}`;

      // Prisma를 사용하여 데이터베이스에서 닉네임 중복을 확인합니다.
      const existingUser = await prisma.user.findUnique({
        where: { nickname },
      });

      if (!existingUser) {
        isUnique = true; // 닉네임이 고유하면 반복을 종료합니다.
      }
    }

    // 새 사용자 레코드를 데이터베이스에 생성합니다.
    const user = await prisma.user.create({
      data: {
        id: newUserId, // 미리 생성한 UUID를 사용 (Prisma User.id가 String @id @default(uuid()) 이어야 함)
        nickname: nickname
      },
    });

    // 성공 응답을 반환합니다.
    return NextResponse.json({
      userId: user.id,
      nickname: user.nickname,
    }, { status: 200 });

  } catch (error) {
    console.error("닉네임 생성 오류 (API):", error);
    // 오류 응답을 반환합니다.
    return NextResponse.json({
      message: "서버 오류: 닉네임 생성 중 문제가 발생했습니다.",
      details: error.message,
    }, { status: 500 });
  } finally {
    // Prisma 클라이언트 연결을 해제하여 자원을 효율적으로 관리합니다.
    await prisma.$disconnect();
  }
}

// 만약 다른 HTTP 메서드 (예: GET)를 이 라우트에서 허용하고 싶지 않다면,
// 명시적으로 다른 메서드에 대한 응답을 정의할 필요는 없습니다.
// Next.js는 기본적으로 정의된 메서드만 허용합니다.
// 하지만 만약을 위해 명시적으로 GET을 허용하지 않는 코드를 추가할 수도 있습니다:
/*
export async function GET(request) {
  return NextResponse.json({ message: "GET Method Not Allowed" }, { status: 405 });
}
*/
