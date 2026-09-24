import type { RecurrenceRule } from './recurrence'

/**
 * Le rôle détermine ce qu'un membre peut faire dans l'app.
 * - parent: peut créer/modifier tout événement ou tâche.
 * - enfant: peut voir tout, cocher ses propres tâches.
 * - invite: accès en lecture seule (ex: baby-sitter, grand-parent de passage).
 */
export type FamilyRole = 'parent' | 'enfant' | 'invite'

export const ROLE_LABELS: Record<FamilyRole, string> = {
  parent: 'Parent',
  enfant: 'Enfant',
  invite: 'Invité',
}

export interface FamilyMember {
  id: string
  name: string
  role: FamilyRole
  colorHex: string
}

export type EventVisibility = 'shared' | 'personal'

export interface FamilyEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  isAllDay: boolean
  recurrence: RecurrenceRule
  visibility: EventVisibility
  notes?: string
  ownerId: string
  createdAt: Date
}

export interface FamilyTask {
  id: string
  title: string
  dueDate?: Date
  recurrence: RecurrenceRule
  isCompleted: boolean
  notes?: string
  assignedToId?: string
  createdById: string
  createdAt: Date
}
