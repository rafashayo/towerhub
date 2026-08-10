import { Link } from 'react-router-dom'
import { Download, Heart } from 'lucide-react'
import type { ModWithStats } from '../services/modService'
import { StarRating } from './StarRating'
import { CATEGORY_ICON } from '../lib/categoryMeta'
import { timeAgo } from '../lib/utils'

export function ModCard({ mod }: { mod: ModWithStats }) {
  const Icon = CATEGORY_ICON[mod.category]

  return (
    <Link
      to={`/mods/${mod.slug}`}
      className="card group flex flex-col overflow-hidden transition-all hover:border-signal-700 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-ink-600 bg-ink-900">
        <img
          src={mod.screenshots[0]}
          alt={mod.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <span className="badge-signal absolute left-2.5 top-2.5 !bg-ink-950/80 backdrop-blur">
          <Icon size={11} />
          {mod.category}
        </span>
        {mod.status === 'pending' && (
          <span className="badge absolute right-2.5 top-2.5 border-amber-500/40 !bg-ink-950/85 text-amber-400">
            Pending
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-display text-[15px] font-semibold text-white group-hover:text-signal-300">
          {mod.title}
        </h3>
        <p className="line-clamp-2 flex-1 text-[13px] leading-relaxed text-mist-400">{mod.description}</p>

        <div className="mt-1 flex items-center justify-between text-xs text-mist-400">
          <span>
            by <span className="text-mist-200">{mod.authorName}</span>
          </span>
          <span className="font-mono">{timeAgo(mod.createdAt)}</span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-ink-700 pt-3">
          <StarRating value={mod.avgRating} count={mod.ratingCount} size={13} />
          <div className="flex items-center gap-3 font-mono text-xs text-mist-400">
            <span className="flex items-center gap-1">
              <Download size={13} /> {mod.downloadCount.toLocaleString('en-US')}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={13} /> {mod.favoriteCount.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
