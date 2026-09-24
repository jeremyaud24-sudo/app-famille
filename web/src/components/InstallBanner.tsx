import { useEffect, useState } from 'react'

function isStandalone(): boolean {
  // iOS Safari expose navigator.standalone ; les autres navigateurs utilisent
  // le media query display-mode. On vérifie les deux pour ne pas afficher le
  // bandeau une fois l'app déjà installée sur l'écran d'accueil.
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

export default function InstallBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [standalone, setStandalone] = useState(true)

  useEffect(() => {
    setStandalone(isStandalone())
  }, [])

  if (standalone || dismissed) return null

  return (
    <div className="install-banner" onClick={() => setDismissed(true)}>
      💡 Pour des rappels fiables : appuie sur le bouton Partager de Safari, puis
      « Sur l'écran d'accueil ». (Toucher pour masquer)
    </div>
  )
}
