/**
 * Utilitaires de dates pour les vues Jour/Semaine/Mois, en semaine
 * commençant le lundi (convention française).
 */

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Nombre de jours (calendaires) entre `a` et `b`, positif si `a` est après `b`. */
export function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000)
}

/** Un événement chevauche-t-il plusieurs jours calendaires ? */
export function spansMultipleDays(start: Date, end: Date): boolean {
  return !isSameDay(start, end)
}

/** Lundi de la semaine contenant `date`. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay() // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Grille du mois : toujours 6 semaines (42 jours) débutant un lundi, pour
 * un layout stable qui ne saute pas de hauteur d'un mois à l'autre.
 */
export function monthGrid(date: Date): Date[] {
  const firstOfMonth = startOfMonth(date)
  const gridStart = startOfWeek(firstOfMonth)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
export const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })
export const WEEKDAY_DAY_FORMATTER = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
export const SHORT_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
export const HOUR_FORMATTER = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
