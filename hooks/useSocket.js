// 클라이언트 측 WebSocket 연결 예시 (React Hook)
// components/hooks/useSocket.js 또는 유사한 경로에 저장

import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

/**
 * Socket.IO 클라이언트 연결을 관리하는 React 훅
 * @param {string} roomId - 참여할 방 ID
 * @param {string} userId - 현재 사용자 ID
 * @param {function} onGameStateChange - 게임 상태 변경 시 호출될 콜백 함수
 * @param {function} onMoveReceived - 착수 정보 수신 시 호출될 콜백 함수
 * @param {function} onEmoticonReceived - 이모티콘 수신 시 호출될 콜백 함수
 * @param {function} onPlayerJoined - 새 플레이어 참여 시 호출될 콜백 함수
 * @param {function} onPlayerLeft - 플레이어 나감 시 호출될 콜백 함수
 * @param {function} onPlayerDisconnected - 플레이어 연결 끊김 시 호출될 콜백 함수
 * @param {function} onPlayerTimeUpdated - 플레이어 시간 업데이트 시 호출될 콜백 함수
 * @param {function} onGameEnded - 게임 종료 시 호출될 콜백 함수
 * @returns {Socket | null} 연결된 Socket.IO 인스턴스 또는 null
 */
export function useSocket(
  roomId,
  userId,
  onGameStateChange,
  onMoveReceived,
  onEmoticonReceived,
  onPlayerJoined,
  onPlayerLeft,
  onPlayerDisconnected,
  onPlayerTimeUpdated,
  onGameEnded
) {
  const [socket, setSocket] = useState(null);
  const callbacks = useRef({
    onGameStateChange,
    onMoveReceived,
    onEmoticonReceived,
    onPlayerJoined,
    onPlayerLeft,
    onPlayerDisconnected,
    onPlayerTimeUpdated,
    onGameEnded,
  });

  // 콜백 함수가 변경될 때마다 ref를 업데이트합니다.
  useEffect(() => {
    callbacks.current = {
      onGameStateChange,
      onMoveReceived,
      onEmoticonReceived,
      onPlayerJoined,
      onPlayerLeft,
      onPlayerDisconnected,
      onPlayerTimeUpdated,
      onGameEnded,
    };
  }, [
    onGameStateChange,
    onMoveReceived,
    onEmoticonReceived,
    onPlayerJoined,
    onPlayerLeft,
    onPlayerDisconnected,
    onPlayerTimeUpdated,
    onGameEnded,
  ]);

  useEffect(() => {
    // roomId와 userId가 없으면 소켓 연결을 시도하지 않습니다.
    if (!roomId || !userId) {
      console.log('Room ID 또는 User ID가 없어 소켓 연결을 건너뜁니다.');
      return;
    }

    // Socket.IO 클라이언트 연결을 설정합니다.
    const socketInstance = io(process.env.NEXT_PUBLIC_SITE_URL, {
      path: '/api/socket',
      transports: ['websocket'], // 웹소켓 우선 사용
      reconnectionAttempts: 5, // 재연결 시도 횟수
      reconnectionDelay: 1000, // 재연결 시도 간격 (ms)
      timeout: 20000, // 연결 타임아웃 (ms)
    });

    setSocket(socketInstance);

    // Socket.IO 이벤트 리스너 설정
    socketInstance.on('connect', () => {
      console.log('Socket.IO 연결 성공:', socketInstance.id);
      // 방 참여
      socketInstance.emit('join-room', { roomId, userId });
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket.IO 연결 해제:', reason);
      // 재연결 로직 또는 사용자에게 알림 등 처리
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.IO 연결 오류:', error);
      // 연결 오류 시 사용자에게 알림 등 처리
    });

    socketInstance.on('error', (data) => {
      console.error('서버로부터 오류 수신:', data.message);
      // 서버에서 보낸 에러 메시지 처리
      alert(`오류: ${data.message}`); // 사용자에게 알림 (실제 앱에서는 커스텀 모달 사용)
    });

    // 방 참여 성공 시 초기 게임 상태 수신
    socketInstance.on('room-joined', (data) => {
      console.log('방 참여 완료 및 초기 게임 상태 수신:', data);
      if (callbacks.current.onGameStateChange) {
        callbacks.current.onGameStateChange(data.game, data.players);
      }
    });

    // 다른 플레이어 착수 수신
    socketInstance.on('game-state-changed', (data) => {
      console.log('게임 상태 변경 수신:', data);
      if (callbacks.current.onGameStateChange) {
        callbacks.current.onGameStateChange(data); // 전체 게임 객체 또는 필요한 데이터만 전달
      }
      if (callbacks.current.onMoveReceived && data.lastMove) {
        callbacks.current.onMoveReceived(data.lastMove); // 마지막 착수만 별도로 처리
      }
    });

    // 이모티콘 수신 처리
    socketInstance.on('emoticon-received', (data) => {
      console.log('이모티콘 수신:', data);
      if (callbacks.current.onEmoticonReceived) {
        callbacks.current.onEmoticonReceived(data);
      }
    });

    // 플레이어 참여 알림
    socketInstance.on('player-joined', (data) => {
      console.log('새 플레이어 참여:', data);
      if (callbacks.current.onPlayerJoined) {
        callbacks.current.onPlayerJoined(data);
      }
    });

    // 플레이어 나가기 알림
    socketInstance.on('player-left', (data) => {
      console.log('플레이어 나감:', data);
      if (callbacks.current.onPlayerLeft) {
        callbacks.current.onPlayerLeft(data);
      }
    });

    // 플레이어 연결 끊김 알림
    socketInstance.on('player-disconnected', (data) => {
      console.log('플레이어 연결 끊김:', data);
      if (callbacks.current.onPlayerDisconnected) {
        callbacks.current.onPlayerDisconnected(data);
      }
    });

    // 플레이어 시간 업데이트 수신
    socketInstance.on('player-time-updated', (data) => {
      console.log('플레이어 시간 업데이트 수신:', data);
      if (callbacks.current.onPlayerTimeUpdated) {
        callbacks.current.onPlayerTimeUpdated(data);
      }
    });

    // 게임 종료 처리
    socketInstance.on('game-ended', (data) => {
      console.log('게임 종료:', data);
      if (callbacks.current.onGameEnded) {
        callbacks.current.onGameEnded(data);
      }
    });

    // 컴포넌트 언마운트 시 정리 (연결 해제)
    return () => {
      if (socketInstance) {
        console.log('Socket.IO 연결 정리 중...');
        // 명시적으로 방을 나가는 이벤트를 보냅니다.
        if (roomId && userId) {
          socketInstance.emit('leave-room', { roomId, userId });
        }
        socketInstance.disconnect();
      }
    };
  }, [roomId, userId]); // roomId나 userId가 변경될 때마다 훅을 재실행합니다.

  return socket;
}
