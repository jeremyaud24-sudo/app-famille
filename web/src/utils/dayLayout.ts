import type { FamilyEvent } from '../models/types'

export interface PositionedEvent {
  event: FamilyEvent
  /** Position verticale en minutes depuis minuit. */
  topMinutes: number
  /** Durée en minutes (minimum imposé pour rester lisible). */
  durationMinutes: number
  /** Index de colonne parmi les événements qui se chevauchent. */
  column: number
  /** Nombre total de colonnes pour ce groupe de chevauchement. */
  columnCount: number
}

const MIN_DURATION_MINUTES = 30

/**
 * Positionne des événements d'une même journée sur une grille horaire,
 * façon Google Agenda : les événements qui se chevauchent dans le temps
 * sont placés côte à côte plutôt que superposés.
 */
export function layoutDayEvents(events: FamilyEvent[]): PositionedEvent[] {
  const withMinutes = events
    .map((event) => {
      const top = event.startDate.getHours() * 60 + event.startDate.getMinutes()
      const rawDuration = Math.max(0, (event.endDate.getTime() - event.startDate.getTime()) / 60_000)
      return { event, topMinutes: top, durationMinutes: Math.max(rawDuration, MIN_DURATION_MINUTES) }
    })
    .sort((a, b) => a.topMinutes - b.topMinutes)

  const positioned: PositionedEvent[] = []
  let cluster: (typeof withMinutes)[number][] = []
  let clusterEnd = -1

  function flushCluster() {
    if (cluster.length === 0) return
    // Attribution gloutonne des colonnes : chaque événement prend la
    // première colonne libre à son heure de début.
    const columnEnds: number[] = []
    const assigned: { item: (typeof withMinutes)[number]; column: number }[] = []

    for (const item of cluster) {
      let column = columnEnds.findIndex((end) => end <= item.topMinutes)
      if (column === -1) {
        column = columnEnds.length
        columnEnds.push(0)
      }
      columnEnds[column] = item.topMinutes + item.durationMinutes
      assigned.push({ item, column })
    }

    const columnCount = columnEnds.length
    for (const { item, column } of assigned) {
      positioned.push({ ...item, column, columnCount })
    }
    cluster = []
  }

  for (const item of withMinutes) {
    if (cluster.length > 0 && item.topMinutes >= clusterEnd) {
      flushCluster()
      clusterEnd = -1
    }
    cluster.push(item)
    clusterEnd = Math.max(clusterEnd, item.topMinutes + item.durationMinutes)
  }
  flushCluster()

  return positioned
}
