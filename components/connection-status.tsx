"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Loader2 } from "lucide-react"

interface ConnectionStatusProps {
  status: "connecting" | "connected" | "disconnected" | "error"
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "connecting":
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: "연결 중",
          className: "bg-yellow-600",
        }
      case "connected":
        return {
          icon: <Wifi className="h-3 w-3" />,
          text: "연결됨",
          className: "bg-green-600",
        }
      case "disconnected":
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: "연결 끊김",
          className: "bg-gray-600",
        }
      case "error":
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: "연결 오류",
          className: "bg-red-600",
        }
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: "알 수 없음",
          className: "bg-gray-600",
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Badge className={`${config.className} text-white flex items-center space-x-1`}>
      {config.icon}
      <span className="text-xs">{config.text}</span>
    </Badge>
  )
}
