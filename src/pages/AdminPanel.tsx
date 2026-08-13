import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  X,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Loader2,
  Package,
  PackageSearch,
  Flag,
  Users,
  MessageSquareWarning,
  History,
  MailCheck,
  Mail,
  KeyRound,
  Search,
  Download,
} from 'lucide-react'
import { modService, type ModWithStats } from '../services/modService'
import { commentService } from '../services/commentService'
import { adminService } from '../services/adminService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { CATEGORY_ICON } from '../lib/categoryMeta'
import { formatDate, timeAgo } from '../lib/utils'
import { Select, type SelectOption } from '../components/ui/Select'
import type { Comment, ModStatus, UserStatus } from '../types'
import type { AdminUser, LoginAttempt } from '../services/authService'

type Tab = 'all-mods' | 'pending' | 'reported-mods' | 'reported-comments' | 'users' | 'login-activity'

const TABS: { key: Tab; label: string; icon: typeof PackageSearch }[] = [
  { key: 'all-mods', label: 'All mods', icon: Package },
  { key: 'pending', label: 'Pending mods', icon: PackageSearch },
  { key: 'reported-mods', label: 'Reported mods', icon: Flag },
  { key: 'reported-comments', label: 'Reported comments', icon: MessageSquareWarning },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'login-activity', label: 'Login activity', icon: History },
]

const MOD_STATUS_LABEL: Record<ModStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
}
const MOD_STATUS_COLOR: Record<ModStatus, string> = {
  approved: 'text-signal-400 border-signal-700',
  pending: 'text-amber-400 border-amber-700/50',
  rejected: 'text-red-400 border-red-800/50',
}

const STATUS_FILTER_OPTIONS: SelectOption<ModStatus | 'all'>[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
]

