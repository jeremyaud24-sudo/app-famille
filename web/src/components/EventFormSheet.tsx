import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from '../db'
import { scheduleEventReminder } from '../notifications'
import { RECURRENCE_LABELS, RECURRENCE_OPTIONS, type RecurrenceRule } from '../models/recurrence'
import type { EventVisibility } from '../models/types'

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function EventFormSheet({ onClose }: { onClose: () => void }) {
  const members = useLiveQuery(() => db.members.toArray(), [])

  const [title, setTitle] = useState('')
  const [start, setStart] = useState(() => toLocalInputValue(new Date()))
  const [end, setEnd] = useState(() => toLocalInputValue(new Date(Date.now() + 3600_000)))
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('none')
  const [visibility, setVisibility] = useState<EventVisibility>('shared')

  const canSave = title.trim().length > 0

  async function handleSave() {
    if (!canSave) return
    const ownerId = members?.[0]?.id ?? newId()
    const id = newId()
    const startDate = new Date(start)

    await db.events.add({
      id,
      title: title.trim(),
      startDate,
      endDate: new Date(end),
      isAllDay: false,
      recurrence,
      visibility,
      ownerId,
      createdAt: new Date(),
    })

    scheduleEventReminder(id, title.trim(), startDate)
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <button onClick={onClose}>Annuler</button>
          <h2>Nouveau RDV</h2>
          <button onClick={handleSave} disabled={!canSave}>
            Ajouter
          </button>
        </div>

        <div className="field">
          <label>Titre</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Rendez-vous médecin" autoFocus />
        </div>

        <div className="field">
          <label>Début</label>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>

        <div className="field">
          <label>Fin</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
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
      </div>
    </div>
  )
}
