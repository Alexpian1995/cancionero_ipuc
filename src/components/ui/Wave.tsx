export function Wave({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0,20 C150,40 350,0 600,20 C850,40 1050,0 1200,20 L1200,40 L0,40 Z"
        fill="#D9A544"
      />
    </svg>
  )
}