import { useEffect, useRef } from 'react'
import { addDays, isSameDay, SHORT_WEEKDAY_FORMATTER, startOfWeek } from '../../utils/calendarDates'
import { layoutDayEvents } from '../../utils/dayLayout'
import type { FamilyEvent, FamilyMember } from '../../models/types'

const HOUR_HEIGHT = 48
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function WeekView({
  date,
  events,
  members,
  onSelectEvent,
  onSelectDay,
}: {
  date: Date
  events: FamilyEvent[]
  members: FamilyMember[]
  onSelectEvent: (event: FamilyEvent) => void
  onSelectDay: (day: Date) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i))

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 7 * HOUR_HEIGHT })
  }, [date])

  function memberColor(id: string): string {
    return members.find((m) => m.id === id)?.colorHex ?? '#999'
  }

  return (
    <div className="week-view">
      <div className="week-header">
        <div className="hour-label-spacer" />
        {days.map((day) => (
          <button key={day.toISOString()} className="week-day-header" onClick={() => onSelectDay(day)}>
            <span className="week-day-name">{SHORT_WEEKDAY_FORMATTER.format(day)}</span>
            <span className={`week-day-number${isSameDay(day, new Date()) ? ' today' : ''}`}>{day.getDate()}</span>
          </button>
        ))}
      </div>

      <div className="hour-grid-scroll" ref={scrollRef}>
        <div className="week-grid" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          <div className="week-hour-labels">
            {HOURS.map((h) => (
              <div key={h} className="hour-row" style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
                <span className="hour-label">{h > 0 ? `${h}h` : ''}</span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(e.startDate, day) && !e.isAllDay)
            const positioned = layoutDayEvents(dayEvents)
            return (
              <div key={day.toISOString()} className="week-day-column">
                {HOURS.map((h) => (
                  <div key={h} className="week-hour-line" style={{ top: h * HOUR_HEIGHT }} />
                ))}
                {positioned.map(({ event, topMinutes, durationMinutes, column, columnCount }) => (
                  <button
                    key={event.id}
                    className="week-event"
                    style={{
                      top: (topMinutes / 60) * HOUR_HEIGHT,
                      height: Math.max((durationMinutes / 60) * HOUR_HEIGHT - 2, 16),
                      left: `calc(2% + (96% - 2%) * ${column / columnCount})`,
                      width: `calc(96% / ${columnCount} - 2px)`,
                      background: memberColor(event.ownerId),
                    }}
                    onClick={() => onSelectEvent(event)}
                    title={event.title}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
