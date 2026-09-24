/**
 * Confirmation avant une action irréversible (suppression). Un enfant ou un
 * grand-parent qui appuie par erreur sur un petit bouton ✕ doit avoir une
 * chance de se raviser avant que la donnée disparaisse pour de bon.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Supprimer',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>
            Annuler
          </button>
          <button className="confirm-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
