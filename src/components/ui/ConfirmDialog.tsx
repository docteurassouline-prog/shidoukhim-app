'use client'

import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-4">
        <div
          className={[
            'shrink-0 flex items-center justify-center h-12 w-12 rounded-full',
            variant === 'danger' ? 'bg-danger-light' : 'bg-gold-light',
          ].join(' ')}
        >
          <AlertTriangle
            className={[
              'h-6 w-6',
              variant === 'danger' ? 'text-danger' : 'text-gold-deep',
            ].join(' ')}
          />
        </div>
        <div>
          <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
          <p className="text-sm text-ink-soft">{message}</p>
        </div>
      </div>
    </Modal>
  )
}
