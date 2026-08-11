type IconProps = { className?: string }

export function IconLluvia({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2c-3 4-6 7.5-6 11a6 6 0 0012 0c0-3.5-3-7-6-11z" fill="currentColor" opacity="0.15" />
      <path d="M12 2c-3 4-6 7.5-6 11a6 6 0 0012 0c0-3.5-3-7-6-11z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function IconManantial({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 17c2-1 4-1 6 0s4 1 6 0s4-1 6 0" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12c2-1 4-1 6 0s4 1 6 0s4-1 6 0" stroke="currentColor" strokeWidth="1.8" opacity="0.5" />
      <circle cx="12" cy="6" r="2.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function IconCoros({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 18V5l10-2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.15" />
      <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

export function IconRapido({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 2 3 14h6l-2 8 10-12h-6l2-8z" />
    </svg>
  )
}

export function IconMedio({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M2 12h4l2-6 4 12 3-9 2 3h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconLento({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3a9 9 0 109 9 7 7 0 01-9-9z" />
    </svg>
  )
}