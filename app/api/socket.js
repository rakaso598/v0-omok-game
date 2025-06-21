// app/api/socket.js

import { Server } from 'socket.io'; // ESM 방식으로 import
import { PrismaClient } from "@prisma/client"; // ESM 방식으로 import
// require 대신 import 사용 (Next.js는 pages/api에서 Babel/Webpack을 통해 이를 처리함)
import { checkWinner, updateBoardState } from '../../../lib/gameLogic'; // 경로 확인

const prisma = new PrismaClient();

export default function handler(req, res) {
  // res.socket.server.io가 이미 존재하면 기존 서버를 사용합니다.
  // hot-reloading 시 동일한 서버 인스턴스를 재사용하기 위함입니다.
  if (res.socket.server.io) {
    console.log('Socket.IO is already running');
  } else {
    console.log('Socket.IO 서버 초기화 중...'); // 메시지 수정

    const io = new Server(res.socket.server, {
      path: "/api/socket", // 클라이언트에서 연결할 경로와 일치해야 합니다.
      addTrailingSlash: false, // 경로 끝 슬래시 제거
      cors: {
        origin: process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_SITE_URL : "*",
        methods: ["GET", "POST"], // Socket.IO는 GET/POST 메서드를 사용
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ["websocket", "polling"],
    });

    // io 객체를 res.socket.server에 저장하여 재사용합니다.
    res.socket.server.io = io;

    // --- Socket.IO 이벤트 핸들러 정의 시작 ---
    io.on("connection", (socket) => {
      console.log(`클라이언트 연결: ${socket.id}`);

      socket.on("error", (error) => {
        console.error(`소켓 에러 (${socket.id}):`, error);
        socket.emit("error", { message: "연결 중 오류가 발생했습니다." });
      });

      // 방 참여 이벤트
      socket.on("join-room", async (data) => {
        try {
          const { roomId, userId } = data;

          if (!roomId || !userId) {
            socket.emit("error", { message: "방 참여에 필수적인 정보가 누락되었습니다." });
            return;
          }

          const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
              games: {
                include: {
                  players: {
                    include: { user: true }
                  },
                  room: true
                }
              }
            },
          });

          if (!room) {
            socket.emit("error", { message: "방을 찾을 수 없습니다." });
            return;
          }

          // 게임이 시작되지 않은 AI 모드 방에서 AI 플레이어 추가 로직 (생성 시점에 없었다면)
          if (room.gameMode === 'AI' && room.games[0] && room.games[0].players.length === 1) {
            let aiUser = await prisma.user.findUnique({ where: { id: "AI" } });
            if (!aiUser) {
              aiUser = await prisma.user.create({ data: { id: "AI", nickname: "Gomoku AI" } });
            }
            await prisma.player.create({
              data: {
                userId: aiUser.id,
                gameId: room.games[0].id,
                color: 'WHITE',
              },
            });
            // 플레이어가 추가되었으므로 게임 상태 업데이트
            await prisma.room.update({
              where: { id: room.id },
              data: {
                currentPlayerCount: 2, // AI 포함 2명으로 업데이트
                status: 'PLAYING'
              }
            });
            await prisma.game.update({
              where: { id: room.games[0].id },
              data: {
                status: 'PLAYING'
              }
            });
          }


          socket.join(roomId);
          socket.roomId = roomId; // 소켓 객체에 roomId 저장
          socket.userId = userId; // 소켓 객체에 userId 저장

          // 업데이트된 방 정보를 다시 가져와서 전송
          const updatedRoom = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
              games: {
                include: {
                  players: {
                    include: { user: true }
                  },
                  room: true
                }
              }
            },
          });


          socket.emit("room-joined", {
            roomId,
            game: updatedRoom.games[0], // 업데이트된 게임 정보 전송
            players: updatedRoom.games[0]?.players, // 업데이트된 플레이어 정보 전송
          });

          socket.to(roomId).emit("player-joined", {
            socketId: socket.id,
            userId: userId,
            nickname: updatedRoom.games[0]?.players.find(p => p.userId === userId)?.user.nickname || "알 수 없는 사용자",
            timestamp: new Date(),
          });

          console.log(`클라이언트 ${socket.id} (유저: ${userId})가 방 ${roomId}에 참여`);
          io.emit('room-list-updated'); // 방 참여 시에도 방 목록 갱신 이벤트 발생

        } catch (error) {
          console.error("방 참여 오류:", error);
          socket.emit("error", { message: "방 참여 중 오류가 발생했습니다." });
        } finally {
          await prisma.$disconnect(); // 각 요청 후 disconnect
        }
      });

      // 게임 착수 이벤트
      socket.on("game-move", async (data) => {
        try {
          const { roomId, x, y, stone, gameId, userId } = data;

          if (!roomId || x === undefined || y === undefined || x < 0 || x >= 15 || y < 0 || y >= 15 || !stone || !gameId || !userId) {
            socket.emit("error", { message: "잘못된 착수 정보이거나 필수 정보가 누락되었습니다." });
            return;
          }

          const game = await prisma.game.findUnique({
            where: { id: gameId },
            include: {
              players: {
                include: { user: true }
              },
              room: true
            },
          });

          if (!game || game.status !== "PLAYING") {
            socket.emit("error", { message: "게임이 진행 중이 아니거나 유효하지 않습니다." });
            return;
          }

          const player = game.players.find(p => p.userId === userId);
          if (!player || player.color !== game.currentTurn) {
            socket.emit("error", { message: "당신의 턴이 아니거나 유효한 플레이어가 아닙니다." });
            return;
          }

          let currentBoard = JSON.parse(game.boardState);
          if (currentBoard[y][x] !== null) {
            socket.emit("error", { message: "이미 돌이 놓인 위치입니다." });
            return;
          }

          const newBoardState = updateBoardState(currentBoard, x, y, stone);

          const winnerColor = checkWinner(newBoardState, x, y, stone);
          let nextTurn = stone === 'BLACK' ? 'WHITE' : 'BLACK';
          let gameStatus = 'PLAYING';
          let winnerId = null;
          let endTime = null;

          if (winnerColor) {
            gameStatus = 'FINISHED';
            winnerId = userId; // 착수한 플레이어가 승자
            endTime = new Date();
            nextTurn = null; // 게임 종료 시 다음 턴 없음
          } else if (newBoardState.flat().every(cell => cell !== null)) { // 보드가 가득 찬 경우 (무승부)
            gameStatus = 'FINISHED';
            endTime = new Date();
            nextTurn = null; // 게임 종료 시 다음 턴 없음
            console.log("게임 무승부!");
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

          io.to(roomId).emit("game-state-changed", {
            gameId: game.id,
            boardState: newBoardState,
            currentTurn: nextTurn,
            status: gameStatus,
            winnerId: winnerId,
            lastMove: { x, y, stone, userId },
          });

          console.log(`방 ${roomId}에서 착수: (${x}, ${y}) - ${stone} by ${userId}. 현재 턴: ${nextTurn}, 상태: ${gameStatus}`);

          // AI 턴 처리
          if (game.room.gameMode === 'AI' && nextTurn === 'WHITE' && gameStatus === 'PLAYING') {
            console.log("AI 턴! AI 착수를 요청합니다...");
            // AI 착수 API 호출 (내부 API)
            fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/game/aiMove`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gameId: game.id,
                boardState: newBoardState,
                difficulty: 'medium', // 난이도 설정
                roomId: roomId, // AI API에 roomId도 전달 (필요하다면)
              }),
            })
              .then(aiRes => {
                if (!aiRes.ok) {
                  // HTTP 오류가 발생했을 때 서버 응답 본문을 읽어서 오류 처리
                  return aiRes.json().then(err => { throw new Error(err.message || `AI move API returned status ${aiRes.status}`); });
                }
                return aiRes.json();
              })
              .then(aiData => {
                console.log("AI 착수 API 응답:", aiData);
                // AI 착수 후 게임 상태 업데이트 로직은 aiMove API 내부에서 처리되어야 합니다.
                // 여기서는 AI가 착수하면 Socket.IO를 통해 'game-state-changed'가 다시 트리거될 것을 예상합니다.
              })
              .catch(aiError => console.error("AI 착수 요청 실패:", aiError));
          }

        } catch (error) {
          console.error("게임 착수 처리 오류:", error);
          socket.emit("error", { message: "착수 처리 중 오류가 발생했습니다." });
        } finally {
          await prisma.$disconnect(); // 각 요청 후 disconnect
        }
      });

      // 이모티콘 전송 이벤트
      socket.on("send-emoticon", (data) => {
        const { roomId, emoticon, senderId } = data;
        io.to(roomId).emit("emoticon-received", { // socket.to 대신 io.to로 브로드캐스트
          emoticon,
          senderId,
          timestamp: new Date(),
        });
        console.log(`방 ${roomId}에서 이모티콘 전송: ${emoticon} by ${senderId}`);
      });

      // 시간 업데이트 이벤트
      socket.on("time-update", async (data) => {
        const { roomId, gameId, userId, remainingTime } = data;
        try {
          // 플레이어의 남은 시간 업데이트 (Prisma 'Player' 모델에 remainingTime 필드 존재 확인)
          await prisma.player.updateMany({
            where: { gameId, userId },
            data: { remainingTime: Math.max(0, remainingTime) }
          });
          io.to(roomId).emit("player-time-updated", { // socket.to 대신 io.to로 브로드캐스트
            userId,
            remainingTime,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("시간 업데이트 오류:", error);
        } finally {
          await prisma.$disconnect();
        }
      });

      // 게임 종료 이벤트 (클라이언트에서 명시적으로 종료를 알릴 때)
      socket.on("game-end", async (data) => {
        const { roomId, gameId, winnerId, reason } = data;
        try {
          await prisma.$transaction(async (tx) => {
            await tx.game.update({
              where: { id: gameId },
              data: {
                status: 'FINISHED',
                winnerId: winnerId,
                endTime: new Date(),
              }
            });
            await tx.room.update({
              where: { id: roomId },
              data: {
                status: 'FINISHED', // 방 상태도 'FINISHED'로 변경
                currentPlayerCount: 0 // 모든 플레이어 나감 처리
              }
            });
          });

          io.to(roomId).emit("game-ended", {
            winner: winnerId,
            reason,
            timestamp: new Date(),
          });
          console.log(`방 ${roomId}의 게임 ${gameId} 종료: 승자 ${winnerId}, 이유: ${reason}`);
          io.emit('room-list-updated'); // 게임 종료 시 방 목록 갱신 이벤트 발생
        } catch (error) {
          console.error("게임 종료 처리 오류:", error);
        } finally {
          await prisma.$disconnect();
        }
      });

      // 방 나가기 이벤트 (플레이어가 자발적으로 방을 나갈 때)
      socket.on("leave-room", async (data) => {
        const { roomId, userId } = data;
        if (!roomId || !userId) {
          socket.emit("error", { message: "방 나가기에 필요한 정보가 부족합니다." });
          return;
        }

        try {
          socket.leave(roomId); // 소켓을 방에서 나감

          // 방을 나가는 플레이어에게만 메시지를 보내는 대신,
          // 해당 방에 남아있는 다른 플레이어들에게 알림
          socket.to(roomId).emit("player-left", {
            socketId: socket.id,
            userId: userId,
            timestamp: new Date(),
          });
          console.log(`클라이언트 ${socket.id} (유저: ${userId})가 방 ${roomId}에서 나감`);

          // DB 업데이트 로직: 플레이어 제거, 방/게임 상태 업데이트
          const game = await prisma.game.findFirst({
            where: { roomId: roomId, status: 'PLAYING' }, // 현재 진행 중인 게임만 고려
            include: { room: true, players: true }
          });

          if (game) {
            await prisma.$transaction(async (tx) => {
              // 해당 게임에서 플레이어 삭제
              await tx.player.deleteMany({
                where: { gameId: game.id, userId: userId }
              });

              // 방의 현재 플레이어 수 감소
              const updatedRoom = await tx.room.update({
                where: { id: game.roomId },
                data: {
                  currentPlayerCount: {
                    decrement: 1
                  }
                }
              });

              // 만약 2인 게임에서 한 명이 나갔고 남은 플레이어가 1명이라면 (상대방이 나간 경우)
              if (game.players.length === 2 && updatedRoom.currentPlayerCount === 1) {
                const remainingPlayer = game.players.find(p => p.userId !== userId); // 남은 플레이어 찾기
                await tx.game.update({
                  where: { id: game.id },
                  data: {
                    status: 'FINISHED', // 게임 종료 처리
                    endTime: new Date(),
                    winnerId: remainingPlayer?.userId || null, // 남은 플레이어를 승자로
                  }
                });
                await tx.room.update({
                  where: { id: game.roomId },
                  data: {
                    status: 'FINISHED', // 방 상태도 종료
                  }
                });
                io.to(roomId).emit("game-ended", {
                  winner: remainingPlayer?.userId || null,
                  reason: `${remainingPlayer?.user.nickname || "상대방"}님이 게임을 떠났습니다.`,
                  timestamp: new Date(),
                });
              }
              // 만약 모든 플레이어가 나갔다면 (AI 모드 포함)
              else if (updatedRoom.currentPlayerCount === 0) {
                await tx.game.update({
                  where: { id: game.id },
                  data: {
                    status: 'FINISHED',
                    endTime: new Date(),
                  }
                });
                await tx.room.update({
                  where: { id: game.roomId },
                  data: {
                    status: 'FINISHED',
                  }
                });
              }
            });
          }
          io.emit('room-list-updated'); // 방 나가기 시 방 목록 갱신 이벤트 발생

        } catch (error) {
          console.error("방 나가기 처리 오류 (소켓):", error);
          socket.emit("error", { message: "방 나가기 처리 중 오류가 발생했습니다." });
        } finally {
          await prisma.$disconnect();
        }
      });

      // 소켓 연결 해제 이벤트 (브라우저 닫힘, 네트워크 끊김 등)
      socket.on("disconnect", async (reason) => {
        console.log(`클라이언트 연결 해제: ${socket.id}, 이유: ${reason}`);

        // 소켓에 저장된 roomId와 userId를 사용하여 DB 업데이트
        if (socket.roomId && socket.userId) {
          const roomId = socket.roomId;
          const userId = socket.userId;

          // 해당 방의 다른 플레이어들에게 연결 해제 알림
          socket.to(roomId).emit("player-disconnected", {
            socketId: socket.id,
            userId: userId,
            reason,
            timestamp: new Date(),
          });

          try {
            // 현재 진행 중인 게임이 있는지 확인
            const game = await prisma.game.findFirst({
              where: { roomId: roomId, status: 'PLAYING' },
              include: { room: true, players: true }
            });

            if (game) {
              await prisma.$transaction(async (tx) => {
                // 해당 게임에서 플레이어 제거
                await tx.player.deleteMany({
                  where: { gameId: game.id, userId: userId }
                });

                // 방의 현재 플레이어 수 감소
                const updatedRoom = await tx.room.update({
                  where: { id: game.roomId },
                  data: {
                    currentPlayerCount: {
                      decrement: 1
                    }
                  }
                });

                // 만약 2인 게임에서 한 명이 연결 해제되었고 남은 플레이어가 1명이라면
                if (game.players.length === 2 && updatedRoom.currentPlayerCount === 1) {
                  const remainingPlayer = game.players.find(p => p.userId !== userId); // 남은 플레이어 찾기
                  await tx.game.update({
                    where: { id: game.id },
                    data: {
                      status: 'FINISHED', // 게임 종료 처리
                      endTime: new Date(),
                      winnerId: remainingPlayer?.userId || null, // 남은 플레이어를 승자로
                    }
                  });
                  await tx.room.update({
                    where: { id: game.roomId },
                    data: {
                      status: 'FINISHED', // 방 상태도 종료
                    }
                  });
                  io.to(roomId).emit("game-ended", {
                    winner: remainingPlayer?.userId || null,
                    reason: `${remainingPlayer?.user.nickname || "상대방"}님이 연결을 끊었습니다.`,
                    timestamp: new Date(),
                  });
                }
                // 만약 모든 플레이어가 나갔다면 (AI 모드 포함)
                else if (updatedRoom.currentPlayerCount === 0) {
                  await tx.game.update({
                    where: { id: game.id },
                    data: {
                      status: 'FINISHED',
                      endTime: new Date(),
                    }
                  });
                  await tx.room.update({
                    where: { id: game.roomId },
                    data: {
                      status: 'FINISHED',
                    }
                  });
                }
              });
            }
          } catch (dbError) {
            console.error("연결 해제 시 DB 업데이트 오류:", dbError);
          }
        }
        io.emit('room-list-updated'); // 연결 해제 시 방 목록 갱신 이벤트 발생
      });
    });
    // --- Socket.IO 이벤트 핸들러 정의 끝 ---
  }

  res.end(); // API 라우트 응답 종료
};
