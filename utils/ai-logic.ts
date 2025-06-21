"use client"

// 클라이언트 사이드 AI 로직 (옵션)
// 실제 구현 시 minimax, Monte Carlo Tree Search 등 알고리즘 사용

type Stone = "black" | "white" | null
type Board = Stone[][]

interface AIMove {
  x: number
  y: number
  score: number
}

export class OmokAI {
  private difficulty: "easy" | "medium" | "hard"

  constructor(difficulty: "easy" | "medium" | "hard" = "medium") {
    this.difficulty = difficulty
  }

  // AI 착수 계산 (실제 구현 시 더 정교한 알고리즘 필요)
  calculateMove(board: Board, aiColor: Stone = "white"): AIMove | null {
    const emptyCells = this.getEmptyCells(board)
    if (emptyCells.length === 0) return null

    switch (this.difficulty) {
      case "easy":
        return this.randomMove(emptyCells)
      case "medium":
        return this.strategicMove(board, emptyCells, aiColor)
      case "hard":
        return this.minimaxMove(board, emptyCells, aiColor)
      default:
        return this.randomMove(emptyCells)
    }
  }

  private getEmptyCells(board: Board): { x: number; y: number }[] {
    const emptyCells = []
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (board[y][x] === null) {
          emptyCells.push({ x, y })
        }
      }
    }
    return emptyCells
  }

  private randomMove(emptyCells: { x: number; y: number }[]): AIMove {
    const randomIndex = Math.floor(Math.random() * emptyCells.length)
    const move = emptyCells[randomIndex]
    return { ...move, score: 0 }
  }

  private strategicMove(board: Board, emptyCells: { x: number; y: number }[], aiColor: Stone): AIMove {
    // 간단한 전략적 착수 (실제로는 더 복잡한 로직 필요)
    // 1. 승리 가능한 수 찾기
    // 2. 상대방 승리 막기
    // 3. 연속된 돌 만들기

    let bestMove = emptyCells[0]
    let bestScore = 0

    for (const cell of emptyCells) {
      const score = this.evaluatePosition(board, cell.x, cell.y, aiColor)
      if (score > bestScore) {
        bestScore = score
        bestMove = cell
      }
    }

    return { ...bestMove, score: bestScore }
  }

  private minimaxMove(board: Board, emptyCells: { x: number; y: number }[], aiColor: Stone): AIMove {
    // Minimax 알고리즘 구현 (실제 구현 시 alpha-beta pruning 추가)
    // 현재는 전략적 착수와 동일하게 처리
    return this.strategicMove(board, emptyCells, aiColor)
  }

  private evaluatePosition(board: Board, x: number, y: number, color: Stone): number {
    // 위치 평가 함수 (실제로는 더 정교한 평가 필요)
    let score = 0

    // 중앙에 가까울수록 높은 점수
    const centerDistance = Math.abs(x - 7) + Math.abs(y - 7)
    score += (14 - centerDistance) * 2

    // 연속된 돌의 개수에 따른 점수
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]

    for (const [dx, dy] of directions) {
      const count = this.countConsecutive(board, x, y, dx, dy, color)
      score += count * count * 10
    }

    return score
  }

  private countConsecutive(board: Board, x: number, y: number, dx: number, dy: number, color: Stone): number {
    let count = 0

    // 한 방향으로 카운트
    for (let i = 1; i < 5; i++) {
      const nx = x + dx * i
      const ny = y + dy * i
      if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[ny][nx] === color) {
        count++
      } else {
        break
      }
    }

    // 반대 방향으로 카운트
    for (let i = 1; i < 5; i++) {
      const nx = x - dx * i
      const ny = y - dy * i
      if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[ny][nx] === color) {
        count++
      } else {
        break
      }
    }

    return count
  }
}

// 사용 예시:
// const ai = new OmokAI('medium')
// const aiMove = ai.calculateMove(currentBoard, 'white')
