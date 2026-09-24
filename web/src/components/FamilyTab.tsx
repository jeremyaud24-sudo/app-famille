import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, MEMBER_COLOR_PALETTE, TAG_COLOR_PALETTE, newId } from '../db'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'
import { ROLE_LABELS, type EventTag, type FamilyMember, type FamilyRole } from '../models/types'

type SubTab = 'members' | 'tags'

export default function FamilyTab() {
  const [subTab, setSubTab] = useState<SubTab>('members')

  return (
    <>
      <h1 className="screen-title">Famille</h1>

      <div className="segmented" style={{ marginBottom: 14 }}>
        <button className={subTab === 'members' ? 'active' : ''} onClick={() => setSubTab('members')}>
          Membres
        </button>
        <button className={subTab === 'tags' ? 'active' : ''} onClick={() => setSubTab('tags')}>
          Tags
        </button>
      </div>

      {subTab === 'members' ? <MembersSection /> : <TagsSection />}
    </>
  )
}

function MembersSection() {
  const members = useLiveQuery(() => db.members.toArray(), [])
  const [isAdding, setIsAdding] = useState(false)
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null)
  const { showToast } = useToast()

  async function handleConfirmDelete() {
    if (!deletingMember) return
    await db.members.delete(deletingMember.id)
    showToast('Supprimé')
    setDeletingMember(null)
  }

  return (
    <>
      <div className="card-list">
        {members?.map((member) => (
          <div className="card" key={member.id}>
            <div className="card-row">
              <div className="card-row" style={{ gap: 10 }}>
                <span className="member-dot" style={{ background: member.colorHex }} />
                <span className="card-title">{member.name}</span>
              </div>
              <div className="card-row" style={{ gap: 6 }}>
                <span className="badge">{ROLE_LABELS[member.role]}</span>
                <button className="checkbox-btn" onClick={() => setDeletingMember(member)} aria-label="Supprimer">
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => setIsAdding(true)} aria-label="Ajouter un membre">
        +
      </button>

      {isAdding && <MemberFormSheet onClose={() => setIsAdding(false)} />}
      {deletingMember && (
        <ConfirmDialog
          title="Supprimer ce membre ?"
          message={`${deletingMember.name} sera retiré(e) de la famille. Ses RDV et tâches existants ne seront pas supprimés.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingMember(null)}
        />
      )}
    </>
  )
}

function TagsSection() {
  const tags = useLiveQuery(() => db.tags.toArray(), [])
  const [isAdding, setIsAdding] = useState(false)
  const [deletingTag, setDeletingTag] = useState<EventTag | null>(null)
  const { showToast } = useToast()

  async function handleConfirmDelete() {
    if (!deletingTag) return
    await db.tags.delete(deletingTag.id)
    await db.events.where('tagId').equals(deletingTag.id).modify({ tagId: undefined })
    showToast('Supprimé')
    setDeletingTag(null)
  }

  return (
    <>
      <p className="empty-state" style={{ display: tags?.length ? 'none' : 'block' }}>
        Crée un tag (ex : « École », rouge) pour colorer tes événements indépendamment du membre concerné.
      </p>

      <div className="card-list">
        {tags?.map((tag) => (
          <div className="card" key={tag.id}>
            <div className="card-row">
              <div className="card-row" style={{ gap: 10 }}>
                <span className="member-dot" style={{ background: tag.colorHex }} />
                <span className="card-title">{tag.name}</span>
              </div>
              <button className="checkbox-btn" onClick={() => setDeletingTag(tag)} aria-label="Supprimer">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => setIsAdding(true)} aria-label="Ajouter un tag">
        +
      </button>

      {isAdding && <TagFormSheet onClose={() => setIsAdding(false)} />}
      {deletingTag && (
        <ConfirmDialog
          title="Supprimer ce tag ?"
          message={`« ${deletingTag.name} » sera retiré de tous les événements concernés (sans les supprimer).`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTag(null)}
        />
      )}
    </>
  )
}

function MemberFormSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<FamilyRole>('enfant')
  const { showToast } = useToast()

  const canSave = name.trim().length > 0

  async function handleSave() {
    if (!canSave) return
    const color = MEMBER_COLOR_PALETTE[Math.floor(Math.random() * MEMBER_COLOR_PALETTE.length)]
    await db.members.add({ id: newId(), name: name.trim(), role, colorHex: color })
    showToast('Ajouté ✓')
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <button onClick={onClose}>Annuler</button>
          <h2>Nouveau membre</h2>
          <button onClick={handleSave} disabled={!canSave}>
            Ajouter
          </button>
        </div>

        <div className="field">
          <label>Prénom</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom" autoFocus />
        </div>

        <div className="field">
          <label>Rôle</label>
          <select value={role} onChange={(e) => setRole(e.target.value as FamilyRole)}>
            {(Object.keys(ROLE_LABELS) as FamilyRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function TagFormSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [colorHex, setColorHex] = useState(TAG_COLOR_PALETTE[0].hex)
  const { showToast } = useToast()

  const canSave = name.trim().length > 0

  async function handleSave() {
    if (!canSave) return
    await db.tags.add({ id: newId(), name: name.trim(), colorHex, createdAt: new Date() })
    showToast('Ajouté ✓')
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <button onClick={onClose}>Annuler</button>
          <h2>Nouveau tag</h2>
          <button onClick={handleSave} disabled={!canSave}>
            Ajouter
          </button>
        </div>

        <div className="field">
          <label>Nom</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : École" autoFocus />
        </div>

        <div className="field">
          <label>Couleur</label>
          <div className="color-swatch-grid">
            {TAG_COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                className={`color-swatch${colorHex === c.hex ? ' selected' : ''}`}
                style={{ background: c.hex }}
                aria-label={c.name}
                onClick={() => setColorHex(c.hex)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
