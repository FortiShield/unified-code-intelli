import { cn } from '@/lib/utils'
import type { AgentStatus } from '@/lib/types'

interface AgentStatusIndicatorProps {
  status: AgentStatus
  size?: 'sm' | 'md' | 'lg'
}

export function AgentStatusIndicator({ status, size = 'md' }: AgentStatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const statusConfig = {
    idle: {
      color: 'bg-muted-foreground',
      animation: ''
    },
    processing: {
      color: 'bg-accent',
      animation: 'animate-pulse-glow'
    },
    active: {
      color: 'bg-success',
      animation: 'glow-border-accent'
    },
    error: {
      color: 'bg-destructive',
      animation: 'animate-pulse'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={cn(
      'rounded-full',
      sizeClasses[size],
      config.color,
      config.animation
    )} />
  )
}