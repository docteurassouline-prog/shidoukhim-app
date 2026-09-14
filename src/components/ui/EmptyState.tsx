import type { ReactNode } from 'react'
import Button from './Button'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className,
      ].join(' ')}
    >
      {icon && (
        <div className="mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-[#87A878]/10 text-[#87A878]">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-[#2D2D2D] mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-[#6B7280] max-w-sm mb-6">{description}</p>
      )}

      {action}

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
