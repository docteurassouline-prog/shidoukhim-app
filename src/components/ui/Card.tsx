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
  sm: 'p-3',
  md: 'p-4 sm:p-6',
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
        'bg-white rounded-xl border border-[#E8E0D4] shadow-sm',
        className,
      ].join(' ')}
    >
      {header && (
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#E8E0D4]">
          {header}
        </div>
      )}

      <div className={paddingClasses[padding]}>{children}</div>

      {footer && (
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-[#E8E0D4]">
          {footer}
        </div>
      )}
    </div>
  )
}
