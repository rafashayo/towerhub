import type { ModWithStats } from '../services/modService'
import { ModCard } from './ModCard'
import { SearchX } from 'lucide-react'

export function ModGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="aspect-[16/10] animate-pulse bg-ink-700" />
          <div className="space-y-2.5 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-ink-700" />
            <div className="h-3 w-full animate-pulse rounded bg-ink-700" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-ink-700" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink-600 py-20 text-center">
      <SearchX size={32} className="text-mist-400" />
      <p className="font-display text-lg text-mist-100">{title}</p>
      {hint && <p className="max-w-sm text-sm text-mist-400">{hint}</p>}
    </div>
  )
}

export function ModGrid({ mods }: { mods: ModWithStats[] }) {
  if (!mods.length) {
    return <EmptyState title="No mods found" hint="Try adjusting your search or the applied filters." />
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {mods.map((m) => (
        <ModCard key={m.id} mod={m} />
      ))}
    </div>
  )
}
