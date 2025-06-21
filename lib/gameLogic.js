// lib/gameLogic.js

/**
 * 게임 보드 상태를 업데이트합니다.
 * @param {string[][]} currentBoard - 현재 보드 상태 (예: Array(15).fill(null).map(() => Array(15).fill(null)))
 * @param {number} x - 착수할 x 좌표
 * @param {number} y - 착수할 y 좌표
 * @param {'BLACK' | 'WHITE'} stone - 놓을 돌의 색깔
 * @returns {string[][]} 업데이트된 보드 상태
 */
function updateBoardState(currentBoard, x, y, stone) {
  // 깊은 복사를 통해 원본 배열을 수정하지 않도록 합니다.
  const newBoard = currentBoard.map(row => [...row]);
  if (newBoard[y] && newBoard[y][x] === null) {
    newBoard[y][x] = stone;
  }
  return newBoard;
}

/**
 * 승자를 확인합니다. 오목 규칙 (5개 연속)을 따릅니다.
 * @param {string[][]} board - 현재 보드 상태
 * @param {number} lastX - 마지막 착수 x 좌표
 * @param {number} lastY - 마지막 착수 y 좌표
 * @param {'BLACK' | 'WHITE'} stone - 마지막으로 놓인 돌의 색깔
 * @returns {'BLACK' | 'WHITE' | null} 승자가 있으면 돌의 색깔, 없으면 null
 */
function checkWinner(board, lastX, lastY, stone) {
  const BOARD_SIZE = 15;
  const directions = [
    { dx: 1, dy: 0 }, // 가로
    { dx: 0, dy: 1 }, // 세로
    { dx: 1, dy: 1 }, // 대각선 (우하향)
    { dx: 1, dy: -1 }, // 대각선 (우상향)
  ];

  for (const { dx, dy } of directions) {
    let count = 1;
    // 정방향 확인
    for (let i = 1; i < 5; i++) {
      const nx = lastX + dx * i;
      const ny = lastY + dy * i;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === stone) {
        count++;
      } else {
        break;
      }
    }
    // 역방향 확인
    for (let i = 1; i < 5; i++) {
      const nx = lastX - dx * i;
      const ny = lastY - dy * i;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === stone) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 5) {
      return stone; // 5개 이상 연속된 경우 승리
    }
  }

  return null;
}

// 오목 AI 로직 (간단한 무작위 착수 또는 기본 전략)
/**
 * AI의 다음 착수를 계산합니다. (간단한 구현)
 * @param {string[][]} board - 현재 보드 상태
 * @param {'BLACK' | 'WHITE'} aiColor - AI의 돌 색깔
 * @param {string} difficulty - 난이도 (easy, medium, hard)
 * @returns {{x: number, y: number} | null} AI의 착수 좌표 또는 착수 불가능 시 null
 */
function calculateAIMove(board, aiColor, difficulty) {
  const emptyCells = [];
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      if (board[y][x] === null) {
        emptyCells.push({ x, y });
      }
    }
  }

  if (emptyCells.length === 0) return null;

  switch (difficulty) {
    case "easy":
      // 무작위 착수
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    case "medium":
      // 간단한 방어/공격 로직 (구현 필요)
      // 예: 3개 연속된 곳 막기, 4개 연속 만들기 시도 등
      return calculateStrategicMove(board, emptyCells, aiColor);
    case "hard":
      // 미니맥스 또는 더 복잡한 알고리즘 (구현 필요)
      return calculateMinimaxMove(board, emptyCells, aiColor);
    default:
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }
}

