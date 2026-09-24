import { addDays, startOfWeek } from '../../utils/calendarDates'
import DayColumnsView from './DayColumnsView'
import type { FamilyEvent, FamilyMember } from '../../models/types'

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
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i))

  return (
    <DayColumnsView days={days} events={events} members={members} onSelectEvent={onSelectEvent} onSelectDay={onSelectDay} />
  )
}
