import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import {
  Search,
  Menu as MenuIcon,
  X,
  UploadCloud,
  UserCircle2,
  LayoutDashboard,
  LogOut,
  Heart,
  Settings,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { RadarMark } from '../RadarMark'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(query.trim() ? `/explore?q=${encodeURIComponent(query.trim())}` : '/explore')
    setMobileOpen(false)
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-signal-400' : 'text-mist-300 hover:text-white'}`

  const itemClass = ({ focus }: { focus: boolean }) =>
    `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
      focus ? 'bg-ink-700 text-white' : 'text-mist-100'
    }`

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

              <Menu as="div" className="relative">
                <MenuButton
                  className="group flex items-center gap-2 rounded-md border border-ink-600 bg-ink-800 py-1 pl-1 pr-2.5 transition-colors
                    hover:border-signal-700 data-[open]:border-signal-600 data-[open]:bg-ink-750"
                >
                  <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-sm ring-1 ring-inset ring-white/10" />
                  <span className="hidden text-sm font-medium text-mist-100 lg:inline">{user.username}</span>
                  <ChevronDown
                    size={14}
                    className="text-mist-400 transition-transform duration-150 group-data-[open]:rotate-180 group-data-[open]:text-signal-400"
                  />
                </MenuButton>

                <MenuItems
                  transition
                  anchor="bottom end"
                  className="z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-ink-600
                    bg-ink-850/97 shadow-glow-lg backdrop-blur-md transition duration-150 ease-out
                    focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[leave]:duration-100"
                >
                  <div className="flex items-center gap-3 border-b border-ink-600 bg-ink-900/60 px-3.5 py-3">
                    <img src={user.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-md ring-1 ring-inset ring-white/10" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{user.username}</p>
                      <p className="truncate text-xs text-mist-400">{user.email}</p>
                    </div>
                    {user.role === 'admin' && (
                      <span className="badge-signal ml-auto shrink-0 !py-0.5">
                        <ShieldCheck size={10} /> Staff
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 p-1.5">
                    <MenuItem as={Link} to="/upload" className={({ focus }) => `${itemClass({ focus })} sm:hidden`}>
                      <UploadCloud size={15} /> Upload mod
                    </MenuItem>
                    <MenuItem as={Link} to={`/users/${user.username}`} className={itemClass}>
                      <UserCircle2 size={15} /> My profile
                    </MenuItem>
                    <MenuItem as={Link} to={`/users/${user.username}?tab=favorites`} className={itemClass}>
                      <Heart size={15} /> Favorites
                    </MenuItem>
                    <MenuItem as={Link} to={`/users/${user.username}?tab=security`} className={itemClass}>
                      <Settings size={15} /> Security
                    </MenuItem>
                    {user.role === 'admin' && (
                      <MenuItem as={Link} to="/admin" className={({ focus }) => `${itemClass({ focus })} !text-signal-400`}>
                        <LayoutDashboard size={15} /> Admin dashboard
                      </MenuItem>
                    )}
                  </div>

                  <div className="border-t border-ink-600 p-1.5">
                    <MenuItem
                      as="button"
                      onClick={handleLogout}
                      className={({ focus }: { focus: boolean }) =>
                        `flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                          focus ? 'bg-red-950/50 text-red-300' : 'text-red-400'
                        }`
                      }
                    >
                      <LogOut size={15} /> Sign out
                    </MenuItem>
                  </div>
                </MenuItems>
              </Menu>
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
            {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
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
