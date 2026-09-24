import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import { nextOccurrence } from '../models/recurrence'
import { cancelTaskReminder, scheduleTaskReminder } from '../notifications'
import TaskFormSheet from './TaskFormSheet'
import type { FamilyTask } from '../models/types'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

export default function TaskTab() {
  const [isAdding, setIsAdding] = useState(false)

  const tasks = useLiveQuery(async () => {
    const all = await db.tasks.orderBy('dueDate').toArray()
    return all.filter((t) => !t.isCompleted)
  }, [])

  const members = useLiveQuery(() => db.members.toArray(), [])

  function memberName(id?: string): string | undefined {
    return members?.find((m) => m.id === id)?.name
  }

  /**
   * Une tâche récurrente cochée est replanifiée à sa prochaine échéance
   * plutôt que clôturée — c'est ce qu'on attend d'une corvée qui revient
   * chaque semaine.
   */
  async function handleToggle(task: FamilyTask) {
    const next = task.dueDate ? nextOccurrence(task.recurrence, task.dueDate) : null

    if (next) {
      await db.tasks.update(task.id, { dueDate: next, isCompleted: false })
      scheduleTaskReminder(task.id, task.title, next)
    } else {
      await db.tasks.update(task.id, { isCompleted: true })
      cancelTaskReminder(task.id)
    }
  }

  async function handleDelete(task: FamilyTask) {
    cancelTaskReminder(task.id)
    await db.tasks.delete(task.id)
  }

  return (
    <>
      <h1 className="screen-title">Tâches</h1>

      {tasks === undefined ? null : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <p>Aucune tâche en attente.</p>
          <p>Ajoute une corvée ou une tâche à faire avec le bouton +.</p>
        </div>
      ) : (
        <div className="card-list">
          {tasks.map((task) => (
            <div className="card" key={task.id}>
              <div className="card-row">
                <div className="card-row" style={{ gap: 10 }}>
                  <button className="checkbox-btn" onClick={() => handleToggle(task)} aria-label="Marquer comme fait">
                    ○
                  </button>
                  <div>
                    <div className="card-title">{task.title}</div>
                    {task.dueDate && <div className="card-subtitle">{dateFormatter.format(task.dueDate)}</div>}
                  </div>
                </div>
                <div className="card-row" style={{ gap: 6 }}>
                  {memberName(task.assignedToId) && <span className="badge">{memberName(task.assignedToId)}</span>}
                  <button className="checkbox-btn" onClick={() => handleDelete(task)} aria-label="Supprimer">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setIsAdding(true)} aria-label="Ajouter une tâche">
        +
      </button>

      {isAdding && <TaskFormSheet onClose={() => setIsAdding(false)} />}
    </>
  )
}
