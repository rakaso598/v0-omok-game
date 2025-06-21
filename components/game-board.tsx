"use client"

import { cn } from "@/lib/utils"

type Stone = "black" | "white" | null

interface GameBoardProps {
  board: Stone[][]
  onCellClick: (x: number, y: number) => void
  disabled?: boolean
}

export default function GameBoard({ board, onCellClick, disabled = false }: GameBoardProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative">
        {/* 오목판 배경 */}
        <div
          className="bg-amber-100 border-4 border-amber-800 shadow-2xl"
          style={{
            width: "min(80vw, 600px)",
            height: "min(80vw, 600px)",
            aspectRatio: "1/1",
          }}
        >
          {/* 격자 선 */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
            {/* 세로선 */}
            {Array.from({ length: 15 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={40 + i * 37.33}
                y1={40}
                x2={40 + i * 37.33}
                y2={560}
                stroke="#8B4513"
                strokeWidth="1"
              />
            ))}
            {/* 가로선 */}
            {Array.from({ length: 15 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1={40}
                y1={40 + i * 37.33}
                x2={560}
                y2={40 + i * 37.33}
                stroke="#8B4513"
                strokeWidth="1"
              />
            ))}
            {/* 화점 (중앙점들) */}
            {[
              [3, 3],
              [3, 11],
              [11, 3],
              [11, 11],
              [7, 7],
            ].map(([x, y], index) => (
              <circle key={index} cx={40 + x * 37.33} cy={40 + y * 37.33} r="3" fill="#8B4513" />
            ))}
          </svg>

          {/* 클릭 가능한 교차점들 */}
          <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 gap-0">
            {board.map((row, y) =>
              row.map((cell, x) => (
                <button
                  key={`${x}-${y}`}
                  className={cn(
                    "relative flex items-center justify-center transition-all duration-200",
                    "hover:bg-black hover:bg-opacity-10 rounded-full",
                    disabled && "cursor-not-allowed",
                  )}
                  onClick={() => !disabled && onCellClick(x, y)}
                  disabled={disabled || cell !== null}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {cell && (
                    <div
                      className={cn(
                        "rounded-full shadow-lg border-2 animate-in zoom-in duration-300",
                        cell === "black" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300",
                      )}
                      style={{
                        width: "min(28px, 70%)",
                        height: "min(28px, 70%)",
                      }}
                    />
                  )}
                </button>
              )),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
