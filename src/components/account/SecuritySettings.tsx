import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Loader2,
  Mail,
  MailCheck,
  Monitor,
  LogOut,
  X,
  Info,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { authService } from '../../services/authService'
import type { AccountSession } from '../../types/auth'
import { formatDate } from '../../lib/utils'

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-mist-100">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  )
}

function EmailVerificationCard() {
  const { user, refresh } = useAuth()
  const { push } = useToast()
  const [sending, setSending] = useState(false)
  const [devUrl, setDevUrl] = useState<string | null>(null)

  async function resend() {
    if (!user) return
    setSending(true)
    try {
      const res = await authService.resendVerification(user.email)
      push(res.message, 'success')
      setDevUrl(res.devPreviewUrl ?? null)
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not resend the email.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <SectionCard title="Email verification" icon={user?.emailVerified ? <MailCheck size={16} className="text-signal-400" /> : <Mail size={16} />}>
      {user?.emailVerified ? (
        <p className="flex items-center gap-2 text-sm text-mist-300">
          <span className="badge-signal">Verified</span> {user.email}
        </p>
      ) : (
        <div>
          <p className="flex items-center gap-2 text-sm text-mist-300">
            <span className="badge border-amber-600/40 text-amber-400">Unverified</span> {user?.email}
          </p>
          <button onClick={resend} disabled={sending} className="btn-secondary mt-3">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            Resend verification email
          </button>
          {devUrl && (
            <div className="mt-3 space-y-2">
              <div className="flex items-start gap-2 rounded-md bg-ink-900 p-3 text-xs text-mist-400">
                <Info size={13} className="mt-0.5 shrink-0 text-signal-400" />
                <p>No email server configured in this demo — here's the link directly.</p>
              </div>
              <a href={devUrl} className="block break-all text-xs text-signal-400 hover:underline">
                {devUrl}
              </a>
            </div>
          )}
          <button onClick={() => refresh()} className="mt-2 block text-xs text-mist-400 hover:text-mist-200">
            I verified it, refresh status
          </button>
        </div>
      )}
    </SectionCard>
  )
}

function ChangePasswordCard() {
  const { push } = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) {
      push('New passwords do not match.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await authService.changePassword(current, next)
      push(res.message, 'success')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not change your password.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SectionCard title="Change password" icon={<KeyRound size={16} />}>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Current password"
          className="input"
        />
        <input
          type="password"
          required
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New password"
          className="input"
        />
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="input"
        />
        <button type="submit" disabled={submitting} className="btn-secondary">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
          Update password
        </button>
      </form>
    </SectionCard>
  )
}

function TwoFactorCard() {
  const { user, refresh } = useAuth()
  const { push } = useToast()
  const [setup, setSetup] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null)
  const [code, setCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisable, setShowDisable] = useState(false)
  const [busy, setBusy] = useState(false)

  async function startSetup() {
    setBusy(true)
    try {
      const res = await authService.setupTwoFactor()
      setSetup(res)
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not start 2FA setup.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await authService.enableTwoFactor(code)
      push(res.message, 'success')
      setSetup(null)
      setCode('')
      await refresh()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Invalid code.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await authService.disableTwoFactor(disablePassword)
      push(res.message, 'success')
      setShowDisable(false)
      setDisablePassword('')
      await refresh()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not disable 2FA.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard title="Two-factor authentication" icon={user?.totpEnabled ? <ShieldCheck size={16} className="text-signal-400" /> : <ShieldOff size={16} />}>
      {user?.totpEnabled ? (
        <div>
          <p className="flex items-center gap-2 text-sm text-mist-300">
            <span className="badge-signal">Enabled</span> Your account requires a code at login.
          </p>
          {!showDisable ? (
            <button onClick={() => setShowDisable(true)} className="btn-danger mt-3">
              Disable 2FA
            </button>
          ) : (
            <form onSubmit={disable} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                required
                autoFocus
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Confirm your password"
                className="input"
              />
              <button type="submit" disabled={busy} className="btn-danger shrink-0">
                {busy ? <Loader2 size={14} className="animate-spin" /> : 'Confirm disable'}
              </button>
            </form>
          )}
        </div>
      ) : setup ? (
        <form onSubmit={confirmEnable} className="space-y-3">
          <p className="text-sm text-mist-300">Scan this with Google Authenticator, Authy, or any TOTP app:</p>
          <img src={setup.qrCodeDataUrl} alt="2FA QR code" className="rounded-md border border-ink-600 bg-white p-2" width={160} height={160} />
          <p className="text-xs text-mist-400">
            Can't scan? Enter manually: <span className="font-mono text-mist-200">{setup.secret}</span>
          </p>
          <input
            autoFocus
            required
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit code"
            className="input font-mono tracking-widest"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy || code.length !== 6} className="btn-primary">
              {busy ? <Loader2 size={14} className="animate-spin" /> : 'Confirm & enable'}
            </button>
            <button type="button" onClick={() => setSetup(null)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className="text-sm text-mist-400">Add an extra layer of security with a real authenticator app.</p>
          <button onClick={startSetup} disabled={busy} className="btn-secondary mt-3">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            Enable two-factor authentication
          </button>
        </div>
      )}
    </SectionCard>
  )
}

function SessionsCard() {
  const { logoutAll } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<AccountSession[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    authService
      .listSessions()
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [])

  async function revoke(id: string) {
    setBusyId(id)
    try {
      await authService.revokeSession(id)
      setSessions((s) => s.filter((sess) => sess.id !== id))
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not revoke that session.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function signOutEverywhere() {
    await logoutAll()
    navigate('/')
  }

  return (
    <SectionCard title="Active sessions" icon={<Monitor size={16} />}>
      {loading ? (
        <Loader2 className="animate-spin text-signal-500" size={18} />
      ) : (
        <ul className="divide-y divide-ink-700">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate text-mist-200">{s.userAgent ?? 'Unknown device'}</p>
                <p className="font-mono text-xs text-mist-400">
                  Since {formatDate(s.createdAt)}
                  {s.current && <span className="text-signal-400"> · this device</span>}
                  {s.rememberMe ? ' · remembered' : ' · session-only'}
                </p>
              </div>
              {!s.current && (
                <button
                  onClick={() => revoke(s.id)}
                  disabled={busyId === s.id}
                  className="flex shrink-0 items-center gap-1 text-xs text-mist-400 hover:text-red-300"
                >
                  <X size={12} /> Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <button onClick={signOutEverywhere} className="btn-danger mt-4">
        <LogOut size={14} /> Sign out of all devices
      </button>
    </SectionCard>
  )
}

export function SecuritySettings() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <EmailVerificationCard />
      <ChangePasswordCard />
      <TwoFactorCard />
      <SessionsCard />
    </div>
  )
}
