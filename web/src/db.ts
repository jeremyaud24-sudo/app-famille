import Dexie, { type EntityTable } from 'dexie'
import type { FamilyEvent, FamilyMember, FamilyTask } from './models/types'

/**
 * Stockage local (IndexedDB via Dexie). Phase 1 du MVP : chaque téléphone a
 * ses propres données, sans synchro entre le tien et celui de ta femme —
 * voir README pour la phase 2 (backend de synchro partagé).
 */
export const db = new Dexie('appfamille') as Dexie & {
  members: EntityTable<FamilyMember, 'id'>
  events: EntityTable<FamilyEvent, 'id'>
  tasks: EntityTable<FamilyTask, 'id'>
}

db.version(1).stores({
  members: 'id, name',
  events: 'id, startDate, ownerId',
  tasks: 'id, dueDate, assignedToId, isCompleted',
})

export function newId(): string {
  return crypto.randomUUID()
}

/** Palette de couleurs pour distinguer chaque membre dans le calendrier. */
export const MEMBER_COLOR_PALETTE = ['#4A90D9', '#E27D60', '#85C1A5', '#C38DD9', '#E8B84B']

export async function seedDefaultMemberIfNeeded(): Promise<void> {
  const count = await db.members.count()
  if (count > 0) return
  await db.members.add({
    id: newId(),
    name: 'Moi',
    role: 'parent',
    colorHex: MEMBER_COLOR_PALETTE[0],
  })
}
