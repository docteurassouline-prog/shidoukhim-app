import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

export default function Card({
  children,
  header,
  footer,
  padding = 'md',
  className = '',
}: CardProps) {
  return (
    <div
      className={[
        'bg-surface rounded-[14px] border border-line shadow-card',
        className,
      ].join(' ')}
    >
      {header && (
        <div className="px-5 py-4 sm:px-6 border-b border-line">
          {header}
        </div>
      )}

      <div className={paddingClasses[padding]}>{children}</div>

      {footer && (
        <div className="px-5 py-4 sm:px-6 border-t border-line bg-surface-muted/60 rounded-b-[14px]">
          {footer}
        </div>
      )}
    </div>
  )
}