// 미디엄 난이도 AI (예시: 3개 만들기/막기 시도)
function calculateStrategicMove(board, emptyCells, aiColor) {
  const opponentColor = aiColor === 'BLACK' ? 'WHITE' : 'BLACK';
  const BOARD_SIZE = 15;

  // 1. 5개 만들기 (승리) 시도
  for (const { x, y } of emptyCells) {
    const tempBoard = updateBoardState(board, x, y, aiColor);
    if (checkWinner(tempBoard, x, y, aiColor)) {
      return { x, y };
    }
  }

  // 2. 상대방 5개 막기 시도
  for (const { x, y } of emptyCells) {
    const tempBoard = updateBoardState(board, x, y, opponentColor);
    if (checkWinner(tempBoard, x, y, opponentColor)) {
      return { x, y };
    }
  }

  // 3. 4개 만들기 시도
  for (const { x, y } of emptyCells) {
    const tempBoard = updateBoardState(board, x, y, aiColor);
    if (checkFourInARow(tempBoard, x, y, aiColor)) {
      return { x, y };
    }
  }

  // 4. 상대방 4개 막기 시도
  for (const { x, y } of emptyCells) {
    const tempBoard = updateBoardState(board, x, y, opponentColor);
    if (checkFourInARow(tempBoard, x, y, opponentColor)) {
      return { x, y };
    }
  }

  // 5. 중앙 우선 순위 (초반 전략)
  const center = Math.floor(BOARD_SIZE / 2);
  const centerCells = [
    { x: center, y: center },
    { x: center - 1, y: center }, { x: center + 1, y: center },
    { x: center, y: center - 1 }, { x: center, y: center + 1 },
  ];
  for (const cell of centerCells) {
    if (emptyCells.some(e => e.x === cell.x && e.y === cell.y)) {
      return cell;
    }
  }

  // 6. 무작위 착수
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

// 4개 연속 확인 헬퍼 (양 끝이 막혀있지 않은 열린 4만 체크)
function checkFourInARow(board, lastX, lastY, stone) {
  const BOARD_SIZE = 15;
  const directions = [
    { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
  ];

  for (const { dx, dy } of directions) {
    // 양방향으로 확장하여 4개 연속인지 확인
    for (let i = -4; i <= 0; i++) {
      let count = 0;
      let openEnds = 0; // 양 끝이 열려있는지 확인

      const startX = lastX + dx * i;
      const startY = lastY + dy * i;

      if (startX < 0 || startX >= BOARD_SIZE || startY < 0 || startY >= BOARD_SIZE) continue;

      // 시작점 앞이 열려있는지 확인
      const prevX = startX - dx;
      const prevY = startY - dy;
      if (prevX >= 0 && prevX < BOARD_SIZE && prevY >= 0 && prevY < BOARD_SIZE && board[prevY][prevX] === null) {
        openEnds++;
      } else if (prevX < 0 || prevX >= BOARD_SIZE || prevY < 0 || prevY >= BOARD_SIZE) {
        openEnds++; // 보드 밖도 열린 것으로 간주
      }


      for (let j = 0; j < 5; j++) {
        const cx = startX + dx * j;
        const cy = startY + dy * j;

        if (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && board[cy][cx] === stone) {
          count++;
        } else if (board[cy][cx] !== null) {
          // 중간에 다른 돌이 있거나 막혔으면 연속 아님
          count = 0; // 리셋
          break;
        } else {
          // 비어있는 칸이면 count를 더 늘리지 않음.
          // 여기서 j가 4에 도달하면 4개 연속이 완성됨.
        }
      }

      // 끝점 뒤가 열려있는지 확인
      const nextX = startX + dx * 5;
      const nextY = startY + dy * 5;
      if (nextX >= 0 && nextX < BOARD_SIZE && nextY >= 0 && nextY < BOARD_SIZE && board[nextY][nextX] === null) {
        openEnds++;
      } else if (nextX < 0 || nextX >= BOARD_SIZE || nextY < 0 || nextY >= BOARD_SIZE) {
        openEnds++; // 보드 밖도 열린 것으로 간주
      }

      if (count === 4 && openEnds >= 1) { // 4개가 연속되고 최소 한쪽이 열려있으면 (열린 4)
        return true;
      }
    }
  }
  return false;
}


// 하드 난이도 AI (미니맥스) - 실제 구현은 복잡하여 기본적인 틀만 제공
function calculateMinimaxMove(board, emptyCells, aiColor) {
  // 실제 Minimax 알고리즘 구현
  // 평가 함수 (evaluateBoard)와 재귀적인 탐색 (minimax) 필요
  console.log("Minimax AI 로직은 복잡하여 현재는 무작위 착수를 반환합니다.");
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}


module.exports = {
  updateBoardState,
  checkWinner,
  calculateAIMove,
};
