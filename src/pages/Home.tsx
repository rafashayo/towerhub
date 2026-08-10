import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search, Radar, Download, Users2, PackageCheck } from 'lucide-react'
import { modService, type ModWithStats } from '../services/modService'
import { ModCard } from '../components/ModCard'
import { ModGridSkeleton } from '../components/ModGrid'
import { CATEGORY_ICON, CATEGORY_DESCRIPTION } from '../lib/categoryMeta'
import { MOD_CATEGORIES } from '../types'

function Section({
  title,
  subtitle,
  to,
  mods,
  loading,
}: {
  title: string
  subtitle: string
  to: string
  mods: ModWithStats[]
  loading: boolean
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="label-mono mb-1.5">{subtitle}</p>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <Link to={to} className="hidden items-center gap-1 text-sm font-medium text-signal-400 hover:text-signal-300 sm:flex">
          View all <ArrowRight size={15} />
        </Link>
      </div>
      {loading ? (
        <ModGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {mods.map((m) => (
            <ModCard key={m.id} mod={m} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [featured, setFeatured] = useState<ModWithStats[]>([])
  const [popular, setPopular] = useState<ModWithStats[]>([])
  const [recent, setRecent] = useState<ModWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ mods: 0, downloads: 0 })

  useEffect(() => {
    let alive = true
    Promise.all([
      modService.list({ sort: 'rating' }),
      modService.list({ sort: 'downloads' }),
      modService.list({ sort: 'recent' }),
    ]).then(([byRating, byDownloads, byRecent]) => {
      if (!alive) return
      setFeatured(byRating.slice(0, 4))
      setPopular(byDownloads.slice(0, 4))
      setRecent(byRecent.slice(0, 4))
      setTotals({
        mods: byRecent.length,
        downloads: byRecent.reduce((s, m) => s + m.downloadCount, 0),
      })
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(query.trim() ? `/explore?q=${encodeURIComponent(query.trim())}` : '/explore')
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-700 bg-grid bg-grid bg-ink-950">
        <div className="pointer-events-none absolute inset-0 bg-radar" />
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full border border-signal-800/40" />
        <div className="pointer-events-none absolute -top-10 right-[-2%] h-[260px] w-[260px] rounded-full border border-signal-800/30" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="badge-signal mb-6 w-fit">
            <Radar size={12} className="animate-blink" />
            Active Tower Simulator 3 community
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
            The mod hub for your <span className="text-signal-400">control tower</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-mist-300 sm:text-lg">
            Discover, upload, and share schedules, liveries, traffic, and airports made by
            the community. All in one place, ready for your next session.
          </p>

          <form onSubmit={submitSearch} className="relative mt-9 max-w-xl">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mist-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search “LEMD”, “Ryanair”, “schedules”…"
              className="input !py-3.5 !pl-11 !pr-28 !text-[15px] shadow-glow"
            />
            <button type="submit" className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 !py-2">
              Search
            </button>
          </form>

          <div className="mt-7 flex flex-wrap gap-2">
            {MOD_CATEGORIES.slice(0, 5).map((c) => {
              const Icon = CATEGORY_ICON[c]
              return (
                <Link key={c} to={`/explore?category=${c}`} className="badge hover:border-signal-700 hover:text-signal-300">
                  <Icon size={12} /> {c}
                </Link>
              )
            })}
          </div>

          <div className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-ink-700 pt-7">
            <div>
              <p className="font-display text-2xl font-bold text-white sm:text-3xl">{totals.mods || '—'}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-mist-400">
                <PackageCheck size={13} /> mods published
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-white sm:text-3xl">
                {totals.downloads ? totals.downloads.toLocaleString('en-US') : '—'}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-mist-400">
                <Download size={13} /> total downloads
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-white sm:text-3xl">8</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-mist-400">
                <Users2 size={13} /> active categories
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section title="Top rated" subtitle="Featured" to="/explore?sort=rating" mods={featured} loading={loading} />
      <Section title="Most downloaded" subtitle="Popularity" to="/explore?sort=downloads" mods={popular} loading={loading} />
      <Section title="Recently uploaded" subtitle="New" to="/explore?sort=recent" mods={recent} loading={loading} />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="card relative overflow-hidden bg-ink-900 p-8 sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-scan opacity-40" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-bold sm:text-2xl">Made a mod? Share it with the community.</h3>
              <p className="mt-2 max-w-lg text-sm text-mist-400">
                Simple uploads, clear categories, and real feedback from other virtual controllers.
              </p>
            </div>
            <Link to="/upload" className="btn-primary shrink-0">
              Upload my mod <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <p className="label-mono mb-5">Categories</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {MOD_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c]
            return (
              <Link
                key={c}
                to={`/explore?category=${c}`}
                className="card group flex flex-col gap-3 p-5 transition-all hover:border-signal-700 hover:shadow-glow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink-800 text-signal-400 group-hover:bg-signal-950">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-white">{c}</p>
                  <p className="mt-0.5 text-xs text-mist-400">{CATEGORY_DESCRIPTION[c]}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
