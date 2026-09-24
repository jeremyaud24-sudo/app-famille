import { useEffect, useRef } from 'react'
import { diffDays, HOUR_FORMATTER, isSameDay, SHORT_WEEKDAY_FORMATTER, spansMultipleDays } from '../../utils/calendarDates'
import { layoutDayEvents } from '../../utils/dayLayout'
import type { EventTag, FamilyEvent, FamilyMember } from '../../models/types'

interface DayBanner {
  event: FamilyEvent
  /** Colonne (0-based, dans `days`) où démarre la bannière — clippée à la vue visible. */
  startCol: number
  /** Nombre de colonnes couvertes, clippé à la vue visible. */
  span: number
}

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

  /**
   * Un événement qui déborde sur plusieurs jours (ex: 22h → 8h le lendemain)
   * n'a pas de sens dans la grille horaire, qui reprendrait alors les heures
   * du jour suivant : on l'affiche plutôt en bandeau "journée entière" en
   * haut, sans horaire, sur toute sa durée — jamais dans la grille.
   */
  const isBannerEvent = (e: FamilyEvent) => e.isAllDay || spansMultipleDays(e.startDate, e.endDate)

  const banners: DayBanner[] = events
    .filter(isBannerEvent)
    .map((event) => {
      const rawStart = diffDays(event.startDate, days[0])
      const rawEnd = diffDays(event.endDate, days[0])
      return { event, rawStart, rawEnd }
    })
    .filter(({ rawEnd, rawStart }) => rawEnd >= 0 && rawStart <= days.length - 1)
    .map(({ event, rawStart, rawEnd }) => {
      const startCol = Math.max(rawStart, 0)
      const endCol = Math.min(rawEnd, days.length - 1)
      return { event, startCol, span: endCol - startCol + 1 }
    })

  const bannersByStartCol = new Map<number, DayBanner[]>()
  for (const banner of banners) {
    const list = bannersByStartCol.get(banner.startCol) ?? []
    list.push(banner)
    bannersByStartCol.set(banner.startCol, list)
  }

  // Largeur totale de la grille : la place que prendraient toutes les
  // colonnes à leur largeur minimale, jamais moins que 100% de l'écran.
  const contentWidth = `max(100%, ${HOUR_LABEL_WIDTH + days.length * MIN_COLUMN_WIDTH}px)`

  return (
    <div className="day-columns-view">
      {/* En-tête, bandeau "journée entière" et grille partagent le même
          défilement horizontal, pour que les jours restent alignés avec
          leur colonne quel que soit l'écran — jamais empilés verticalement. */}
      <div className="hour-grid-scroll-x">
        <div className="day-columns-sizer" style={{ width: contentWidth }}>
          {banners.length > 0 && (
            <div className="all-day-row">
              <div className="hour-label-spacer" style={{ width: HOUR_LABEL_WIDTH }} />
              {days.map((day, i) => (
                <div key={day.toISOString()} className="all-day-cell" style={{ minWidth: MIN_COLUMN_WIDTH }}>
                  {(bannersByStartCol.get(i) ?? []).map(({ event, span }) => (
                    <button
                      key={event.id}
                      className="all-day-chip"
                      style={{
                        width: `calc(${span * 100}% + ${(span - 1) * 1}px)`,
                        background: eventColor(event),
                      }}
                      onClick={() => onSelectEvent(event)}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

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
                const dayEvents = events.filter((e) => isSameDay(e.startDate, day) && !isBannerEvent(e))
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
