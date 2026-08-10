import { Link } from 'react-router-dom'
import { RadarMark } from '../RadarMark'
import { MOD_CATEGORIES } from '../../types'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-700 bg-ink-900/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <RadarMark size={28} animated={false} />
              <span className="font-display text-base font-bold text-white">
                Tower<span className="text-signal-400">Hub</span>
              </span>
            </Link>
            <p className="mt-3 max-w-[26ch] text-sm text-mist-400">
              The mod hub for the Tower Simulator 3 community.
            </p>
          </div>

          <div>
            <p className="label-mono mb-3">Categories</p>
            <ul className="space-y-2">
              {MOD_CATEGORIES.slice(0, 4).map((c) => (
                <li key={c}>
                  <Link to={`/explore?category=${c}`} className="text-sm text-mist-400 hover:text-signal-400">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-mono mb-3 opacity-0 sm:opacity-100">.</p>
            <ul className="space-y-2">
              {MOD_CATEGORIES.slice(4).map((c) => (
                <li key={c}>
                  <Link to={`/explore?category=${c}`} className="text-sm text-mist-400 hover:text-signal-400">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-mono mb-3">Community</p>
            <ul className="space-y-2">
              <li>
                <Link to="/explore" className="text-sm text-mist-400 hover:text-signal-400">
                  Explore mods
                </Link>
              </li>
              <li>
                <Link to="/upload" className="text-sm text-mist-400 hover:text-signal-400">
                  Upload a mod
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-mist-400 hover:text-signal-400">
                  Create account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-ink-700 pt-6 text-xs text-mist-400/70 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} TowerHub. Community project, not officially affiliated with Tower Simulator 3.</p>
          <p className="font-mono">DEMO · locally simulated data</p>
        </div>
      </div>
    </footer>
  )
}
