-- Prisma Schema 제안 (prisma/schema.prisma)
-- 이 스키마를 기반으로 데이터베이스 모델을 구성하세요

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // 또는 "mysql", "sqlite"
  url      = env("DATABASE_URL")
}

// 익명 사용자 모델
model User {
  id        String   @id @default(cuid())
  nickname  String   @unique // 고유한 임시 닉네임
  createdAt DateTime @default(now())
  
  // 관계
  players   Player[]
  moves     Move[]
  
  @@map("users")
}

// 게임 방 모델
model Room {
  id                 String   @id @default(cuid())
  title              String
  passwordHash       String?  // 비밀번호 없는 경우 null
  status             RoomStatus @default(WAITING)
  gameMode           GameMode
  currentPlayerCount Int      @default(1)
  maxPlayers         Int      @default(2)
  createdAt          DateTime @default(now())
  
  // 관계
  games             Game[]
  
  @@map("rooms")
}

// 게임 모델
model Game {
  id          String     @id @default(cuid())
  roomId      String
  boardState  String     @default("") // JSON 문자열로 게임판 상태 저장
  currentTurn PlayerColor @default(BLACK)
  winnerId    String?    // 승자 ID, null 가능
  status      GameStatus @default(PLAYING)
  startTime   DateTime   @default(now())
  endTime     DateTime?
  
  // 관계
  room        Room       @relation(fields: [roomId], references: [id])
  players     Player[]
  moves       Move[]
  
  @@map("games")
}

// 착수 기록 모델
model Move {
  id         String   @id @default(cuid())
  gameId     String
  playerId   String
  x          Int      // 0-14
  y          Int      // 0-14
  moveNumber Int      // 착수 순서
  timestamp  DateTime @default(now())
  
  // 관계
  game       Game     @relation(fields: [gameId], references: [id])
  player     User     @relation(fields: [playerId], references: [id])
  
  @@map("moves")
}

// 게임 내 플레이어 모델
model Player {
  id            String      @id @default(cuid())
  userId        String
  gameId        String
  color         PlayerColor // BLACK 또는 WHITE
  initialTime   Int         @default(300) // 초 단위 (5분)
  remainingTime Int         @default(300)
  
  // 관계
  user          User        @relation(fields: [userId], references: [id])
  game          Game        @relation(fields: [gameId], references: [id])
  
  @@unique([userId, gameId])
  @@map("players")
}

// Enums
enum RoomStatus {
  WAITING
  PLAYING
  FINISHED
}

enum GameMode {
  ONLINE
  AI
}

enum GameStatus {
  WAITING
  PLAYING
  FINISHED
}

enum PlayerColor {
  BLACK
  WHITE
}
