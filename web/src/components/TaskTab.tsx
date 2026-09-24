import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import { nextOccurrence } from '../models/recurrence'
import { cancelTaskReminder, scheduleTaskReminder } from '../notifications'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'
import TaskFormSheet from './TaskFormSheet'
import { BUCKET_LABELS, BUCKET_ORDER, groupByBucket } from '../utils/dayBuckets'
import type { FamilyTask } from '../models/types'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

export default function TaskTab() {
  const [isAdding, setIsAdding] = useState(false)
  const [editingTask, setEditingTask] = useState<FamilyTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<FamilyTask | null>(null)
  const { showToast } = useToast()

  const tasks = useLiveQuery(async () => {
    const all = await db.tasks.orderBy('dueDate').toArray()
    return all.filter((t) => !t.isCompleted)
  }, [])

  const members = useLiveQuery(() => db.members.toArray(), [])

  function member(id?: string) {
    return members?.find((m) => m.id === id)
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
      showToast('Fait — replanifiée ✓')
    } else {
      await db.tasks.update(task.id, { isCompleted: true })
      cancelTaskReminder(task.id)
      showToast('Fait ✓')
    }
  }

  async function handleConfirmDelete() {
    if (!deletingTask) return
    cancelTaskReminder(deletingTask.id)
    await db.tasks.delete(deletingTask.id)
    showToast('Supprimée')
    setDeletingTask(null)
  }

  const groups = tasks ? groupByBucket(tasks, (t) => t.dueDate, true) : null

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
        BUCKET_ORDER.filter((bucket) => groups?.get(bucket)?.length).map((bucket) => (
          <div key={bucket}>
            <div className={`section-header${bucket === 'overdue' ? ' overdue' : ''}`}>{BUCKET_LABELS[bucket]}</div>
            <div className="card-list">
              {groups!.get(bucket)!.map((task) => (
                <div className="card" key={task.id} onClick={() => setEditingTask(task)}>
                  <div className="card-row">
                    <div className="card-row" style={{ gap: 10 }}>
                      <button
                        className="checkbox-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggle(task)
                        }}
                        aria-label="Marquer comme fait"
                      >
                        ○
                      </button>
                      <div>
                        <div className={`card-title${bucket === 'overdue' ? ' overdue' : ''}`}>{task.title}</div>
                        {task.dueDate && <div className="card-subtitle">{dateFormatter.format(task.dueDate)}</div>}
                      </div>
                    </div>
                    <div className="card-row" style={{ gap: 6 }}>
                      {member(task.assignedToId) && (
                        <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span className="member-dot" style={{ background: member(task.assignedToId)!.colorHex }} />
                          {member(task.assignedToId)!.name}
                        </span>
                      )}
                      <button
                        className="checkbox-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingTask(task)
                        }}
                        aria-label="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={() => setIsAdding(true)} aria-label="Ajouter une tâche">
        +
      </button>

      {isAdding && <TaskFormSheet onClose={() => setIsAdding(false)} />}
      {editingTask && <TaskFormSheet task={editingTask} onClose={() => setEditingTask(null)} />}
      {deletingTask && (
        <ConfirmDialog
          title="Supprimer cette tâche ?"
          message={`« ${deletingTask.title} » sera définitivement supprimée.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </>
  )
}
