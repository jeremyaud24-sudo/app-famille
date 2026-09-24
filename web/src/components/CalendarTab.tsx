import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import { cancelEventReminder } from '../notifications'
import EventFormSheet from './EventFormSheet'
import type { FamilyEvent } from '../models/types'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export default function CalendarTab() {
  const [isAdding, setIsAdding] = useState(false)

  const events = useLiveQuery(async () => {
    const all = await db.events.orderBy('startDate').toArray()
    return all.filter((e) => e.endDate.getTime() >= Date.now())
  }, [])

  async function handleDelete(event: FamilyEvent) {
    cancelEventReminder(event.id)
    await db.events.delete(event.id)
  }

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
        <div className="card-list">
          {events.map((event) => (
            <div className="card" key={event.id}>
              <div className="card-row">
                <span className="card-title">{event.title}</span>
                <div className="card-row" style={{ gap: 6 }}>
                  {event.visibility === 'personal' && <span className="badge">🔒 Perso</span>}
                  <button className="checkbox-btn" onClick={() => handleDelete(event)} aria-label="Supprimer">
                    ✕
                  </button>
                </div>
              </div>
              <span className="card-subtitle">
                {event.isAllDay
                  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(event.startDate)
                  : dateFormatter.format(event.startDate)}
              </span>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setIsAdding(true)} aria-label="Ajouter un RDV">
        +
      </button>

      {isAdding && <EventFormSheet onClose={() => setIsAdding(false)} />}
    </>
  )
}
