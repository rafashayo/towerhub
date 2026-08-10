import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import { authService } from '../services/authService'
import { RadarMark } from '../components/RadarMark'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await authService.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <RadarMark size={44} />
        <h1 className="mt-4 text-2xl font-bold">Set a new password</h1>
      </div>

      {!token ? (
        <div className="card p-6 text-center text-sm text-mist-400">
          Missing reset token. Use the link from your password reset email.
        </div>
      ) : done ? (
        <div className="card p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal-950 text-signal-400">
            <CheckCircle2 size={22} />
          </div>
          <p className="text-sm text-mist-200">Your password was updated. All previous sessions were signed out.</p>
          <button onClick={() => navigate('/login')} className="btn-primary mt-5 w-full">
            Sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-mist-100">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="At least 8 characters"
            />
            <p className="mt-1.5 text-xs text-mist-400">Needs 8+ characters, upper &amp; lower case, and a number.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-mist-100">Confirm password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
              placeholder="Repeat the password"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Update password
          </button>
        </form>
      )}

      <Link to="/login" className="mt-6 block text-center text-sm text-mist-400 hover:text-mist-200">
        Back to sign in
      </Link>
    </div>
  )
}
