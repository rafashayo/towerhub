import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { modService, type ModWithStats } from '../services/modService'
import { ModGrid, ModGridSkeleton } from '../components/ModGrid'
import { CATEGORY_ICON } from '../lib/categoryMeta'
import { MOD_CATEGORIES, type ModCategory, type SortOption } from '../types'

const SORT_LABEL: Record<SortOption, string> = {
  popular: 'Most popular',
  recent: 'Most recent',
  rating: 'Top rated',
  downloads: 'Most downloaded',
}

const PAGE_SIZE = 12

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const [mods, setMods] = useState<ModWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [minRating, setMinRating] = useState(0)

  const query = params.get('q') ?? ''
  const category = (params.get('category') as ModCategory | null) ?? 'all'
  const sort = (params.get('sort') as SortOption | null) ?? 'popular'

  useEffect(() => {
    setLoading(true)
    modService.list({ query, category, sort }).then((res) => {
      setMods(res)
      setLoading(false)
      setVisible(PAGE_SIZE)
    })
  }, [query, category, sort])

  const filtered = useMemo(() => mods.filter((m) => m.avgRating >= minRating), [mods, minRating])
  const shown = filtered.slice(0, visible)

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    })
    setParams(next, { replace: true })
  }

  const activeFilterCount = (category !== 'all' ? 1 : 0) + (minRating > 0 ? 1 : 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="label-mono mb-1.5">Catalog</p>
        <h1 className="text-3xl font-bold">Explore mods</h1>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-400" />
          <input
            value={query}
            onChange={(e) => update({ q: e.target.value || null })}
            placeholder="Search by name, category, or author…"
            className="input pl-9"
          />
        </div>
        <select value={sort} onChange={(e) => update({ sort: e.target.value })} className="select w-full sm:w-56">
          {Object.entries(SORT_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button onClick={() => setFiltersOpen((v) => !v)} className="btn-secondary sm:hidden">
          <SlidersHorizontal size={15} />
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="card sticky top-20 space-y-6 p-5">
            <div className="flex items-center justify-between">
              <p className="label-mono">Filters</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    update({ category: null })
                    setMinRating(0)
                  }}
                  className="flex items-center gap-1 text-xs text-mist-400 hover:text-red-300"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-mist-300">Category</p>
              <div className="space-y-1">
                <button
                  onClick={() => update({ category: null })}
                  className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                    category === 'all' ? 'bg-signal-950 text-signal-300' : 'text-mist-300 hover:bg-ink-700'
                  }`}
                >
                  All
                </button>
                {MOD_CATEGORIES.map((c) => {
                  const Icon = CATEGORY_ICON[c]
                  const active = category === c
                  return (
                    <button
                      key={c}
                      onClick={() => update({ category: c })}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                        active ? 'bg-signal-950 text-signal-300' : 'text-mist-300 hover:bg-ink-700'
                      }`}
                    >
                      <Icon size={14} /> {c}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-mist-300">Minimum rating</p>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMinRating(n)}
                    className={`flex-1 rounded-md border py-1.5 text-xs font-mono transition-colors ${
                      minRating === n
                        ? 'border-signal-600 bg-signal-950 text-signal-300'
                        : 'border-ink-600 text-mist-400 hover:border-ink-500'
                    }`}
                  >
                    {n === 0 ? 'All' : `${n}+`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-mist-400">
              {loading ? 'Searching…' : `${filtered.length} mod${filtered.length === 1 ? '' : 's'} found`}
            </p>
          </div>

          {loading ? (
            <ModGridSkeleton />
          ) : (
            <>
              <ModGrid mods={shown} />
              {visible < filtered.length && (
                <div className="mt-8 flex justify-center">
                  <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-secondary">
                    Load more mods
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
