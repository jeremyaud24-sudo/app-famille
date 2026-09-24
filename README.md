# AppFamille

Application de planning familial partagé : calendrier commun, tâches
partagées avec rappels fiables.

## Choix technique : app web (PWA), pas d'app native

Le code vit dans [`web/`](web/README.md). C'est une **PWA** (Progressive Web
App) : un site web qui s'installe sur l'écran d'accueil de l'iPhone et se
comporte comme une vraie app, sans passer par l'App Store.

Ce choix a été fait parce qu'aucune des personnes qui développent ce projet
n'a de Mac ni de compte Apple Developer — deux prérequis obligatoires pour
compiler et distribuer une app iOS native. Une PWA n'a besoin d'aucun des
deux : elle se construit avec des outils web standards et s'installe
directement depuis Safari.

> Une première tentative en Swift/SwiftUI natif existe sur la branche
> `mvp/squelette-ios` (PR historique), abandonnée pour cette raison.

## Ce que fait ce premier squelette (phase 1)

- Calendrier : RDV communs ou personnels, récurrence simple (jour/semaine/mois/an)
- Tâches partagées : échéance, récurrence, personne assignée ; cocher une
  tâche récurrente la replanifie à la prochaine échéance
- Famille : ajout des membres avec un rôle (parent/enfant/invité)
- Installable sur l'écran d'accueil iPhone (bouton Partager > Sur l'écran
  d'accueil, dans Safari)

**Ça tourne en local sur un seul téléphone** (IndexedDB, sans synchro entre
les tiens). Les rappels ne sont fiables que pendant que l'app est ouverte —
un vrai rappel en arrière-plan demande un petit serveur de notifications
push, prévu en phase 2.

## Ce qui n'est pas encore fait (phase 2)

- **Synchro entre les deux iPhone** : nécessite un petit backend partagé
  (base de données + API), à héberger sur un service gratuit ou peu coûteux.
- **Rappels fiables en arrière-plan** : nécessite un serveur de Web Push
  (protocole VAPID), branché sur ce même backend.
- **Import des calendriers existants** (Google, Outlook).

## Développement

Voir [`web/README.md`](web/README.md).
