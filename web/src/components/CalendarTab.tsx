import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import EventFormSheet from './EventFormSheet'
import CalendarFilters from './calendar/CalendarFilters'
import DayView from './calendar/DayView'
import WeekView from './calendar/WeekView'
import MonthView from './calendar/MonthView'
import { useCalendarFilter } from '../utils/useCalendarFilter'
import {
  addDays,
  DAY_MONTH_FORMATTER,
  MONTH_YEAR_FORMATTER,
  startOfWeek,
  WEEKDAY_DAY_FORMATTER,
} from '../utils/calendarDates'
import type { FamilyEvent } from '../models/types'

type ViewMode = 'day' | 'week' | 'month'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function headerLabel(mode: ViewMode, date: Date): string {
  if (mode === 'day') return capitalize(WEEKDAY_DAY_FORMATTER.format(date))
  if (mode === 'month') return capitalize(MONTH_YEAR_FORMATTER.format(date))
  const start = startOfWeek(date)
  const end = addDays(start, 6)
  return `${DAY_MONTH_FORMATTER.format(start)} – ${DAY_MONTH_FORMATTER.format(end)}`
}

function shiftDate(mode: ViewMode, date: Date, direction: 1 | -1): Date {
  if (mode === 'day') return addDays(date, direction)
  if (mode === 'week') return addDays(date, 7 * direction)
  const next = new Date(date)
  next.setMonth(next.getMonth() + direction)
  return next
}

export default function CalendarTab() {
  const [mode, setMode] = useState<ViewMode>('week')
  const [current, setCurrent] = useState(() => new Date())
  const [isAdding, setIsAdding] = useState(false)
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { isVisible, toggle } = useCalendarFilter()

  const allEvents = useLiveQuery(() => db.events.toArray(), [])
  const members = useLiveQuery(() => db.members.toArray(), [])

  const visibleEvents = (allEvents ?? []).filter((e) => isVisible(e.ownerId))

  return (
    <div className="calendar-tab">
      <div className="calendar-toolbar">
        <h1 className="screen-title" style={{ marginBottom: 0 }}>
          Calendrier
        </h1>
        <button className="filter-toggle" onClick={() => setFiltersOpen((v) => !v)} aria-label="Filtrer les calendriers">
          🗂️
        </button>
      </div>

      {filtersOpen && members && (
        <CalendarFilters members={members} isVisible={isVisible} onToggle={toggle} />
      )}

      <div className="calendar-nav">
        <button className="nav-arrow" onClick={() => setCurrent((d) => shiftDate(mode, d, -1))} aria-label="Précédent">
          ‹
        </button>
        <button className="nav-label" onClick={() => setCurrent(new Date())}>
          {headerLabel(mode, current)}
        </button>
        <button className="nav-arrow" onClick={() => setCurrent((d) => shiftDate(mode, d, 1))} aria-label="Suivant">
          ›
        </button>
      </div>

      <div className="segmented view-switch">
        <button className={mode === 'day' ? 'active' : ''} onClick={() => setMode('day')}>
          Jour
        </button>
        <button className={mode === 'week' ? 'active' : ''} onClick={() => setMode('week')}>
          Semaine
        </button>
        <button className={mode === 'month' ? 'active' : ''} onClick={() => setMode('month')}>
          Mois
        </button>
      </div>

      <div className="calendar-view-area">
        {mode === 'day' && (
          <DayView date={current} events={visibleEvents} members={members ?? []} onSelectEvent={setEditingEvent} />
        )}
        {mode === 'week' && (
          <WeekView
            date={current}
            events={visibleEvents}
            members={members ?? []}
            onSelectEvent={setEditingEvent}
            onSelectDay={(day) => {
              setCurrent(day)
              setMode('day')
            }}
          />
        )}
        {mode === 'month' && (
          <MonthView
            date={current}
            events={visibleEvents}
            members={members ?? []}
            onSelectDay={(day) => {
              setCurrent(day)
              setMode('day')
            }}
          />
        )}
      </div>

      <button className="fab" onClick={() => setIsAdding(true)} aria-label="Ajouter un RDV">
        +
      </button>

      {isAdding && <EventFormSheet onClose={() => setIsAdding(false)} />}
      {editingEvent && <EventFormSheet event={editingEvent} onClose={() => setEditingEvent(null)} />}
    </div>
  )
}
