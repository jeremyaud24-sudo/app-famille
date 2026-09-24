import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, MEMBER_COLOR_PALETTE, newId } from '../db'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'
import { ROLE_LABELS, type FamilyMember, type FamilyRole } from '../models/types'

export default function FamilyTab() {
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
      <h1 className="screen-title">Famille</h1>

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
