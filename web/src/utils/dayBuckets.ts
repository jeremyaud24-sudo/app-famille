/**
 * Regroupe les éléments datés en catégories lisibles d'un coup d'œil,
 * dans l'esprit "utilisable en 10 secondes" : une simple liste
 * chronologique oblige à lire chaque ligne, un regroupement par période
 * permet de scanner directement la bonne section.
 */
export type DayBucket = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'none'

export const BUCKET_ORDER: DayBucket[] = ['overdue', 'today', 'tomorrow', 'week', 'later', 'none']

export const BUCKET_LABELS: Record<DayBucket, string> = {
  overdue: 'En retard',
  today: "Aujourd'hui",
  tomorrow: 'Demain',
  week: 'Cette semaine',
  later: 'Plus tard',
  none: 'Sans date',
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * `allowOverdue` : pour un événement déjà passé on ne veut pas le classer
 * "en retard" (un RDV d'hier n'est pas "en retard", il est juste terminé —
 * de toute façon la liste ne montre que les événements à venir). Pour une
 * tâche en revanche, une échéance dépassée doit ressortir clairement.
 */
export function bucketFor(date: Date | undefined, allowOverdue: boolean): DayBucket {
  if (!date) return 'none'

  const today = startOfDay(new Date())
  const target = startOfDay(date)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000)

  if (diffDays < 0) return allowOverdue ? 'overdue' : 'today'
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays <= 7) return 'week'
  return 'later'
}

export function groupByBucket<T>(items: T[], getDate: (item: T) => Date | undefined, allowOverdue: boolean): Map<DayBucket, T[]> {
  const groups = new Map<DayBucket, T[]>()
  for (const item of items) {
    const bucket = bucketFor(getDate(item), allowOverdue)
    const list = groups.get(bucket) ?? []
    list.push(item)
    groups.set(bucket, list)
  }
  return groups
}
