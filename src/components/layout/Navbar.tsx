import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Search,
  Menu,
  X,
  UploadCloud,
  UserCircle2,
  LayoutDashboard,
  LogOut,
  Heart,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { RadarMark } from '../RadarMark'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(query.trim() ? `/explore?q=${encodeURIComponent(query.trim())}` : '/explore')
    setMobileOpen(false)
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-signal-400' : 'text-mist-300 hover:text-white'}`

  return (
    <header className="sticky top-0 z-50 border-b border-ink-700 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <RadarMark size={30} />
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Tower<span className="text-signal-400">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/explore" className={navLinkClass}>
            Explore
          </NavLink>
        </nav>

        <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-md flex-1 md:block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mods, categories, authors…"
            className="input !py-2 pl-9"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {user ? (
            <>
              <Link to="/upload" className="btn-primary hidden sm:inline-flex">
                <UploadCloud size={16} />
                Upload mod
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-800 py-1 pl-1 pr-2.5 hover:border-signal-700"
                >
                  <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-sm" />
                  <span className="hidden text-sm font-medium text-mist-100 lg:inline">{user.username}</span>
                  <ChevronDown size={14} className="text-mist-400" />
                </button>
                {menuOpen && (
                  <div className="card absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden p-1.5">
                    <div className="border-b border-ink-600 px-2.5 py-2 sm:hidden">
                      <Link
                        to="/upload"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-mist-100 hover:bg-ink-700"
                      >
                        <UploadCloud size={15} /> Upload mod
                      </Link>
                    </div>
                    <Link
                      to={`/users/${user.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-mist-100 hover:bg-ink-700"
                    >
                      <UserCircle2 size={15} /> My profile
                    </Link>
                    <Link
                      to={`/users/${user.username}?tab=favorites`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-mist-100 hover:bg-ink-700"
                    >
                      <Heart size={15} /> Favorites
                    </Link>
                    <Link
                      to={`/users/${user.username}?tab=security`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-mist-100 hover:bg-ink-700"
                    >
                      <Settings size={15} /> Security
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-signal-400 hover:bg-ink-700"
                      >
                        <LayoutDashboard size={15} /> Admin panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        logout()
                        navigate('/')
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-red-300 hover:bg-red-950/40"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Create account
              </Link>
            </>
          )}
          <button className="text-mist-200 md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink-700 bg-ink-900 px-4 py-4 md:hidden">
          <form onSubmit={submitSearch} className="relative mb-4">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search mods…"
              className="input pl-9"
            />
          </form>
          <div className="flex flex-col gap-3">
            <NavLink to="/" end onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/explore" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Explore
            </NavLink>
            {user && (
              <Link to="/upload" onClick={() => setMobileOpen(false)} className="btn-primary w-fit sm:hidden">
                <UploadCloud size={16} /> Upload mod
              </Link>
            )}
            {!user && (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm text-mist-300 sm:hidden">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
