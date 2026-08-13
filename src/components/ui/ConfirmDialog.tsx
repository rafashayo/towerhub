import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  icon?: LucideIcon
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  icon: Icon = AlertTriangle,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} transition className="relative z-[100]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm duration-150 ease-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel
          transition
          className="card w-full max-w-sm p-6 shadow-glow-lg duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <div
            className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${
              tone === 'danger' ? 'bg-red-950/50 text-red-400' : 'bg-amber-950/40 text-amber-400'
            }`}
          >
            <Icon size={20} />
          </div>
          <DialogTitle className="mt-4 text-center text-base font-semibold text-white">{title}</DialogTitle>
          <p className="mt-1.5 text-center text-sm text-mist-400">{description}</p>

          <div className="mt-6 flex gap-2.5">
            <button onClick={onClose} className="btn-secondary flex-1">
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={tone === 'danger' ? 'btn-danger flex-1' : 'btn-primary flex-1'}
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
