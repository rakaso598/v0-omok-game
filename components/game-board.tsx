"use client"

import { cn } from "@/lib/utils" // Tailwind CSS 유틸리티 함수

type Stone = "black" | "white" | null

interface GameBoardProps {
  board: Stone[][]
  onCellClick: (x: number, y: number) => void
  disabled?: boolean
}

export default function GameBoard({ board, onCellClick, disabled = false }: GameBoardProps) {
  const BOARD_SIZE = 15; // 오목판 크기 (15x15)

  // 격자선을 그리기 위한 배열 (14개 선)
  const gridLines = Array.from({ length: BOARD_SIZE -1 }, (_, i) => i);
  
  return (
    <div className="flex items-center justify-center p-4">
      <div
        className="relative bg-amber-100 border-4 border-amber-800 shadow-2xl"
        // Tailwind CSS의 `min()` 함수는 `min(80vw, 600px)`를 직접 지원하지 않을 수 있으므로
        // `max-w-[600px]`와 `w-[80vw]`를 함께 사용하여 반응형 크기 조절
        style={{
          width: "min(80vw, 600px)", // 이 부분은 Tailwind JIT에서 직접 지원하지 않을 수 있음
          height: "min(80vw, 600px)", // 대신 max-w/h 또는 responsive classes 사용 권장
          // 아래처럼 개선된 Tailwind 클래스 조합을 고려:
          // className="max-w-[600px] w-[80vw] aspect-square bg-amber-100 border-4 border-amber-800 shadow-2xl"
          aspectRatio: "1/1",
        }}
      >
        {/*
          새로운 접근 방식: CSS Grid를 이용하여 격자 선과 돌 위치를 통합 관리
          격자 간격을 균등하게 나누고, 각 셀에 선을 그리는 방식 (Border 이용)
          각 셀은 1x1 단위이므로, 15x15 오목판을 위해서는 16x16 그리드를 생성하여
          선이 교차하는 점(돌이 놓이는 위치)에 대한 영역을 정확히 잡을 수 있습니다.
          하지만 이 오목판은 선 위가 아닌, 선과 선 사이의 교차점에 돌이 놓이는 방식이므로
          15x15 그리드에 각 셀에 해당하는 버튼을 만들고, 그 버튼 위에 돌을 배치하는 방식이 더 직관적입니다.
          이때 선은 배경으로 깔리거나, 각 셀에 `border`를 사용하여 그려집니다.
        */}
        <div 
          className="absolute inset-0 grid"
          style={{
            // 15x15 격자 (14개 선으로 15개 공간 생성)
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
            // 각 셀의 중앙에 돌이 놓이도록 패딩 조정.
            // 격자 선이 그려지는 영역 (40px)과 각 칸의 비율에 맞춰 패딩 조정이 필요
            // 전체 600px에서 14개의 선이 균등하게 분포되려면, 각 셀의 크기가 중요.
            // (600 - 80(양쪽 여백)) / 14 = 37.14px (선 간 간격)
            // 각 셀의 중앙에 돌이 놓이게 하려면, 셀의 크기를 고려한 패딩이 필요합니다.
            // 여기서는 단순히 grid-cols-15로 나누어 각 셀이 한 점을 나타내도록 합니다.
            padding: `calc(100% / ${BOARD_SIZE} / 2)`, // 각 셀의 절반 크기만큼 패딩 (돌이 중앙에 오도록)
          }}
        >
          {/* 격자 선 (각 셀의 border를 사용하여 그리기) */}
          {Array.from({ length: BOARD_SIZE }, (_, y) => (
            Array.from({ length: BOARD_SIZE }, (_, x) => (
              <div
                key={`grid-cell-${x}-${y}`}
                className={cn(
                  "border-neutral-500 border-opacity-70",
                  // 가로선: 첫 행 제외하고 상단 border
                  y > 0 && "border-t", 
                  // 세로선: 첫 열 제외하고 좌측 border
                  x > 0 && "border-l",
                  // 중앙 화점 (선택적으로 배경에 점 그리기)
                  // [3,3], [3,11], [11,3], [11,11], [7,7] 위치에 점 추가
                  // (이전 SVG 방식의 화점을 CSS Grid에 맞게 매핑 필요)
                  // 여기서는 각 셀이 교차점을 나타내므로, 화점은 셀의 중앙에 직접 그릴 수 있습니다.
                )}
                style={{
                    // CSS Grid 내에서 각 셀에 대한 스타일 조정
                    // 각 셀이 정확한 비율을 가지도록 합니다.
                }}
              ></div>
            ))
          ))}
        </div>

        {/* 클릭 가능한 교차점 및 돌 */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
            // 선과 돌의 정렬을 위해 동일한 패딩을 적용해야 합니다.
            padding: `calc(100% / ${BOARD_SIZE} / 2)`, 
          }}
        >
          {board.map((row, y) =>
            row.map((cell, x) => (
              <button
                key={`${x}-${y}`}
                className={cn(
                  "relative flex items-center justify-center transition-all duration-200",
                  "hover:bg-black hover:bg-opacity-10 rounded-full",
                  disabled && "cursor-not-allowed",
                )}
                // disabled 조건 강화: 이미 돌이 놓여있으면 클릭 불가
                onClick={() => !disabled && cell === null && onCellClick(x, y)}
                disabled={disabled || cell !== null}
                style={{
                  // 버튼 자체의 크기는 부모 그리드 셀에 맞춰 100%
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
                      // 돌의 크기를 셀 크기에 맞춰 조정 (예: 셀 크기의 70~80%)
                      width: "80%", // min(28px, 70%) 대신 상대적인 비율로
                      height: "80%", // min(28px, 70%) 대신 상대적인 비율로
                    }}
                  />
                )}
              </button>
            )),
          )}
        </div>
        
        {/* 화점 (옵션): 그리드 위에 직접 그릴 수도 있습니다. */}
        {/* 이 부분은 각 셀의 중앙 좌표를 계산하여 절대 위치로 배치해야 합니다. */}
        {/* 각 셀의 크기를 계산: boardWidth / BOARD_SIZE (e.g., 600px / 15 = 40px) */}
        {/* 화점 위치 [3,3], [3,11], [11,3], [11,11], [7,7] */}
        {[
          [3, 3], [3, 11], [11, 3], [11, 11], [7, 7],
        ].map(([gx, gy], index) => (
          <div
            key={`dot-${index}`}
            className="absolute bg-amber-800 rounded-full"
            style={{
              // 각 셀의 중앙을 기준으로 화점 배치
              left: `calc(${(gx + 0.5) * (100 / BOARD_SIZE)}% - 3px)`, // 3px는 화점의 절반 크기
              top: `calc(${(gy + 0.5) * (100 / BOARD_SIZE)}% - 3px)`,
              width: '6px',
              height: '6px',
              zIndex: 10, // 돌보다 아래에, 선보다 위에 위치
            }}
          />
        ))}
      </div>
    </div>
  )
}