import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

function GuardLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="animate-spin text-signal-500" size={28} />
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <GuardLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <GuardLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
