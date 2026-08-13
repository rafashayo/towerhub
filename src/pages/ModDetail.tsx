import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Download,
  Heart,
  Flag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  History,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react'
import { modService, type ModWithStats } from '../services/modService'
import { commentService } from '../services/commentService'
import { ratingService } from '../services/ratingService'
import { downloadHistoryService } from '../services/downloadHistoryService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { StarRating } from '../components/StarRating'
import { CommentThread } from '../components/CommentThread'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CATEGORY_ICON } from '../lib/categoryMeta'
import { formatBytes, formatDate, timeAgo } from '../lib/utils'
import type { Comment } from '../types'

export default function ModDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user, toggleFavorite } = useAuth()
  const { push } = useToast()

  const [mod, setMod] = useState<ModWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [activeShot, setActiveShot] = useState(0)
  const [myRating, setMyRating] = useState<number>(0)
  const [downloading, setDownloading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [lastDownloadedAt, setLastDownloadedAt] = useState<string | null>(null)
  const [confirmRedownload, setConfirmRedownload] = useState(false)

  const load = useCallback(async () => {
    if (!slug) return
    const m = await modService.getBySlug(slug)
    if (!m) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setMod(m)
    setActiveShot(0)
    setLastDownloadedAt(downloadHistoryService.lastDownloadedAt(user?.id ?? 'guest', m.id))
    const [cs, myR] = await Promise.all([
      commentService.listForMod(m.id),
      user ? ratingService.getUserRating(m.id, user.id) : Promise.resolve(null),
    ])
    setComments(cs)
    setMyRating(myR?.stars ?? 0)
    setLoading(false)
  }, [slug, user])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-signal-500" size={28} />
      </div>
    )
  }

  const canSeeUnapproved = mod && user && (user.id === mod.authorId || user.role === 'admin')

  if (notFound || !mod || (mod.status !== 'approved' && !canSeeUnapproved)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Mod not found</h1>
        <p className="mt-2 text-mist-400">It may have been removed, is still under review, or the link is incorrect.</p>
        <Link to="/explore" className="btn-primary mt-6 inline-flex">
          Back to catalog
        </Link>
      </div>
    )
  }

  const Icon = CATEGORY_ICON[mod.category]
  const isFavorite = user?.favoriteModIds.includes(mod.id) ?? false
  const isOwner = user?.id === mod.authorId

  async function performDownload() {
    if (!mod) return
    setDownloading(true)
    try {
      const { url, filename } = await modService.registerDownload(mod.id)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setMod((m) => (m ? { ...m, downloadCount: m.downloadCount + 1 } : m))
      const userId = user?.id ?? 'guest'
      downloadHistoryService.markDownloaded(userId, mod.id)
      setLastDownloadedAt(downloadHistoryService.lastDownloadedAt(userId, mod.id))
      push('Download started.', 'success')
    } catch {
      push('Could not start the download.', 'error')
    } finally {
      setDownloading(false)
    }
  }

  function handleDownload() {
    if (lastDownloadedAt) {
      setConfirmRedownload(true)
      return
    }
    performDownload()
  }

  async function handleFavorite() {
    if (!user) {
      navigate('/login')
      return
    }
    await toggleFavorite(mod!.id)
    setMod((m) =>
      m ? { ...m, favoriteCount: m.favoriteCount + (isFavorite ? -1 : 1) } : m
    )
  }

  async function handleRate(stars: 1 | 2 | 3 | 4 | 5) {
    if (!user) {
      navigate('/login')
      return
    }
    await ratingService.rate(mod!.id, user.id, stars)
    setMyRating(stars)
    const refreshed = await modService.getById(mod!.id)
    if (refreshed) setMod(refreshed)
    push('Thanks for your rating!', 'success')
  }

  async function handleAddComment(text: string, parentId: string | null) {
    if (!user) {
      navigate('/login')
      return
    }
    const c = await commentService.add({
      modId: mod!.id,
      userId: user.id,
      userName: user.username,
      userAvatar: user.avatarUrl,
      text,
      parentId,
    })
    setComments((cs) => [...cs, c])
  }

  async function handleReport(commentId: string) {
    await commentService.report(commentId)
    setComments((cs) => cs.map((c) => (c.id === commentId ? { ...c, reported: true } : c)))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-mist-400">
        <Link to="/explore" className="hover:text-signal-400">
          Explore
        </Link>
        <span>/</span>
        <Link to={`/explore?category=${mod.category}`} className="hover:text-signal-400">
          {mod.category}
        </Link>
      </div>

      {mod.status !== 'approved' && (
        <div className="card mb-6 flex items-center gap-2.5 border-amber-700/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
          <ShieldAlert size={16} />
          {mod.status === 'pending'
            ? 'This mod is pending moderator approval. Only you and administrators can see it.'
            : 'This mod was rejected by moderation and is not publicly visible.'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="card overflow-hidden">
            <div className="relative aspect-video bg-ink-900">
              <img src={mod.screenshots[activeShot]} alt={mod.title} className="h-full w-full object-cover" />
              {mod.screenshots.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveShot((i) => (i - 1 + mod.screenshots.length) % mod.screenshots.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-ink-950/70 p-1.5 text-white hover:bg-ink-950"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveShot((i) => (i + 1) % mod.screenshots.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-ink-950/70 p-1.5 text-white hover:bg-ink-950"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
            {mod.screenshots.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-ink-600 p-3">
                {mod.screenshots.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveShot(i)}
                    className={`h-14 w-24 shrink-0 overflow-hidden rounded-md border-2 ${
                      i === activeShot ? 'border-signal-500' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={s} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Description</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-mist-300">{mod.description}</p>
            {mod.credits && (
              <p className="mt-4 text-sm text-mist-400">
                <span className="font-semibold text-mist-300">Credits: </span>
                {mod.credits}
              </p>
            )}
          </div>

          <div className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <History size={17} /> Changelog
            </h2>
            <ol className="space-y-3 border-l border-ink-700 pl-5">
              {mod.changelog.map((c, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-signal-500" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="badge-signal">v{c.version}</span>
                    <span className="font-mono text-xs text-mist-400">{formatDate(c.date)}</span>
                  </div>
                  <p className="mt-1 text-sm text-mist-300">{c.notes}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-10">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-bold">Ratings & comments</h2>
              <div className="flex items-center gap-3">
                <StarRating value={mod.avgRating} count={mod.ratingCount} />
                {user && !isOwner && (
                  <div className="flex items-center gap-1.5 border-l border-ink-600 pl-3">
                    <span className="text-xs text-mist-400">Your rating:</span>
                    <StarRating value={myRating} interactive onChange={handleRate} />
                  </div>
                )}
              </div>
            </div>
            <CommentThread comments={comments} currentUser={user} onAdd={handleAddComment} onReport={handleReport} />
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <span className="badge-signal mb-2">
                  <Icon size={11} /> {mod.category}
                </span>
                <h1 className="font-display text-xl font-bold leading-tight text-white">{mod.title}</h1>
              </div>
            </div>

            <Link to={`/users/${mod.authorName}`} className="mb-4 flex items-center gap-2.5 text-sm hover:text-signal-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-800 font-mono text-xs text-signal-400">
                {mod.authorName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-mist-100">{mod.authorName}</p>
                <p className="font-mono text-[11px] text-mist-400">view profile</p>
              </div>
            </Link>

            <dl className="mb-5 grid grid-cols-2 gap-3 border-y border-ink-700 py-4 text-sm">
              <div>
                <dt className="text-xs text-mist-400">Version</dt>
                <dd className="font-mono text-mist-100">{mod.version}</dd>
              </div>
              <div>
                <dt className="text-xs text-mist-400">Size</dt>
                <dd className="font-mono text-mist-100">{formatBytes(mod.fileMeta.sizeBytes)}</dd>
              </div>
              <div>
                <dt className="text-xs text-mist-400">Downloads</dt>
                <dd className="font-mono text-mist-100">{mod.downloadCount.toLocaleString('en-US')}</dd>
              </div>
              <div>
                <dt className="text-xs text-mist-400">Updated</dt>
                <dd className="text-mist-100">{timeAgo(mod.updatedAt)}</dd>
              </div>
            </dl>

            <button onClick={handleDownload} disabled={downloading} className="btn-primary w-full !py-3">
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download mod
            </button>
            {lastDownloadedAt && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-signal-400">
                <CheckCircle2 size={12} /> Downloaded {timeAgo(lastDownloadedAt)}
              </p>
            )}
            <button
              onClick={handleFavorite}
              className={`btn-secondary mt-2.5 w-full ${isFavorite ? '!border-signal-600 !text-signal-300' : ''}`}
            >
              <Heart size={15} className={isFavorite ? 'fill-signal-400 text-signal-400' : ''} />
              {isFavorite ? 'In your favorites' : 'Add to favorites'}
            </button>

            {user && !isOwner && (
              <button
                onClick={async () => {
                  await modService.setReported(mod.id, true)
                  push('Mod reported. A moderator will review it.', 'info')
                }}
                className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-mist-400 hover:text-amber-400"
              >
                <Flag size={12} /> Report this mod
              </button>
            )}
          </div>

          <p className="px-1 text-center text-xs text-mist-400">Published on {formatDate(mod.createdAt)}</p>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmRedownload}
        onClose={() => setConfirmRedownload(false)}
        onConfirm={performDownload}
        title="You already downloaded this mod"
        description={`You downloaded ${mod.title} ${lastDownloadedAt ? timeAgo(lastDownloadedAt) : 'before'}. Download it again anyway?`}
        confirmLabel="Download anyway"
        cancelLabel="Cancel"
      />
    </div>
  )
}
