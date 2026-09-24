import { useEffect, useState } from 'react'

const STORAGE_KEY = 'appfamille.hiddenMemberIds'

function readStored(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const ids = JSON.parse(raw)
    return Array.isArray(ids) ? new Set(ids) : new Set()
  } catch {
    return new Set()
  }
}

function writeStored(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Stockage indisponible (navigation privée, quota) : la préférence ne
    // survivra pas à un rechargement, mais l'app doit continuer à marcher.
  }
}

/**
 * Mémorise, par appareil, quels "calendriers" (membres) sont décochés —
 * comme la liste de calendriers de Google Agenda. C'est une préférence
 * d'affichage locale, pas une donnée à synchroniser entre les téléphones.
 */
export function useCalendarFilter() {
  const [hiddenMemberIds, setHiddenMemberIds] = useState<Set<string>>(() => readStored())

  useEffect(() => {
    writeStored(hiddenMemberIds)
  }, [hiddenMemberIds])

  function toggle(memberId: string) {
    setHiddenMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  function isVisible(memberId: string): boolean {
    return !hiddenMemberIds.has(memberId)
  }

  return { hiddenMemberIds, toggle, isVisible }
}
