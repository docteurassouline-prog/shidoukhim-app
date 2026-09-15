'use client'

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
  autoFocus?: boolean
}

export default function SearchInput({
  value: controlledValue,
  onChange,
  placeholder = 'Rechercher...',
  debounceMs = 300,
  className = '',
  autoFocus = false,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(controlledValue ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue)
    }
  }, [controlledValue])

  const debouncedOnChange = useCallback(
    (val: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        onChange(val)
      }, debounceMs)
    },
    [onChange, debounceMs]
  )

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setLocalValue(val)
    debouncedOnChange(val)
  }

  function handleClear() {
    setLocalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={[
          'w-full rounded-[10px] border border-line bg-surface pl-10 pr-9 py-2 text-sm text-ink',
          'placeholder:text-ink-muted/80',
          'transition-colors duration-150 hover:border-line-strong',
          'focus:outline-none focus:border-plum',
          'h-10',
        ].join(' ')}
        aria-label={placeholder}
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-muted hover:text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-plum/40"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
