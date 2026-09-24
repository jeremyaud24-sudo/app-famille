import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from '../db'
import { cancelEventReminder, scheduleEventReminder } from '../notifications'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'
import { RECURRENCE_LABELS, RECURRENCE_OPTIONS, type RecurrenceRule } from '../models/recurrence'
import type { EventVisibility, FamilyEvent } from '../models/types'

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function EventFormSheet({ event, onClose }: { event?: FamilyEvent; onClose: () => void }) {
  const members = useLiveQuery(() => db.members.toArray(), [])
  const { showToast } = useToast()
  const isEditing = event !== undefined

  const [title, setTitle] = useState(event?.title ?? '')
  const [start, setStart] = useState(() => toLocalInputValue(event?.startDate ?? new Date()))
  const [end, setEnd] = useState(() => toLocalInputValue(event?.endDate ?? new Date(Date.now() + 3600_000)))
  const [endTouched, setEndTouched] = useState(isEditing)

  /**
   * Tant que l'utilisateur n'a pas touché la fin lui-même, on la fait
   * suivre le début (+1h) : sans ça, changer l'heure de début laisse une
   * fin "figée" sur l'heure d'ouverture du formulaire, ce qui produit des
   * RDV de durée absurde (ex: 10h → 14h) sans que personne ne l'ait voulu.
   */
  function handleStartChange(value: string) {
    setStart(value)
    if (!endTouched) {
      const newStart = new Date(value)
      if (!Number.isNaN(newStart.getTime())) {
        setEnd(toLocalInputValue(new Date(newStart.getTime() + 3600_000)))
      }
    }
  }

  function handleEndChange(value: string) {
    setEndTouched(true)
    setEnd(value)
  }
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(event?.recurrence ?? 'none')
  const [visibility, setVisibility] = useState<EventVisibility>(event?.visibility ?? 'shared')
  const [ownerId, setOwnerId] = useState<string>(event?.ownerId ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const canSave = title.trim().length > 0

  async function handleSave() {
    if (!canSave) return
    const resolvedOwnerId = ownerId || members?.[0]?.id || newId()
    const startDate = new Date(start)
    const id = event?.id ?? newId()

    if (isEditing) {
      await db.events.update(id, {
        title: title.trim(),
        startDate,
        endDate: new Date(end),
        recurrence,
        visibility,
        ownerId: resolvedOwnerId,
      })
    } else {
      await db.events.add({
        id,
        title: title.trim(),
        startDate,
        endDate: new Date(end),
        isAllDay: false,
        recurrence,
        visibility,
        ownerId: resolvedOwnerId,
        createdAt: new Date(),
      })
    }

    scheduleEventReminder(id, title.trim(), startDate)
    showToast(isEditing ? 'Modifié ✓' : 'Ajouté ✓')
    onClose()
  }

  async function handleDeleteFromEdit() {
    if (!event) return
    cancelEventReminder(event.id)
    await db.events.delete(event.id)
    showToast('Supprimé')
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <button onClick={onClose}>Annuler</button>
          <h2>{isEditing ? 'Modifier le RDV' : 'Nouveau RDV'}</h2>
          <button onClick={handleSave} disabled={!canSave}>
            {isEditing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>

        <div className="field">
          <label>Titre</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Rendez-vous médecin" autoFocus />
        </div>

        <div className="field">
          <label>Début</label>
          <input type="datetime-local" value={start} onChange={(e) => handleStartChange(e.target.value)} />
        </div>

        <div className="field">
          <label>Fin</label>
          <input type="datetime-local" value={end} onChange={(e) => handleEndChange(e.target.value)} />
        </div>

        <div className="field">
          <label>Récurrence</label>
          <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as RecurrenceRule)}>
            {RECURRENCE_OPTIONS.map((rule) => (
              <option key={rule} value={rule}>
                {RECURRENCE_LABELS[rule]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Concerne</label>
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            {members?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Visibilité</label>
          <div className="segmented">
            <button className={visibility === 'shared' ? 'active' : ''} onClick={() => setVisibility('shared')}>
              Commun
            </button>
            <button className={visibility === 'personal' ? 'active' : ''} onClick={() => setVisibility('personal')}>
              Personnel
            </button>
          </div>
        </div>

        {isEditing && (
          <button className="delete-link" onClick={() => setConfirmingDelete(true)}>
            Supprimer ce RDV
          </button>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Supprimer ce RDV ?"
          message={`« ${title} » sera définitivement supprimé.`}
          onConfirm={handleDeleteFromEdit}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}
