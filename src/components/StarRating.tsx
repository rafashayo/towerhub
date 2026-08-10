import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  count?: number
  size?: number
  interactive?: boolean
  onChange?: (stars: 1 | 2 | 3 | 4 | 5) => void
}

export function StarRating({ value, count, size = 15, interactive = false, onChange }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(n)}
            onClick={() => interactive && onChange?.(n as 1 | 2 | 3 | 4 | 5)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
            aria-label={`${n} stars`}
          >
            <Star
              size={size}
              className={n <= Math.round(display) ? 'fill-signal-400 text-signal-400' : 'fill-transparent text-ink-500'}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      {typeof count === 'number' && (
        <span className="font-mono text-xs text-mist-400">
          {value > 0 ? value.toFixed(1) : '—'} <span className="text-mist-400/70">({count})</span>
        </span>
      )}
    </div>
  )
}
