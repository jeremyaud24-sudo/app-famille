import { isSameDay, monthGrid, WEEKDAY_LABELS } from '../../utils/calendarDates'
import type { FamilyEvent, FamilyMember } from '../../models/types'

const MAX_DOTS_PER_DAY = 3

export default function MonthView({
  date,
  events,
  members,
  onSelectDay,
}: {
  date: Date
  events: FamilyEvent[]
  members: FamilyMember[]
  onSelectDay: (day: Date) => void
}) {
  const days = monthGrid(date)
  const currentMonth = date.getMonth()
  const today = new Date()

  function memberColor(id: string): string {
    return members.find((m) => m.id === id)?.colorHex ?? '#999'
  }

  function eventsForDay(day: Date): FamilyEvent[] {
    return events.filter((e) => isSameDay(e.startDate, day))
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
                  <span key={e.id} className="month-dot" style={{ background: memberColor(e.ownerId) }} />
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
