/**
 * Règle de récurrence simple pour le MVP : on couvre les cas les plus
 * fréquents d'une famille (poubelles chaque semaine, loyer chaque mois...)
 * sans viser la complexité complète d'iCalendar (RFC 5545) — on pourra
 * l'étendre plus tard si besoin.
 */
export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  none: 'Ne se répète pas',
  daily: 'Tous les jours',
  weekly: 'Toutes les semaines',
  monthly: 'Tous les mois',
  yearly: 'Tous les ans',
}

export const RECURRENCE_OPTIONS: RecurrenceRule[] = ['none', 'daily', 'weekly', 'monthly', 'yearly']

/** Calcule la prochaine occurrence après `date`, ou null si la règle est 'none'. */
export function nextOccurrence(rule: RecurrenceRule, date: Date): Date | null {
  const next = new Date(date)
  switch (rule) {
    case 'none':
      return null
    case 'daily':
      next.setDate(next.getDate() + 1)
      return next
    case 'weekly':
      next.setDate(next.getDate() + 7)
      return next
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      return next
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      return next
  }
}
