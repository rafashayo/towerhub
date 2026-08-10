import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Loader2, Pencil, Shuffle, Calendar, Save, ShieldCheck, Settings } from 'lucide-react'
import { userService } from '../services/userService'
import { modService, type ModWithStats } from '../services/modService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ModGrid, ModGridSkeleton } from '../components/ModGrid'
import { SecuritySettings } from '../components/account/SecuritySettings'
import { avatarFor, formatDate } from '../lib/utils'
import { MAX_IMAGE_BYTES } from '../lib/files'
import { uploadService } from '../services/uploadService'
import type { PublicUser } from '../types/auth'

type Tab = 'mods' | 'favorites' | 'security'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const [params, setParams] = useSearchParams()
  const { user: me, updateProfile, refresh } = useAuth()
  const { push } = useToast()

  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [mods, setMods] = useState<ModWithStats[]>([])
  const [modsLoading, setModsLoading] = useState(true)
  const [favorites, setFavorites] = useState<ModWithStats[]>([])
  const [favLoading, setFavLoading] = useState(false)

  const [bioDraft, setBioDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const avatarInput = useRef<HTMLInputElement>(null)

  const tab = (params.get('tab') as Tab) ?? 'mods'
  const isOwner = me?.username.toLowerCase() === username?.toLowerCase()

  useEffect(() => {
    if (!username) return
    setLoading(true)
    setNotFound(false)
    userService.findByUsername(username).then((u) => {
      if (!u) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setProfile(u)
      setBioDraft(u.bio)
      setLoading(false)
    })
  }, [username])

  useEffect(() => {
    if (!profile) return
    setModsLoading(true)
    modService
      .list({ authorId: profile.id, status: isOwner ? 'all' : 'approved', sort: 'recent' })
      .then((res) => {
        setMods(res)
        setModsLoading(false)
      })
  }, [profile, isOwner])

  useEffect(() => {
    if (!isOwner || !me || tab !== 'favorites') return
    setFavLoading(true)
    modService.list({ status: 'approved' }).then((all) => {
      setFavorites(all.filter((m) => me.favoriteModIds.includes(m.id)))
      setFavLoading(false)
    })
  }, [isOwner, me, tab])

  async function handleAvatarFile(files: FileList | null) {
    const file = files?.[0]
    if (!file || !me) return
    if (file.size > MAX_IMAGE_BYTES) {
      push('The image is too large.', 'error')
      return
    }
    try {
      const uploaded = await uploadService.uploadImage(file)
      await updateProfile({ avatarUrl: uploaded.url })
      await refresh()
      setProfile((p) => (p ? { ...p, avatarUrl: uploaded.url } : p))
      push('Avatar updated.', 'success')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not upload the avatar.', 'error')
    }
  }

  async function shuffleAvatar() {
    if (!me) return
    const next = avatarFor(Math.random().toString(36))
    await updateProfile({ avatarUrl: next })
    setProfile((p) => (p ? { ...p, avatarUrl: next } : p))
  }

  async function saveBio() {
    if (!me) return
    setSaving(true)
    try {
      await updateProfile({ bio: bioDraft })
      setProfile((p) => (p ? { ...p, bio: bioDraft } : p))
      push('Profile updated.', 'success')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-signal-500" size={28} />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="card mb-8 flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <img src={profile.avatarUrl} alt={profile.username} className="h-24 w-24 rounded-lg border border-ink-600 object-cover" />
          {isOwner && (
            <div className="absolute -bottom-2 -right-2 flex gap-1">
              <button
                onClick={() => avatarInput.current?.click()}
                title="Upload image"
                className="rounded-full bg-ink-800 p-1.5 text-mist-200 ring-1 ring-ink-600 hover:text-signal-400"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={shuffleAvatar}
                title="Generate random avatar"
                className="rounded-full bg-ink-800 p-1.5 text-mist-200 ring-1 ring-ink-600 hover:text-signal-400"
              >
                <Shuffle size={12} />
              </button>
              <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => handleAvatarFile(e.target.files)} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white">{profile.username}</h1>
            {profile.role === 'admin' && (
              <span className="badge-signal">
                <ShieldCheck size={11} /> Staff
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-mist-400">
            <Calendar size={12} /> Member since {formatDate(profile.createdAt)}
          </p>

          {isOwner ? (
            <div className="mt-3">
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                placeholder="Tell us about yourself and your experience with Tower Simulator 3…"
                className="textarea !min-h-[70px]"
                maxLength={280}
              />
              <button onClick={saveBio} disabled={saving || bioDraft === profile.bio} className="btn-secondary mt-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save changes
              </button>
            </div>
          ) : (
            <p className="mt-3 max-w-xl text-sm text-mist-300">{profile.bio || "This user hasn't written a bio yet."}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-6 sm:flex-col sm:text-right">
          <div>
            <p className="font-display text-xl font-bold text-white">{mods.length}</p>
            <p className="text-xs text-mist-400">mods uploaded</p>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="mb-6 flex gap-2 border-b border-ink-700">
          <button
            onClick={() => setParams({ tab: 'mods' })}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium ${
              tab === 'mods' ? 'border-signal-500 text-white' : 'border-transparent text-mist-400 hover:text-mist-200'
            }`}
          >
            My mods
          </button>
          <button
            onClick={() => setParams({ tab: 'favorites' })}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium ${
              tab === 'favorites' ? 'border-signal-500 text-white' : 'border-transparent text-mist-400 hover:text-mist-200'
            }`}
          >
            Favorites
          </button>
          <button
            onClick={() => setParams({ tab: 'security' })}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium ${
              tab === 'security' ? 'border-signal-500 text-white' : 'border-transparent text-mist-400 hover:text-mist-200'
            }`}
          >
            <Settings size={14} /> Security
          </button>
        </div>
      )}

      {(!isOwner || tab === 'mods') &&
        (modsLoading ? <ModGridSkeleton count={4} /> : <ModGrid mods={mods} />)}

      {isOwner && tab === 'favorites' && (favLoading ? <ModGridSkeleton count={4} /> : <ModGrid mods={favorites} />)}

      {isOwner && tab === 'security' && <SecuritySettings />}
    </div>
  )
}
