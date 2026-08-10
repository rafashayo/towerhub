import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { uid } from '../lib/utils'

type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: string
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  push: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}
const COLORS: Record<ToastKind, string> = {
  success: 'border-signal-700 text-signal-300',
  error: 'border-red-900 text-red-300',
  info: 'border-ink-500 text-mist-200',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const dismiss = (id: string) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind]
          return (
            <div
              key={t.id}
              className={`card ${COLORS[t.kind]} flex items-start gap-2.5 border bg-ink-850/95 px-3.5 py-3 text-sm shadow-panel backdrop-blur animate-[fadeIn_.15s_ease]`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-mist-100">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-mist-400 hover:text-white" aria-label="Close">
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
