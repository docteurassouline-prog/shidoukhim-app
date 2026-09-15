'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className = '', ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const borderClass = error ? 'border-danger' : 'border-line'

    // Les classes de largeur (w-*, sm:w-*) pilotent le conteneur ; le select reste pleine largeur.
    const widthClasses = className
      .split(/\s+/)
      .filter((c) => /^(sm:|md:|lg:)?(w-|min-w-|max-w-)/.test(c))
      .join(' ')
    const innerClasses = className
      .split(/\s+/)
      .filter((c) => c && !/^(sm:|md:|lg:)?(w-|min-w-|max-w-)/.test(c))
      .join(' ')

    return (
      <div className={widthClasses || 'w-full'}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[13px] font-medium text-ink-soft mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={[
              'w-full rounded-[10px] border bg-surface px-3.5 py-2 pr-10 text-sm text-ink',
              'appearance-none',
              'transition-colors duration-150 hover:border-line-strong',
              'focus:outline-none focus:border-plum',
              'disabled:bg-surface-muted disabled:text-ink-muted disabled:cursor-not-allowed',
              borderClass,
              'h-10',
              innerClasses,
            ].join(' ')}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-[12.5px] text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
