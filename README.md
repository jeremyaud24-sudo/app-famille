# AppFamille

Application iOS de planning familial partagé : calendrier commun + personnel,
rôles parent/enfant/invité, tâches partagées avec rappels fiables.

## Ce que fait ce premier squelette (phase 1)

- Calendrier : ajouter des RDV communs ou personnels, avec récurrence simple
  (jamais / jour / semaine / mois / an).
- Tâches : ajouter une tâche avec échéance, récurrence et une personne
  assignée ; cocher une tâche récurrente la replanifie automatiquement à la
  prochaine échéance au lieu de la clôturer.
- Rappels : une notification locale est programmée à l'heure du RDV ou de
  l'échéance de la tâche, et retirée/remplacée proprement si tu modifies ou
  supprimes l'élément.
- Famille : ajouter les membres (toi, ta femme, plus tard les enfants) avec
  un rôle.

**Ce premier squelette tourne en local sur un seul téléphone** (SwiftData,
sans synchro). C'est volontaire : je n'ai pas de Mac/Xcode dans cette session
cloud pour compiler et tester, donc je préfère te livrer une base saine que
tu peux ouvrir et faire tourner toi-même avant qu'on branche la synchro
CloudKit entre ton iPhone et celui de ta femme (voir plus bas).

## Ce qui n'est pas encore fait

- **Synchro entre vos deux iPhone** : prochaine étape, une fois que tu as
  confirmé que ce squelette compile et s'ouvre bien chez toi. Ça demandera
  un compte Apple Developer (gratuit ou payant) pour activer iCloud/CloudKit
  sur le projet.
- **Import de vos calendriers existants** (Google pour toi, Outlook pour ta
  femme) : prévu via EventKit, une fois ces comptes ajoutés dans Réglages >
  Calendrier sur vos iPhone respectifs.
- **Écran de connexion / choix de profil** : pour l'instant "Moi" est créé
  automatiquement au premier lancement.

## Comment ouvrir le projet

Ce dépôt ne contient pas de `.xcodeproj` (il est généré, pas versionné,
pour éviter les conflits). Il faut :

1. Avoir un Mac avec **Xcode 15 ou plus récent**.
2. Installer [XcodeGen](https://github.com/yonaskolb/XcodeGen) une seule fois :
   ```
   brew install xcodegen
   ```
3. Depuis la racine du dépôt :
   ```
   xcodegen generate
   open AppFamille.xcodeproj
   ```
4. Dans Xcode, onglet **Signing & Capabilities** du target AppFamille :
   sélectionne ton compte Apple (Team) — nécessaire pour lancer l'app sur un
   vrai iPhone.
5. Branche ton iPhone et lance (▶️) — ou utilise le simulateur pour un
   premier aperçu rapide.

## Structure

```
Sources/AppFamille/
  App/            point d'entrée SwiftUI
  Models/         FamilyMember, FamilyEvent, FamilyTask, RecurrenceRule (SwiftData)
  Views/          Calendrier, Tâches, Famille + formulaires d'ajout
  Services/       NotificationScheduler (rappels locaux)
  Resources/      Info.plist, entitlements iCloud/CloudKit
project.yml       spec XcodeGen (remplace le .xcodeproj versionné)
```
