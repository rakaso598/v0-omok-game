"use client"

import { useReducer, useCallback } from "react"

// 게임 상태 관리를 위한 커스텀 훅 (권장 구조)
type Stone = "black" | "white" | null
type GameStatus = "waiting" | "playing" | "finished"

interface GameState {
  board: Stone[][]
  currentTurn: "black" | "white"
  gameStatus: GameStatus
  winner: string | null
  isAiThinking: boolean
  connectionStatus: "connecting" | "connected" | "disconnected" | "error"
  player1: {
    nickname: string
    remainingTime: number
  }
  player2: {
    nickname: string
    remainingTime: number
  }
}

type GameAction =
  | { type: "MOVE_MADE"; payload: { x: number; y: number; stone: Stone; nextTurn: "black" | "white" } }
  | { type: "GAME_ENDED"; payload: { winner: string } }
  | { type: "AI_THINKING"; payload: boolean }
  | { type: "CONNECTION_STATUS"; payload: GameState["connectionStatus"] }
  | { type: "SYNC_FROM_SERVER"; payload: Partial<GameState> }
  | { type: "UPDATE_TIMER"; payload: { player: "player1" | "player2"; time: number } }
  | { type: "RESET_GAME" }

const initialState: GameState = {
  board: Array(15)
    .fill(null)
    .map(() => Array(15).fill(null)),
  currentTurn: "black",
  gameStatus: "waiting",
  winner: null,
  isAiThinking: false,
  connectionStatus: "connecting",
  player1: { nickname: "익명 사용자", remainingTime: 300 },
  player2: { nickname: "상대방", remainingTime: 300 },
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "MOVE_MADE":
      const newBoard = state.board.map((row) => [...row])
      newBoard[action.payload.y][action.payload.x] = action.payload.stone
      return {
        ...state,
        board: newBoard,
        currentTurn: action.payload.nextTurn,
      }

    case "GAME_ENDED":
      return {
        ...state,
        gameStatus: "finished",
        winner: action.payload.winner,
      }

    case "AI_THINKING":
      return {
        ...state,
        isAiThinking: action.payload,
      }

    case "CONNECTION_STATUS":
      return {
        ...state,
        connectionStatus: action.payload,
      }

    case "SYNC_FROM_SERVER":
      return {
        ...state,
        ...action.payload,
      }

    case "UPDATE_TIMER":
      return {
        ...state,
        [action.payload.player]: {
          ...state[action.payload.player],
          remainingTime: action.payload.time,
        },
      }

    case "RESET_GAME":
      return initialState

    default:
      return state
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const makeMove = useCallback((x: number, y: number, stone: Stone, nextTurn: "black" | "white") => {
    dispatch({ type: "MOVE_MADE", payload: { x, y, stone, nextTurn } })
  }, [])

  const endGame = useCallback((winner: string) => {
    dispatch({ type: "GAME_ENDED", payload: { winner } })
  }, [])

  const setAiThinking = useCallback((thinking: boolean) => {
    dispatch({ type: "AI_THINKING", payload: thinking })
  }, [])

  const setConnectionStatus = useCallback((status: GameState["connectionStatus"]) => {
    dispatch({ type: "CONNECTION_STATUS", payload: status })
  }, [])

  const syncFromServer = useCallback((serverState: Partial<GameState>) => {
    dispatch({ type: "SYNC_FROM_SERVER", payload: serverState })
  }, [])

  const updateTimer = useCallback((player: "player1" | "player2", time: number) => {
    dispatch({ type: "UPDATE_TIMER", payload: { player, time } })
  }, [])

  const resetGame = useCallback(() => {
    dispatch({ type: "RESET_GAME" })
  }, [])

  return {
    state,
    actions: {
      makeMove,
      endGame,
      setAiThinking,
      setConnectionStatus,
      syncFromServer,
      updateTimer,
      resetGame,
    },
  }
}
