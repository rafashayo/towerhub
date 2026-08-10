import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, LogIn, Info, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { RadarMark } from '../components/RadarMark'

export default function Login() {
  const { login, loginWithTwoFactor } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await login(email, password)
      if (result.requires2FA) {
        setPendingId(result.pendingId)
      } else {
        push('Welcome back!', 'success')
        navigate(location.state?.from ?? '/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTwoFactorSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingId) return
    setError(null)
    setSubmitting(true)
    try {
      await loginWithTwoFactor(pendingId, code)
      push('Welcome back!', 'success')
      navigate(location.state?.from ?? '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code.')
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemo(role: 'admin' | 'user') {
    if (role === 'admin') {
      setEmail('admin@towerhub.io')
      setPassword('admin123')
    } else {
      setEmail('gus@example.com')
      setPassword('password1')
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <RadarMark size={44} />
        <h1 className="mt-4 text-2xl font-bold">Sign in to TowerHub</h1>
        <p className="mt-1 text-sm text-mist-400">Sign in to upload mods, comment, and rate.</p>
      </div>

      {pendingId ? (
        <form onSubmit={handleTwoFactorSubmit} className="card space-y-4 p-6">
          <div className="flex items-center gap-2 text-signal-400">
            <ShieldCheck size={18} />
            <p className="text-sm font-semibold text-mist-100">Two-factor verification</p>
          </div>
          <p className="text-sm text-mist-400">Enter the 6-digit code from your authenticator app.</p>
          <input
            autoFocus
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="input text-center font-mono text-lg tracking-[0.5em]"
            placeholder="000000"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={submitting || code.length !== 6} className="btn-primary w-full !py-3">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            Verify & sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingId(null)
              setCode('')
              setError(null)
            }}
            className="flex w-full items-center justify-center gap-1.5 text-xs text-mist-400 hover:text-mist-200"
          >
            <ArrowLeft size={12} /> Back
          </button>
        </form>
      ) : (
        <>
          <form onSubmit={handlePasswordSubmit} className="card space-y-4 p-6">
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
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-semibold text-mist-100">Password</label>
                <Link to="/forgot-password" className="text-xs text-signal-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              Sign in
            </button>
          </form>

          <div className="card mt-4 flex items-start gap-2.5 p-4 text-xs text-mist-400">
            <Info size={14} className="mt-0.5 shrink-0 text-signal-400" />
            <div>
              <p className="mb-2">Demo accounts (real accounts in the local backend database):</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => fillDemo('admin')} className="badge hover:border-signal-600 hover:text-signal-300">
                  admin@towerhub.io
                </button>
                <button type="button" onClick={() => fillDemo('user')} className="badge hover:border-signal-600 hover:text-signal-300">
                  gus@example.com
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-mist-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-signal-400 hover:underline">
              Create one for free
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
