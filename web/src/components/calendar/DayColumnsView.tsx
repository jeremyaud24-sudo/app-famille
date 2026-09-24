import { useEffect, useRef } from 'react'
import { HOUR_FORMATTER, isSameDay, SHORT_WEEKDAY_FORMATTER } from '../../utils/calendarDates'
import { layoutDayEvents } from '../../utils/dayLayout'
import type { EventTag, FamilyEvent, FamilyMember } from '../../models/types'

const HOUR_HEIGHT = 56
const HOURS = Array.from({ length: 24 }, (_, i) => i)
/** Largeur minimale d'une colonne-jour : en dessous, on préfère faire
 * défiler horizontalement plutôt que d'écraser les colonnes au point de
 * les rendre illisibles (et jamais les empiler verticalement). */
const MIN_COLUMN_WIDTH = 84
const HOUR_LABEL_WIDTH = 40

export default function DayColumnsView({
  days,
  events,
  members,
  tags,
  onSelectEvent,
  onSelectDay,
}: {
  days: Date[]
  events: FamilyEvent[]
  members: FamilyMember[]
  tags: EventTag[]
  onSelectEvent: (event: FamilyEvent) => void
  onSelectDay?: (day: Date) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const showHeader = days.length > 1

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 7 * HOUR_HEIGHT })
  }, [days.length ? days[0].toDateString() : ''])

  /** Le tag choisi sur l'événement prime sur la couleur du membre, pour
   * pouvoir distinguer par exemple "École" de "Sport" au premier coup d'œil. */
  function eventColor(event: FamilyEvent): string {
    const tagColor = event.tagId && tags.find((t) => t.id === event.tagId)?.colorHex
    if (tagColor) return tagColor
    return members.find((m) => m.id === event.ownerId)?.colorHex ?? '#999'
  }

  const today = new Date()
  const nowMinutes = today.getHours() * 60 + today.getMinutes()

  const allDayEvents = days.flatMap((day) => events.filter((e) => isSameDay(e.startDate, day) && e.isAllDay))

  // Largeur totale de la grille : la place que prendraient toutes les
  // colonnes à leur largeur minimale, jamais moins que 100% de l'écran.
  const contentWidth = `max(100%, ${HOUR_LABEL_WIDTH + days.length * MIN_COLUMN_WIDTH}px)`

  return (
    <div className="day-columns-view">
      {allDayEvents.length > 0 && (
        <div className="all-day-row">
          {allDayEvents.map((event) => (
            <button
              key={event.id}
              className="all-day-chip"
              style={{ background: eventColor(event) }}
              onClick={() => onSelectEvent(event)}
            >
              {event.title}
            </button>
          ))}
        </div>
      )}

      {/* En-tête et grille partagent le même défilement horizontal, pour
          que les jours restent alignés avec leur colonne quel que soit
          l'écran — jamais empilés verticalement. */}
      <div className="hour-grid-scroll-x">
        <div className="day-columns-sizer" style={{ width: contentWidth }}>
          {showHeader && (
            <div className="week-header">
              <div className="hour-label-spacer" style={{ width: HOUR_LABEL_WIDTH }} />
              {days.map((day) => (
                <button
                  key={day.toISOString()}
                  className="week-day-header"
                  style={{ minWidth: MIN_COLUMN_WIDTH }}
                  onClick={() => onSelectDay?.(day)}
                  disabled={!onSelectDay}
                >
                  <span className="week-day-name">{SHORT_WEEKDAY_FORMATTER.format(day)}</span>
                  <span className={`week-day-number${isSameDay(day, today) ? ' today' : ''}`}>{day.getDate()}</span>
                </button>
              ))}
            </div>
          )}

          <div className="hour-grid-scroll" ref={scrollRef}>
            <div className="day-columns-grid" style={{ height: HOURS.length * HOUR_HEIGHT }}>
              <div className="week-hour-labels" style={{ width: HOUR_LABEL_WIDTH }}>
                {HOURS.map((h) => (
                  <div key={h} className="hour-row" style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
                    <span className="hour-label">{h > 0 ? `${h}h` : ''}</span>
                  </div>
                ))}
              </div>

              {days.map((day) => {
                const dayEvents = events.filter((e) => isSameDay(e.startDate, day) && !e.isAllDay)
                const positioned = layoutDayEvents(dayEvents)
                const isToday = isSameDay(day, today)

                return (
                  <div key={day.toISOString()} className="day-column" style={{ minWidth: MIN_COLUMN_WIDTH }}>
                    {HOURS.map((h) => (
                      <div key={h} className="week-hour-line" style={{ top: h * HOUR_HEIGHT }} />
                    ))}

                    {isToday && (
                      <div className="now-line" style={{ top: (nowMinutes / 60) * HOUR_HEIGHT, left: 0 }}>
                        <span className="now-dot" />
                      </div>
                    )}

                    {positioned.map(({ event, topMinutes, durationMinutes, column, columnCount }) => (
                      <button
                        key={event.id}
                        className="day-event"
                        style={{
                          top: (topMinutes / 60) * HOUR_HEIGHT,
                          height: Math.max((durationMinutes / 60) * HOUR_HEIGHT - 2, 18),
                          left: `calc(2% + 96% * ${column / columnCount})`,
                          width: `calc(96% / ${columnCount} - 3px)`,
                          background: eventColor(event),
                        }}
                        onClick={() => onSelectEvent(event)}
                      >
                        <span className="day-event-title">{event.title}</span>
                        {days.length === 1 && (
                          <span className="day-event-time">{HOUR_FORMATTER.format(event.startDate)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
