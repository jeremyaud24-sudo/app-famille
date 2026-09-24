import type { FamilyMember } from '../../models/types'

export default function CalendarFilters({
  members,
  isVisible,
  onToggle,
}: {
  members: FamilyMember[]
  isVisible: (id: string) => boolean
  onToggle: (id: string) => void
}) {
  if (members.length === 0) return null

  return (
    <div className="calendar-filters">
      {members.map((member) => {
        const active = isVisible(member.id)
        return (
          <button
            key={member.id}
            className={`filter-chip${active ? ' active' : ''}`}
            onClick={() => onToggle(member.id)}
            style={active ? { borderColor: member.colorHex } : undefined}
          >
            <span
              className="member-dot"
              style={{ background: active ? member.colorHex : 'var(--color-border)' }}
            />
            {member.name}
          </button>
        )
      })}
    </div>
  )
}
