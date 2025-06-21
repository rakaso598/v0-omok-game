"use client"

// WebSocket 서버 구조 제안
// pages/api/socket.js 또는 별도의 WebSocket 서버

const { Server } = require("socket.io")

// Next.js API Route에서 Socket.IO 설정
export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("Socket.IO 서버 초기화 중...")

    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    // 연결 이벤트 처리
    io.on("connection", (socket) => {
      console.log("클라이언트 연결:", socket.id)

      // 방 참여
      socket.on("join-room", (roomId) => {
        socket.join(roomId)
        console.log(`클라이언트 ${socket.id}가 방 ${roomId}에 참여`)

        // 방의 다른 사용자들에게 새 플레이어 참여 알림
        socket.to(roomId).emit("player-joined", {
          playerId: socket.id,
          timestamp: new Date(),
        })
      })

      // 게임 착수 이벤트
      socket.on("game-move", (data) => {
        const { roomId, x, y, stone, playerId } = data

        // 같은 방의 다른 플레이어들에게 착수 정보 브로드캐스트
        socket.to(roomId).emit("move-received", {
          x,
          y,
          stone,
          playerId,
          timestamp: new Date(),
        })

        console.log(`방 ${roomId}에서 착수: (${x}, ${y}) - ${stone}`)
      })

      // 이모티콘 전송 이벤트
      socket.on("send-emoticon", (data) => {
        const { roomId, emoticon, senderId } = data

        // 같은 방의 다른 플레이어들에게 이모티콘 브로드캐스트
        socket.to(roomId).emit("emoticon-received", {
          emoticon,
          senderId,
          timestamp: new Date(),
        })

        console.log(`방 ${roomId}에서 이모티콘 전송: ${emoticon}`)
      })

      // 게임 상태 업데이트
      socket.on("game-state-update", (data) => {
        const { roomId, gameState } = data

        // 방의 모든 플레이어들에게 게임 상태 브로드캐스트
        io.to(roomId).emit("game-state-changed", gameState)
      })

      // 플레이어 시간 업데이트
      socket.on("time-update", (data) => {
        const { roomId, playerId, remainingTime } = data

        socket.to(roomId).emit("player-time-updated", {
          playerId,
          remainingTime,
        })
      })

      // 게임 종료
      socket.on("game-end", (data) => {
        const { roomId, winner, reason } = data

        io.to(roomId).emit("game-ended", {
          winner,
          reason,
          timestamp: new Date(),
        })
      })

      // 방 나가기
      socket.on("leave-room", (roomId) => {
        socket.leave(roomId)
        socket.to(roomId).emit("player-left", {
          playerId: socket.id,
          timestamp: new Date(),
        })

        console.log(`클라이언트 ${socket.id}가 방 ${roomId}에서 나감`)
      })

      // 연결 해제
      socket.on("disconnect", () => {
        console.log("클라이언트 연결 해제:", socket.id)

        // 모든 방에서 플레이어 제거 알림
        socket.broadcast.emit("player-disconnected", {
          playerId: socket.id,
          timestamp: new Date(),
        })
      })
    })

    res.socket.server.io = io
  }

  res.end()
}

// 클라이언트 측 WebSocket 연결 예시 (React Hook)
/*
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useSocket(roomId) {
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    // Socket.IO 클라이언트 연결
    const socketInstance = io(process.env.NEXT_PUBLIC_SITE_URL, {
      path: '/api/socket',
    });
    
    setSocket(socketInstance);
    
    // 방 참여
    if (roomId) {
      socketInstance.emit('join-room', roomId);
    }
    
    // 이벤트 리스너 설정
    socketInstance.on('move-received', (data) => {
      // 상대방 착수 처리
      console.log('상대방 착수:', data);
    });
    
    socketInstance.on('emoticon-received', (data) => {
      // 이모티콘 수신 처리
      console.log('이모티콘 수신:', data);
    });
    
    socketInstance.on('game-state-changed', (gameState) => {
      // 게임 상태 업데이트
      console.log('게임 상태 변경  (gameState) => {
      // 게임 상태 업데이트
      console.log('게임 상태 변경:', gameState);
    });
    
    socketInstance.on('game-ended', (data) => {
      // 게임 종료 처리
      console.log('게임 종료:', data);
    });
    
    socketInstance.on('player-left', (data) => {
      // 플레이어 나가기 처리
      console.log('플레이어 나감:', data);
    });
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      if (roomId) {
        socketInstance.emit('leave-room', roomId);
      }
      socketInstance.disconnect();
    };
  }, [roomId]);
  
  return socket;
}
*/
