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
        'flex flex-col items-center justify-center text-center py-14 px-4',
        className,
      ].join(' ')}
    >
      {icon && (
        <div className="mb-4 flex items-center justify-center h-14 w-14 rounded-full bg-plum-light text-plum ring-8 ring-plum-light/40">
          {icon}
        </div>
      )}

      <h3 className="font-display text-[21px] font-semibold text-ink mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-ink-soft max-w-sm mb-6">{description}</p>
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
