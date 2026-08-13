import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { RadarMark } from '../components/RadarMark'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const { verifyEmail } = useAuth()
  const token = params.get('token') ?? ''

  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token.')
      return
    }
    // verifyEmail() also establishes a session on success (see server route),
    // and stores the returned user in AuthContext — no separate refresh() needed.
    verifyEmail(token)
      .then((res) => {
        setStatus(res.verified ? 'ok' : 'error')
        setMessage(res.message)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Could not verify your email.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <RadarMark size={44} />
      {status === 'loading' && <Loader2 className="mt-6 animate-spin text-signal-500" size={28} />}
      {status === 'ok' && (
        <>
          <CheckCircle2 className="mt-6 text-signal-400" size={32} />
          <h1 className="mt-3 text-xl font-bold">Email verified</h1>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="mt-6 text-red-400" size={32} />
          <h1 className="mt-3 text-xl font-bold">Verification failed</h1>
        </>
      )}
      {status !== 'loading' && <p className="mt-2 text-mist-400">{message}</p>}
      {status !== 'loading' && (
        <Link to="/" className="btn-primary mt-6">
          {status === 'ok' ? 'Continue to TowerHub' : 'Back to home'}
        </Link>
      )}
    </div>
  )
}
