import { addDays } from '../../utils/calendarDates'
import { useOrientation } from '../../utils/useOrientation'
import DayColumnsView from './DayColumnsView'
import type { EventTag, FamilyEvent, FamilyMember } from '../../models/types'

/** Nombre de jours visibles à la fois selon l'orientation du téléphone —
 * comme Google Agenda qui montre plus de jours quand on penche l'écran. */
const DAYS_PORTRAIT = 1
const DAYS_LANDSCAPE = 3

export default function DayView({
  date,
  events,
  members,
  tags,
  onSelectEvent,
}: {
  date: Date
  events: FamilyEvent[]
  members: FamilyMember[]
  tags: EventTag[]
  onSelectEvent: (event: FamilyEvent) => void
}) {
  const orientation = useOrientation()
  const count = orientation === 'landscape' ? DAYS_LANDSCAPE : DAYS_PORTRAIT
  const days = Array.from({ length: count }, (_, i) => addDays(date, i))

  return <DayColumnsView days={days} events={events} members={members} tags={tags} onSelectEvent={onSelectEvent} />
}
