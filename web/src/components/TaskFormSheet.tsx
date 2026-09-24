import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from '../db'
import { scheduleTaskReminder } from '../notifications'
import { RECURRENCE_LABELS, RECURRENCE_OPTIONS, type RecurrenceRule } from '../models/recurrence'

function toLocalDateValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export default function TaskFormSheet({ onClose }: { onClose: () => void }) {
  const members = useLiveQuery(() => db.members.toArray(), [])

  const [title, setTitle] = useState('')
  const [hasDueDate, setHasDueDate] = useState(true)
  const [dueDate, setDueDate] = useState(() => toLocalDateValue(new Date()))
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('none')
  const [assignedToId, setAssignedToId] = useState<string>('')

  const canSave = title.trim().length > 0

  async function handleSave() {
    if (!canSave) return
    const createdById = members?.[0]?.id ?? newId()
    const id = newId()
    const due = hasDueDate ? new Date(`${dueDate}T09:00`) : undefined

    await db.tasks.add({
      id,
      title: title.trim(),
      dueDate: due,
      recurrence,
      isCompleted: false,
      assignedToId: assignedToId || undefined,
      createdById,
      createdAt: new Date(),
    })

    if (due) scheduleTaskReminder(id, title.trim(), due)
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <button onClick={onClose}>Annuler</button>
          <h2>Nouvelle tâche</h2>
          <button onClick={handleSave} disabled={!canSave}>
            Ajouter
          </button>
        </div>

        <div className="field">
          <label>Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Sortir les poubelles"
            autoFocus
          />
        </div>

        <div className="toggle-row">
          <label style={{ margin: 0 }}>Date d'échéance</label>
          <input type="checkbox" checked={hasDueDate} onChange={(e) => setHasDueDate(e.target.checked)} />
        </div>

        {hasDueDate && (
          <div className="field">
            <label>Échéance</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        )}

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
          <label>Qui s'en occupe ?</label>
          <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            <option value="">Non assigné</option>
            {members?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