const STATUS_LABEL: Record<UserStatus, string> = {
  active: 'Active',
  warned: 'Warned',
  banned: 'Suspended',
}
const STATUS_COLOR: Record<UserStatus, string> = {
  active: 'text-signal-400 border-signal-700',
  warned: 'text-amber-400 border-amber-700/50',
  banned: 'text-red-400 border-red-800/50',
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof Package
  label: string
  value: string | number
  tone?: 'default' | 'amber' | 'red'
}) {
  const toneClasses = {
    default: 'bg-signal-950 text-signal-400',
    amber: 'bg-amber-950/40 text-amber-400',
    red: 'bg-red-950/40 text-red-400',
  }[tone]

  return (
    <div className="card flex items-center gap-3.5 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneClasses}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="font-display text-xl font-bold leading-none text-white">{value}</p>
        <p className="mt-1 truncate text-xs text-mist-400">{label}</p>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const { user: me } = useAuth()
  const { push } = useToast()
  const [tab, setTab] = useState<Tab>('all-mods')

  const [allMods, setAllMods] = useState<ModWithStats[]>([])
  const [modsLoading, setModsLoading] = useState(true)
  const [modQuery, setModQuery] = useState('')
  const [modStatusFilter, setModStatusFilter] = useState<ModStatus | 'all'>('all')
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [attempts, setAttempts] = useState<LoginAttempt[]>([])
  const [attemptsLoading, setAttemptsLoading] = useState(true)

  const [busyId, setBusyId] = useState<string | null>(null)

  function loadMods() {
    setModsLoading(true)
    modService.list({ status: 'all', sort: 'recent' }).then((res) => {
      setAllMods(res)
      setModsLoading(false)
    })
  }
  function loadComments() {
    setCommentsLoading(true)
    commentService.listReported().then((res) => {
      setComments(res)
      setCommentsLoading(false)
    })
  }
  function loadUsers() {
    setUsersLoading(true)
    adminService.listUsers().then((res) => {
      setUsers(res)
      setUsersLoading(false)
    })
  }
  function loadAttempts() {
    setAttemptsLoading(true)
    adminService.listLoginAttempts(100).then((res) => {
      setAttempts(res)
      setAttemptsLoading(false)
    })
  }

  useEffect(() => {
    loadMods()
    loadComments()
    loadUsers()
    loadAttempts()
  }, [])

  const pending = allMods.filter((m) => m.status === 'pending')
  const reported = allMods.filter((m) => m.reported)
  const bannedUsers = users.filter((u) => u.status === 'banned')
  const totalDownloads = allMods.reduce((sum, m) => sum + m.downloadCount, 0)

  const filteredMods = useMemo(() => {
    const q = modQuery.trim().toLowerCase()
    return allMods.filter((m) => {
      if (modStatusFilter !== 'all' && m.status !== modStatusFilter) return false
      if (!q) return true
      return m.title.toLowerCase().includes(q) || m.authorName.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    })
  }, [allMods, modQuery, modStatusFilter])

  function actionError(err: unknown, fallback: string) {
    push(err instanceof Error ? err.message : fallback, 'error')
  }

  async function approve(modId: string) {
    setBusyId(modId)
    try {
      await modService.setStatus(modId, 'approved')
      push('Mod approved and published to the catalog.', 'success')
      loadMods()
    } catch (err) {
      actionError(err, 'Could not approve this mod.')
    } finally {
      setBusyId(null)
    }
  }
  async function reject(modId: string) {
    setBusyId(modId)
    try {
      await modService.setStatus(modId, 'rejected')
      push('Mod rejected.', 'info')
      loadMods()
    } catch (err) {
      actionError(err, 'Could not reject this mod.')
    } finally {
      setBusyId(null)
    }
  }
  async function dismissModReport(modId: string) {
    setBusyId(modId)
    try {
      await modService.setReported(modId, false)
      loadMods()
    } catch (err) {
      actionError(err, 'Could not dismiss this report.')
    } finally {
      setBusyId(null)
    }
  }
  async function removeMod(modId: string) {
    if (!confirm('Permanently delete this mod?')) return
    setBusyId(modId)
    try {
      await modService.remove(modId)
      push('Mod deleted.', 'success')
      loadMods()
    } catch (err) {
      actionError(err, 'Could not delete this mod.')
    } finally {
      setBusyId(null)
    }
  }

  async function removeComment(commentId: string) {
    setBusyId(commentId)
    try {
      await commentService.remove(commentId)
      push('Comment deleted.', 'success')
      loadComments()
    } catch (err) {
      actionError(err, 'Could not delete this comment.')
    } finally {
      setBusyId(null)
    }
  }
  async function dismissCommentReport(commentId: string) {
    setBusyId(commentId)
    try {
      await commentService.setReported(commentId, false)
      loadComments()
    } catch (err) {
      actionError(err, 'Could not dismiss this report.')
    } finally {
      setBusyId(null)
    }
  }

  async function setStatus(userId: string, status: UserStatus) {
    setBusyId(userId)
    try {
      await adminService.setUserStatus(userId, status)
      push('User status updated.', 'success')
      loadUsers()
    } catch (err) {
      actionError(err, 'Could not update the user.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-signal-950 text-signal-400">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="label-mono">Signed in as: {me?.username}</p>
          <h1 className="text-2xl font-bold">Admin dashboard</h1>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Package} label="Total mods" value={modsLoading ? '—' : allMods.length} />
        <StatCard icon={PackageSearch} label="Pending review" value={modsLoading ? '—' : pending.length} tone={pending.length ? 'amber' : 'default'} />
        <StatCard icon={Flag} label="Reported mods" value={modsLoading ? '—' : reported.length} tone={reported.length ? 'red' : 'default'} />
        <StatCard icon={Download} label="Total downloads" value={modsLoading ? '—' : totalDownloads.toLocaleString('en-US')} />
        <StatCard icon={Users} label="Total users" value={usersLoading ? '—' : users.length} />
        <StatCard icon={ShieldX} label="Suspended users" value={usersLoading ? '—' : bannedUsers.length} tone={bannedUsers.length ? 'red' : 'default'} />
      </div>

      <div className="mb-8 flex flex-wrap gap-1.5 rounded-xl border border-ink-700 bg-ink-900/60 p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon
          const count =
            t.key === 'all-mods'
              ? allMods.length
              : t.key === 'pending'
                ? pending.length
                : t.key === 'reported-mods'
                  ? reported.length
                  : t.key === 'reported-comments'
                    ? comments.length
                    : 0
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                active ? 'bg-ink-700 text-white shadow-panel ring-1 ring-inset ring-signal-800' : 'text-mist-400 hover:bg-ink-800 hover:text-mist-200'
              }`}
            >
              <Icon size={14} className={active ? 'text-signal-400' : ''} />
              {t.label}
              {count > 0 && <span className="badge-signal !py-0.5">{count}</span>}
            </button>
          )
        })}
      </div>

      {tab === 'all-mods' && (
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-400" />
              <input
                value={modQuery}
                onChange={(e) => setModQuery(e.target.value)}
                placeholder="Search by title, author, or category…"
                className="input pl-9"
              />
            </div>
            <Select value={modStatusFilter} onChange={setModStatusFilter} options={STATUS_FILTER_OPTIONS} className="w-full sm:w-48" />
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-ink-600 bg-ink-800/60 text-left text-xs uppercase tracking-wide text-mist-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Mod</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Author</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Downloads</th>
                    <th className="px-4 py-3 font-medium">Rating</th>
                    <th className="px-4 py-3 font-medium">Uploaded</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700">
                  {modsLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <Loader2 className="mx-auto animate-spin text-signal-500" size={20} />
                      </td>
                    </tr>
                  ) : filteredMods.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-mist-400">
                        {allMods.length === 0 ? 'No mods in the catalog yet.' : 'No mods match your search/filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMods.map((m) => {
                      const Icon = CATEGORY_ICON[m.category]
                      return (
                        <tr key={m.id} className="transition-colors hover:bg-ink-800/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <img src={m.screenshots[0]} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
                              <Link to={`/mods/${m.slug}`} className="line-clamp-1 font-medium text-mist-100 hover:text-signal-400">
                                {m.title}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge">
                              <Icon size={11} /> {m.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-mist-300">
                            <Link to={`/users/${m.authorName}`} className="hover:text-signal-400">
                              {m.authorName}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${MOD_STATUS_COLOR[m.status]}`}>{MOD_STATUS_LABEL[m.status]}</span>
                            {m.reported && (
                              <span className="badge ml-1.5 border-amber-600/40 text-amber-400">
                                <Flag size={10} />
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-mist-400">{m.downloadCount.toLocaleString('en-US')}</td>
                          <td className="px-4 py-3 font-mono text-xs text-mist-400">
                            {m.avgRating > 0 ? `${m.avgRating.toFixed(1)} (${m.ratingCount})` : '—'}
                          </td>
                          <td className="px-4 py-3 text-mist-400">{formatDate(m.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              {m.status === 'pending' && (
                                <button
                                  disabled={busyId === m.id}
                                  onClick={() => approve(m.id)}
                                  className="flex items-center gap-1 rounded-md border border-signal-700/50 px-2 py-1 text-xs text-signal-400 hover:bg-signal-950/40"
                                >
                                  <Check size={12} /> Approve
                                </button>
                              )}
                              <button
                                disabled={busyId === m.id}
                                onClick={() => removeMod(m.id)}
                                className="flex items-center gap-1 rounded-md border border-red-800/40 px-2 py-1 text-xs text-red-400 hover:bg-red-950/30"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-3">
          {modsLoading ? (
            <Loader2 className="animate-spin text-signal-500" size={22} />
          ) : pending.length === 0 ? (
            <p className="py-12 text-center text-sm text-mist-400">No mods pending review.</p>
          ) : (
            pending.map((m) => {
              const Icon = CATEGORY_ICON[m.category]
              return (
                <div key={m.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <img src={m.screenshots[0]} alt="" className="h-20 w-32 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="badge">
                        <Icon size={11} /> {m.category}
                      </span>
                      <span className="font-mono text-xs text-mist-400">{timeAgo(m.createdAt)}</span>
                    </div>
                    <Link to={`/mods/${m.slug}`} className="mt-1 block font-semibold text-mist-100 hover:text-signal-400">
                      {m.title}
                    </Link>
                    <p className="text-xs text-mist-400">
                      by <Link to={`/users/${m.authorName}`} className="hover:text-signal-400">{m.authorName}</Link> · v{m.version}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button disabled={busyId === m.id} onClick={() => approve(m.id)} className="btn-primary !px-3">
                      {busyId === m.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                      Approve
                    </button>
                    <button disabled={busyId === m.id} onClick={() => reject(m.id)} className="btn-danger !px-3">
                      {busyId === m.id ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                      Reject
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'reported-mods' && (
        <div className="space-y-3">
          {modsLoading ? (
            <Loader2 className="animate-spin text-signal-500" size={22} />
          ) : reported.length === 0 ? (
            <p className="py-12 text-center text-sm text-mist-400">No reported mods.</p>
          ) : (
            reported.map((m) => (
              <div key={m.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <img src={m.screenshots[0]} alt="" className="h-20 w-32 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <span className="badge border-amber-600/40 text-amber-400">
                    <ShieldAlert size={11} /> Reported
                  </span>
                  <Link to={`/mods/${m.slug}`} className="mt-1 block font-semibold text-mist-100 hover:text-signal-400">
                    {m.title}
                  </Link>
                  <p className="text-xs text-mist-400">
                    by <Link to={`/users/${m.authorName}`} className="hover:text-signal-400">{m.authorName}</Link>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button disabled={busyId === m.id} onClick={() => dismissModReport(m.id)} className="btn-secondary !px-3">
                    Dismiss report
                  </button>
                  <button disabled={busyId === m.id} onClick={() => removeMod(m.id)} className="btn-danger !px-3">
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'reported-comments' && (
        <div className="space-y-3">
          {commentsLoading ? (
            <Loader2 className="animate-spin text-signal-500" size={22} />
          ) : comments.length === 0 ? (
            <p className="py-12 text-center text-sm text-mist-400">No reported comments.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <img src={c.userAvatar} alt="" className="h-9 w-9 shrink-0 rounded-sm" />
                  <div>
                    <p className="text-sm font-semibold text-mist-100">{c.userName}</p>
                    <p className="mt-0.5 text-sm text-mist-300">{c.text}</p>
                    <p className="mt-1 font-mono text-xs text-mist-400">{timeAgo(c.createdAt)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button disabled={busyId === c.id} onClick={() => dismissCommentReport(c.id)} className="btn-secondary !px-3">
                    Dismiss
                  </button>
                  <button disabled={busyId === c.id} onClick={() => removeComment(c.id)} className="btn-danger !px-3">
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-600 bg-ink-800/60 text-left text-xs uppercase tracking-wide text-mist-400">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">2FA</th>
                  <th className="px-4 py-3 font-medium">Since</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700">
                {usersLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <Loader2 className="mx-auto animate-spin text-signal-500" size={20} />
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-ink-800/40">
                      <td className="px-4 py-3">
                        <Link to={`/users/${u.username}`} className="flex items-center gap-2.5 hover:text-signal-400">
                          <img src={u.avatarUrl} alt="" className="h-7 w-7 rounded-sm" />
                          {u.username}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-mist-300">{u.role === 'admin' ? 'Administrator' : 'User'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_COLOR[u.status]}`}>{STATUS_LABEL[u.status]}</span>
                      </td>
                      <td className="px-4 py-3">
                        {u.emailVerified ? (
                          <MailCheck size={15} className="text-signal-400" />
                        ) : (
                          <Mail size={15} className="text-mist-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.twoFactorEnabled ? (
                          <KeyRound size={15} className="text-signal-400" />
                        ) : (
                          <span className="text-mist-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-mist-400">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        {u.role === 'admin' ? (
                          <span className="text-xs text-mist-400">—</span>
                        ) : (
                          <div className="flex gap-1.5">
                            {u.status !== 'warned' && (
                              <button
                                disabled={busyId === u.id}
                                onClick={() => setStatus(u.id, 'warned')}
                                className="rounded-md border border-amber-700/40 px-2 py-1 text-xs text-amber-400 hover:bg-amber-950/30"
                              >
                                Warn
                              </button>
                            )}
                            {u.status !== 'banned' ? (
                              <button
                                disabled={busyId === u.id}
                                onClick={() => setStatus(u.id, 'banned')}
                                className="flex items-center gap-1 rounded-md border border-red-800/40 px-2 py-1 text-xs text-red-400 hover:bg-red-950/30"
                              >
                                <ShieldX size={12} /> Suspend
                              </button>
                            ) : (
                              <button
                                disabled={busyId === u.id}
                                onClick={() => setStatus(u.id, 'active')}
                                className="flex items-center gap-1 rounded-md border border-signal-700/50 px-2 py-1 text-xs text-signal-400 hover:bg-signal-950/40"
                              >
                                <ShieldCheck size={12} /> Reactivate
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'login-activity' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-600 bg-ink-800/60 text-left text-xs uppercase tracking-wide text-mist-400">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700">
                {attemptsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <Loader2 className="mx-auto animate-spin text-signal-500" size={20} />
                    </td>
                  </tr>
                ) : attempts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-mist-400">
                      No login activity yet.
                    </td>
                  </tr>
                ) : (
                  attempts.map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-ink-800/40">
                      <td className="px-4 py-3 font-mono text-xs text-mist-400">{timeAgo(a.createdAt)}</td>
                      <td className="px-4 py-3 text-mist-200">{a.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${a.success ? 'border-signal-700 text-signal-400' : 'border-red-800/50 text-red-400'}`}>
                          {a.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-mist-400">{a.reason ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-mist-400">{a.ip ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
