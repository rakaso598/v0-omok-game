// components/hooks/useAuth.tsx

import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  userId: string | null;
  nickname: string | null;
  isLoading: boolean;
  generateNewUser: () => Promise<void>;
}

/**
 * 익명 사용자 인증 정보를 관리하는 React 훅.
 * userId와 nickname을 로컬 스토리지에 저장하고, 없으면 서버에서 새로 생성합니다.
 * @returns {AuthState}
 */
export function useAuth(): AuthState {
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 서버에서 새로운 익명 사용자 정보를 가져오는 함수
  const generateNewUser = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('새로운 익명 사용자 생성 중...');
      const response = await fetch('/api/auth/generateNickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // API에서 상세 오류 메시지를 받아와서 throw
        const errorData = await response.json();
        throw new Error(errorData.message || '닉네임 생성에 실패했습니다.');
      }

      const data: { userId: string; nickname: string } = await response.json();
      console.log('익명 사용자 생성 성공:', data);

      // 로컬 스토리지에 저장
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('nickname', data.nickname);

      setUserId(data.userId);
      setNickname(data.nickname);
    } catch (error: any) { // 타입 추론을 위해 any 추가
      console.error('익명 사용자 생성 오류:', error.message); // 에러 메시지 직접 출력
      // 사용자에게 오류 알림 등 추가 가능 (예: alert 대신 CustomModal 사용)
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 로컬 스토리지에서 사용자 정보 로드 또는 새로 생성
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedNickname = localStorage.getItem('nickname');

    if (storedUserId && storedNickname) {
      setUserId(storedUserId);
      setNickname(storedNickname);
      setIsLoading(false);
    } else {
      // 로컬 스토리지에 없으면 새로운 사용자 생성 요청
      generateNewUser();
    }
  }, [generateNewUser]); // generateNewUser가 변경될 때마다 이펙트 재실행

  return { userId, nickname, isLoading, generateNewUser };
}
