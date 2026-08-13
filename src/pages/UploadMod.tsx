import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, ImagePlus, X, Loader2, Info, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { modService } from '../services/modService'
import { uploadService, type UploadedFile } from '../services/uploadService'
import { MAX_IMAGE_BYTES, MAX_MOD_FILE_BYTES } from '../lib/files'
import { formatBytes } from '../lib/utils'
import { Select, type SelectOption } from '../components/ui/Select'
import { CATEGORY_ICON } from '../lib/categoryMeta'
import { MOD_CATEGORIES, type ModCategory } from '../types'

const CATEGORY_OPTIONS: SelectOption<ModCategory>[] = MOD_CATEGORIES.map((c) => ({
  value: c,
  label: c,
  icon: CATEGORY_ICON[c],
}))

export default function UploadMod() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ModCategory>('Misc')
  const [version, setVersion] = useState('1.0.0')
  const [credits, setCredits] = useState('')
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [modFile, setModFile] = useState<UploadedFile | null>(null)
  const [uploadingModFile, setUploadingModFile] = useState(false)
  const [modFileProgress, setModFileProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imgInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImages(files: FileList | null) {
    if (!files) return
    const candidates = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) return false
      if (file.size > MAX_IMAGE_BYTES) {
        push(`"${file.name}" exceeds the ${formatBytes(MAX_IMAGE_BYTES)} limit.`, 'error')
        return false
      }
      return true
    })
    if (!candidates.length) return

    setUploadingImages(true)
    try {
      const uploaded = await Promise.all(candidates.map((file) => uploadService.uploadImage(file)))
      setScreenshots((prev) => [...prev, ...uploaded.map((u) => u.url)].slice(0, 6))
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not upload one of the images.', 'error')
    } finally {
      setUploadingImages(false)
    }
  }

  async function handleModFile(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (file.size > MAX_MOD_FILE_BYTES) {
      push(`The file exceeds the ${formatBytes(MAX_MOD_FILE_BYTES)} maximum.`, 'error')
      return
    }
    setUploadingModFile(true)
    setModFileProgress(0)
    try {
      const uploaded = await uploadService.uploadModFile(file, setModFileProgress)
      setModFile(uploaded)
      push('Mod file uploaded.', 'success')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not upload the file.', 'error')
    } finally {
      setUploadingModFile(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)

    if (!modFile) {
      setError('Attach the mod file.')
      return
    }

    setSubmitting(true)
    try {
      const mod = await modService.create({
        title,
        description,
        category,
        version,
        credits,
        authorId: user.id,
        authorName: user.username,
        screenshots,
        file: modFile,
      })
      push('Mod submitted! It is now pending moderation approval.', 'success')
      navigate(`/mods/${mod.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish the mod.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="label-mono mb-1.5">Share your work</p>
      <h1 className="mb-2 text-3xl font-bold">Upload a mod</h1>
      <p className="mb-8 text-mist-400">
        Every mod goes through a moderation review before it's published to the catalog.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="card space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-mist-100">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={4}
              placeholder="e.g. LEMD Madrid-Barajas — Full Rework"
              className="input"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-mist-100">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={20}
              placeholder="Explain what the mod includes, what problem it solves, and any relevant technical details."
              className="textarea"
              rows={5}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-mist-100">Category</label>
              <Select value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-mist-100">Version</label>
              <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" className="input" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-mist-100">Credits</label>
            <input
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="Your name and any collaborators"
              className="input"
            />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-mist-100">Screenshots</label>
            <p className="mb-3 text-xs text-mist-400">Up to 6 images, {formatBytes(MAX_IMAGE_BYTES)} each. Uploaded to the server right away.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {screenshots.map((s, i) => (
              <div key={i} className="group relative aspect-video overflow-hidden rounded-md border border-ink-600">
                <img src={s} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 rounded-full bg-ink-950/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {screenshots.length < 6 && (
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                disabled={uploadingImages}
                className="flex aspect-video flex-col items-center justify-center gap-1 rounded-md border border-dashed border-ink-500 text-mist-400 hover:border-signal-600 hover:text-signal-400 disabled:opacity-50"
              >
                {uploadingImages ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                <span className="text-[11px]">{uploadingImages ? 'Uploading…' : 'Add'}</span>
              </button>
            )}
          </div>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleImages(e.target.files)}
          />
        </section>

        <section className="card space-y-4 p-6">
          <label className="mb-1.5 block text-sm font-semibold text-mist-100">Mod file</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingModFile}
            className="flex w-full flex-col items-center gap-2 rounded-md border border-dashed border-ink-500 px-6 py-8 text-center hover:border-signal-600 disabled:opacity-70"
          >
            {uploadingModFile ? (
              <>
                <Loader2 size={24} className="animate-spin text-signal-400" />
                <p className="text-sm text-mist-200">Uploading… {modFileProgress}%</p>
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full bg-signal-500 transition-all" style={{ width: `${modFileProgress}%` }} />
                </div>
              </>
            ) : modFile ? (
              <>
                <CheckCircle2 size={24} className="text-signal-400" />
                <p className="text-sm text-mist-100">{modFile.name}</p>
                <p className="text-xs text-mist-400">{formatBytes(modFile.sizeBytes)} — uploaded, click to replace</p>
              </>
            ) : (
              <>
                <UploadCloud size={24} className="text-mist-400" />
                <p className="text-sm text-mist-200">Click to choose the file (.zip, .ts3mod, etc.)</p>
                <p className="text-xs text-mist-400">Maximum {formatBytes(MAX_MOD_FILE_BYTES)}</p>
              </>
            )}
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={(e) => handleModFile(e.target.files)} />

          <div className="flex items-start gap-2 rounded-md bg-ink-900 p-3 text-xs text-mist-400">
            <Info size={14} className="mt-0.5 shrink-0 text-signal-400" />
            <p>
              Files are uploaded to the TowerHub server as soon as you pick them and stored on disk
              (<code className="text-mist-300">server/uploads/</code>) — they persist across reloads, unlike a
              browser-only demo. Not connected to a cloud provider (S3/R2) in this environment; see README.
            </p>
          </div>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={submitting || uploadingImages || uploadingModFile} className="btn-primary">
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Publish mod
          </button>
        </div>
      </form>
    </div>
  )
}
