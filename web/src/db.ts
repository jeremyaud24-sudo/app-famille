import Dexie, { type EntityTable } from 'dexie'
import type { EventTag, FamilyEvent, FamilyMember, FamilyTask } from './models/types'

/**
 * Stockage local (IndexedDB via Dexie). Phase 1 du MVP : chaque téléphone a
 * ses propres données, sans synchro entre le tien et celui de ta femme —
 * voir README pour la phase 2 (backend de synchro partagé).
 */
export const db = new Dexie('appfamille') as Dexie & {
  members: EntityTable<FamilyMember, 'id'>
  events: EntityTable<FamilyEvent, 'id'>
  tasks: EntityTable<FamilyTask, 'id'>
  tags: EntityTable<EventTag, 'id'>
}

db.version(1).stores({
  members: 'id, name',
  events: 'id, startDate, ownerId',
  tasks: 'id, dueDate, assignedToId, isCompleted',
})

db.version(2).stores({
  members: 'id, name',
  events: 'id, startDate, ownerId, tagId',
  tasks: 'id, dueDate, assignedToId, isCompleted',
  tags: 'id, name',
})

export function newId(): string {
  return crypto.randomUUID()
}

/** Palette de couleurs pour distinguer chaque membre dans le calendrier. */
export const MEMBER_COLOR_PALETTE = ['#4A90D9', '#E27D60', '#85C1A5', '#C38DD9', '#E8B84B']

/**
 * Palette proposée pour les tags : des couleurs nommées et reconnaissables
 * (contrairement aux couleurs de membres, choisies au hasard), pour que
 * l'utilisateur puisse dire "le tag rouge" et s'y retrouver.
 */
export const TAG_COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: 'Rouge', hex: '#D93025' },
  { name: 'Orange', hex: '#E8710A' },
  { name: 'Jaune', hex: '#F2B400' },
  { name: 'Vert', hex: '#188038' },
  { name: 'Turquoise', hex: '#12958F' },
  { name: 'Bleu', hex: '#1A73E8' },
  { name: 'Violet', hex: '#8E24AA' },
  { name: 'Rose', hex: '#D5368C' },
  { name: 'Marron', hex: '#795548' },
  { name: 'Gris', hex: '#616161' },
]

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
