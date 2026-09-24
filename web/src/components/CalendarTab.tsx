import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import { cancelEventReminder } from '../notifications'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'
import EventFormSheet from './EventFormSheet'
import { BUCKET_LABELS, BUCKET_ORDER, groupByBucket } from '../utils/dayBuckets'
import type { FamilyEvent } from '../models/types'

const timeFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

export default function CalendarTab() {
  const [isAdding, setIsAdding] = useState(false)
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<FamilyEvent | null>(null)
  const { showToast } = useToast()

  const events = useLiveQuery(async () => {
    const all = await db.events.orderBy('startDate').toArray()
    return all.filter((e) => e.endDate.getTime() >= Date.now())
  }, [])

  const members = useLiveQuery(() => db.members.toArray(), [])

  function memberColor(id: string): string | undefined {
    return members?.find((m) => m.id === id)?.colorHex
  }

  async function handleConfirmDelete() {
    if (!deletingEvent) return
    cancelEventReminder(deletingEvent.id)
    await db.events.delete(deletingEvent.id)
    showToast('Supprimé')
    setDeletingEvent(null)
  }

  const groups = events ? groupByBucket(events, (e) => e.startDate, false) : null

  return (
    <>
      <h1 className="screen-title">Calendrier</h1>

      {events === undefined ? null : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>Aucun rendez-vous à venir.</p>
          <p>Ajoute votre premier RDV commun avec le bouton +.</p>
        </div>
      ) : (
        BUCKET_ORDER.filter((bucket) => groups?.get(bucket)?.length).map((bucket) => (
          <div key={bucket}>
            <div className="section-header">{BUCKET_LABELS[bucket]}</div>
            <div className="card-list">
              {groups!.get(bucket)!.map((event) => (
                <div className="card" key={event.id} onClick={() => setEditingEvent(event)}>
                  <div className="card-row">
                    <div className="card-row" style={{ gap: 8 }}>
                      <span className="member-dot" style={{ background: memberColor(event.ownerId) ?? '#ccc' }} />
                      <span className="card-title">{event.title}</span>
                    </div>
                    <div className="card-row" style={{ gap: 6 }}>
                      {event.visibility === 'personal' && <span className="badge">🔒 Perso</span>}
                      <button
                        className="checkbox-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingEvent(event)
                        }}
                        aria-label="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <span className="card-subtitle">
                    {event.isAllDay
                      ? dateFormatter.format(event.startDate)
                      : `${dateFormatter.format(event.startDate)} · ${timeFormatter.format(event.startDate)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={() => setIsAdding(true)} aria-label="Ajouter un RDV">
        +
      </button>

      {isAdding && <EventFormSheet onClose={() => setIsAdding(false)} />}
      {editingEvent && <EventFormSheet event={editingEvent} onClose={() => setEditingEvent(null)} />}
      {deletingEvent && (
        <ConfirmDialog
          title="Supprimer ce RDV ?"
          message={`« ${deletingEvent.title} » sera définitivement supprimé.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingEvent(null)}
        />
      )}
    </>
  )
}
