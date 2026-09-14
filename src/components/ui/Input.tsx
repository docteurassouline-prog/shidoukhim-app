'use client'

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type InputType = 'text' | 'email' | 'password' | 'tel' | 'date' | 'number' | 'textarea'

interface BaseInputProps {
  label?: string
  error?: string
  helperText?: string
  inputType?: InputType
}

type InputFieldProps = BaseInputProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'type'>

const baseClasses = [
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#2D2D2D]',
  'placeholder:text-[#6B7280]/60',
  'transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-[#87A878] focus:border-[#87A878]',
  'disabled:bg-gray-50 disabled:text-[#6B7280] disabled:cursor-not-allowed',
].join(' ')

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputFieldProps>(
  ({ label, error, helperText, inputType = 'text', id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const borderClass = error ? 'border-[#C45B5B]' : 'border-[#E8E0D4]'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#2D2D2D] mb-1.5"
          >
            {label}
          </label>
        )}

        {inputType === 'textarea' ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            className={`${baseClasses} ${borderClass} min-h-[80px] resize-y ${className}`}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={inputId}
            type={inputType}
            className={`${baseClasses} ${borderClass} h-10 ${className}`}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...(props as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-[#C45B5B]" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-[#6B7280]">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
