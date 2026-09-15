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
  'w-full rounded-[10px] border bg-surface px-3.5 py-2 text-sm text-ink',
  'placeholder:text-ink-muted/80',
  'transition-colors duration-150',
  'hover:border-line-strong',
  'focus:outline-none focus:border-plum',
  'disabled:bg-surface-muted disabled:text-ink-muted disabled:cursor-not-allowed',
].join(' ')

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputFieldProps>(
  ({ label, error, helperText, inputType = 'text', id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const borderClass = error ? 'border-danger' : 'border-line'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-ink-soft mb-1.5"
          >
            {label}
          </label>
        )}

        {inputType === 'textarea' ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            className={`${baseClasses} ${borderClass} min-h-[96px] resize-y ${className}`}
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
          <p id={`${inputId}-error`} className="mt-1.5 text-[12.5px] text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-[12.5px] text-ink-muted">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
