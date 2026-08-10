import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Mail, Info, ArrowLeft } from 'lucide-react'
import { authService } from '../services/authService'
import { RadarMark } from '../components/RadarMark'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ message: string; devPreviewUrl?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      setResult(await authService.forgotPassword(email))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <RadarMark size={44} />
        <h1 className="mt-4 text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-mist-400">We'll send a reset link to your email.</p>
      </div>

      {result ? (
        <div className="card p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal-950 text-signal-400">
            <Mail size={22} />
          </div>
          <p className="text-sm text-mist-200">{result.message}</p>
          {result.devPreviewUrl && (
            <>
              <div className="mt-4 flex items-start gap-2 rounded-md bg-ink-900 p-3 text-left text-xs text-mist-400">
                <Info size={14} className="mt-0.5 shrink-0 text-signal-400" />
                <p>No email server is configured in this demo, so here's the reset link directly.</p>
              </div>
              <a href={result.devPreviewUrl} className="btn-secondary mt-3 w-full break-all !text-xs">
                {result.devPreviewUrl}
              </a>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-mist-100">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            Send reset link
          </button>
        </form>
      )}

      <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-mist-400 hover:text-mist-200">
        <ArrowLeft size={14} /> Back to sign in
      </Link>
    </div>
  )
}
