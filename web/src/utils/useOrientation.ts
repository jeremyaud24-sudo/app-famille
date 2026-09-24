import { useEffect, useState } from 'react'

export type Orientation = 'portrait' | 'landscape'

function readOrientation(): Orientation {
  if (typeof window === 'undefined') return 'portrait'
  return window.matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait'
}

/**
 * Détecte l'orientation réelle du téléphone (pas seulement la largeur de
 * l'écran), pour adapter le nombre de jours visibles quand on penche le
 * téléphone — comme Google Agenda qui montre plus de jours en paysage.
 */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(() => readOrientation())

  useEffect(() => {
    const query = window.matchMedia('(orientation: landscape)')
    const update = () => setOrientation(query.matches ? 'landscape' : 'portrait')
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return orientation
}
