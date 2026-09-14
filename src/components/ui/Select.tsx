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
    const borderClass = error ? 'border-[#C45B5B]' : 'border-[#E8E0D4]'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[#2D2D2D] mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={[
              'w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-[#2D2D2D]',
              'appearance-none',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[#87A878] focus:border-[#87A878]',
              'disabled:bg-gray-50 disabled:text-[#6B7280] disabled:cursor-not-allowed',
              borderClass,
              'h-10',
              className,
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
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280] pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-[#C45B5B]" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
