'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteCandidate } from '@/lib/candidates/actions'
import { deleteCandidateMan } from '@/lib/candidates-men/actions'
import Button from '@/components/ui/Button'

interface DeleteCandidateButtonProps {
  id: string
  name: string
  type: 'woman' | 'man'
  redirectTo: string
}

export default function DeleteCandidateButton({ id, name, type, redirectTo }: DeleteCandidateButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)

    const result = type === 'woman'
      ? await deleteCandidate(id)
      : await deleteCandidateMan(id)

    if (!result.success) {
      setError(result.error ?? 'Erreur lors de la suppression')
      setDeleting(false)
      return
    }

    router.push(redirectTo)
  }

  if (!showConfirm) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(true)}
        icon={<Trash2 className="h-4 w-4" />}
        className="text-danger hover:text-danger-deep hover:bg-danger-light"
      >
        Supprimer
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="bg-danger-light border border-danger/25 rounded-lg px-4 py-3 max-w-sm">
        <p className="text-sm text-danger-deep font-medium mb-1">
          Supprimer {name} ?
        </p>
        <p className="text-xs text-danger-deep/70 mb-3">
          Cette action est irreversible. Toutes les propositions et references liees seront aussi supprimees.
        </p>
        {error && (
          <p className="text-xs text-danger-deep mb-2">{error}</p>
        )}
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowConfirm(false); setError(null) }}
            disabled={deleting}
          >
            Annuler
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-danger text-white hover:bg-danger-deep transition-colors disabled:opacity-60"
          >
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}
