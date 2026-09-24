import { useEffect, useRef } from 'react'
import { HOUR_FORMATTER, isSameDay } from '../../utils/calendarDates'
import { layoutDayEvents } from '../../utils/dayLayout'
import type { FamilyEvent, FamilyMember } from '../../models/types'

const HOUR_HEIGHT = 56
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function DayView({
  date,
  events,
  members,
  onSelectEvent,
}: {
  date: Date
  events: FamilyEvent[]
  members: FamilyMember[]
  onSelectEvent: (event: FamilyEvent) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 7 * HOUR_HEIGHT })
  }, [date])

  const dayEvents = events.filter((e) => isSameDay(e.startDate, date) && !e.isAllDay)
  const allDayEvents = events.filter((e) => isSameDay(e.startDate, date) && e.isAllDay)
  const positioned = layoutDayEvents(dayEvents)

  function memberColor(id: string): string {
    return members.find((m) => m.id === id)?.colorHex ?? '#999'
  }

  const isToday = isSameDay(date, new Date())
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()

  return (
    <div className="day-view">
      {allDayEvents.length > 0 && (
        <div className="all-day-row">
          {allDayEvents.map((event) => (
            <button
              key={event.id}
              className="all-day-chip"
              style={{ background: memberColor(event.ownerId) }}
              onClick={() => onSelectEvent(event)}
            >
              {event.title}
            </button>
          ))}
        </div>
      )}

      <div className="hour-grid-scroll" ref={scrollRef}>
        <div className="hour-grid" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {HOURS.map((h) => (
            <div key={h} className="hour-row" style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
              <span className="hour-label">{h > 0 ? `${h}h` : ''}</span>
            </div>
          ))}

          {isToday && (
            <div className="now-line" style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}>
              <span className="now-dot" />
            </div>
          )}

          {positioned.map(({ event, topMinutes, durationMinutes, column, columnCount }) => (
            <button
              key={event.id}
              className="day-event"
              style={{
                top: (topMinutes / 60) * HOUR_HEIGHT,
                height: (durationMinutes / 60) * HOUR_HEIGHT - 2,
                left: `calc(56px + (100% - 56px) * ${column / columnCount})`,
                width: `calc((100% - 56px) / ${columnCount} - 4px)`,
                background: memberColor(event.ownerId),
              }}
              onClick={() => onSelectEvent(event)}
            >
              <span className="day-event-title">{event.title}</span>
              <span className="day-event-time">{HOUR_FORMATTER.format(event.startDate)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
