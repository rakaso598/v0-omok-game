"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CustomModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function CustomModal({ isOpen, onClose, title, children }: CustomModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
