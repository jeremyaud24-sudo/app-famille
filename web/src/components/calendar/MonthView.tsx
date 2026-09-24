import { isSameDay, monthGrid, startOfDay, WEEKDAY_LABELS } from '../../utils/calendarDates'
import type { EventTag, FamilyEvent, FamilyMember } from '../../models/types'

const MAX_DOTS_PER_DAY = 3

export default function MonthView({
  date,
  events,
  members,
  tags,
  onSelectDay,
}: {
  date: Date
  events: FamilyEvent[]
  members: FamilyMember[]
  tags: EventTag[]
  onSelectDay: (day: Date) => void
}) {
  const days = monthGrid(date)
  const currentMonth = date.getMonth()
  const today = new Date()

  function eventColor(event: FamilyEvent): string {
    const tagColor = event.tagId && tags.find((t) => t.id === event.tagId)?.colorHex
    if (tagColor) return tagColor
    return members.find((m) => m.id === event.ownerId)?.colorHex ?? '#999'
  }

  /** Un événement à cheval sur plusieurs jours (ex: un séjour) doit
   * apparaître chaque jour qu'il couvre, pas seulement à son jour de début. */
  function eventsForDay(day: Date): FamilyEvent[] {
    const dayTime = startOfDay(day).getTime()
    return events.filter((e) => dayTime >= startOfDay(e.startDate).getTime() && dayTime <= startOfDay(e.endDate).getTime())
  }

  return (
    <div className="month-view">
      <div className="month-weekday-row">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="month-weekday-label">
            {label}
          </span>
        ))}
      </div>
      <div className="month-grid">
        {days.map((day) => {
          const dayEvents = eventsForDay(day)
          const isCurrentMonth = day.getMonth() === currentMonth
          const isToday = isSameDay(day, today)

          return (
            <button
              key={day.toISOString()}
              className={`month-cell${isCurrentMonth ? '' : ' outside'}${isToday ? ' today' : ''}`}
              onClick={() => onSelectDay(day)}
            >
              <span className="month-cell-number">{day.getDate()}</span>
              <span className="month-cell-dots">
                {dayEvents.slice(0, MAX_DOTS_PER_DAY).map((e) => (
                  <span key={e.id} className="month-dot" style={{ background: eventColor(e) }} />
                ))}
                {dayEvents.length > MAX_DOTS_PER_DAY && (
                  <span className="month-more">+{dayEvents.length - MAX_DOTS_PER_DAY}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
