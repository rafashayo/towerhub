import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, UserPlus, MailCheck, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { RadarMark } from '../components/RadarMark'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { devVerifyUrl } = await register(username, email, password)
      if (devVerifyUrl) {
        setDevVerifyUrl(devVerifyUrl)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.')
    } finally {
      setSubmitting(false)
    }
  }

  if (devVerifyUrl) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        <div className="card p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal-950 text-signal-400">
            <MailCheck size={22} />
          </div>
          <h1 className="text-xl font-bold">Account created — verify your email</h1>
          <p className="mt-2 text-sm text-mist-400">
            You're signed in already. We'd normally send a verification link to <strong className="text-mist-200">{email}</strong>.
          </p>

          <div className="mt-4 flex items-start gap-2 rounded-md bg-ink-900 p-3 text-left text-xs text-mist-400">
            <Info size={14} className="mt-0.5 shrink-0 text-signal-400" />
            <p>
              This demo has no real email server configured, so here's the verification link directly (in
              production this field would not exist — the link would only ever reach the user's inbox).
            </p>
          </div>
          <a href={devVerifyUrl} className="btn-secondary mt-3 w-full break-all !text-xs">
            {devVerifyUrl}
          </a>

          <button onClick={() => navigate('/')} className="btn-primary mt-5 w-full">
            Continue to TowerHub
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <RadarMark size={44} />
        <h1 className="mt-4 text-2xl font-bold">Create your TowerHub account</h1>
        <p className="mt-1 text-sm text-mist-400">Join the community and start sharing your mods.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-mist-100">Username</label>
          <input
            required
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            placeholder="e.g. TaxiwayTess"
          />
        </div>
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
          <label className="mb-1.5 block text-sm font-semibold text-mist-100">Password</label>
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

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-mist-400">
        Already have an account?{' '}
        <Link to="/login" className="text-signal-400 hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  )
}
