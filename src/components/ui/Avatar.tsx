'use client'

import { useState } from 'react'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string | null
  name: string
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Deterministic color from name
function getColorFromName(name: string): string {
  const colors = [
    'bg-sage',
    'bg-plum',
    'bg-gold',
    'bg-[#6F8296]',
    'bg-[#A5735A]',
    'bg-[#7F6A93]',
    'bg-[#5B8585]',
    'bg-[#8E5E63]',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(name)
  const bgColor = getColorFromName(name)

  const showImage = src && !imgError

  return (
    <div
      className={[
        'relative rounded-full overflow-hidden shrink-0 flex items-center justify-center font-medium text-white ring-2 ring-white shadow-card',
        sizeClasses[size],
        showImage ? '' : bgColor,
        className,
      ].join(' ')}
      aria-label={name}
      role="img"
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  )
}
