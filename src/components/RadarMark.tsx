export function RadarMark({ size = 32, animated = true }: { size?: number; animated?: boolean }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-md bg-ink-900 ring-1 ring-inset ring-signal-800"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" className="text-signal-700" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" className="text-signal-600" strokeWidth="1.2" />
        <g className={animated ? 'origin-center animate-sweep' : ''} style={{ transformOrigin: '12px 12px' }}>
          <path d="M12 12 L12 3.5" stroke="currentColor" className="text-signal-400" strokeWidth="1.4" strokeLinecap="round" />
        </g>
        <circle cx="12" cy="12" r="1.6" className="fill-signal-400" />
      </svg>
    </div>
  )
}
