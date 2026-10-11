# App Famille pour iPhone (coque Capacitor)

Ce dossier enveloppe l'application web dans une vraie app iOS (WKWebView + projet Xcode). Le code de l'appli reste celui du dépôt : `npm run sync` le recopie dans le projet iOS.

> Rien de ce qui suit n'a pu être compilé depuis l'environnement de développement (Linux, sans Xcode). Le projet Xcode est généré par Capacitor et la logique JavaScript est testée, mais la première compilation sur Mac peut demander un ajustement.

## Ce qu'il faut

- Un Mac avec **Xcode 16 ou plus récent**, et **Node.js 20+**
- Un identifiant Apple (gratuit) ; un iPhone sous iOS 15 ou plus, en mode développeur (Réglages › Confidentialité et sécurité › Mode développeur)

## Installation

```bash
cd ios-app
npm install
npm run ios        # copie l'appli dans www/, synchronise le projet et ouvre Xcode
```

Dans Xcode : cible **App** › *Signing & Capabilities* › choisissez votre équipe (*Personal Team*), branchez l'iPhone, sélectionnez-le et lancez ▶.
Avec un identifiant gratuit, l'app expire au bout de 7 jours (relancer depuis Xcode) ; avec le programme développeur payant (99 €/an), elle passe par TestFlight sans limite de 7 jours.
Si l'identifiant de bundle `fr.famille.app` est refusé, changez-le dans Xcode (et dans `capacitor.config.json`).

Après chaque modification de l'application web : `npm run sync`, puis ▶ dans Xcode.

## Ce qui change par rapport à l'artefact Claude

| Fonction | Dans l'app iOS |
|---|---|
| Données | Stockées dans l'iPhone, comme avant. Pour reprendre celles de l'artefact : Famille › Sauvegarde › **Exporter** (copier le texte), puis dans l'app iOS **Importer (coller)**. |
| Synchronisation famille | **Absente** : elle repose sur la base de l'artefact Claude. Chaque iPhone a ses propres données. |
| Météo | Open-Meteo lu directement, gratuit, sans clé. |
| Cours de bourse | Yahoo Finance lu directement, gratuit (service non officiel, peut changer ou limiter les requêtes). |
| Programme de voyage, parcours sportifs | Appellent l'API Claude : saisir votre clé dans Famille › **App iOS** (console.anthropic.com). Elle reste dans l'iPhone. |
| Localisation | Demandée par iOS (texte dans `Info.plist`). |
| Polices | Embarquées (fonctionne hors ligne). |

Le pont qui remplace les fonctions de l'artefact est `native/native-shim.js`.

## Fichiers

- `capacitor.config.json` : identifiant, nom, HTTP natif activé (`CapacitorHttp`)
- `scripts/copy-web.mjs` : prépare `www/` (appli + pont + polices)
- `native/` : pont iOS et ajustements CSS (barre d'état)
- `ios/` : projet Xcode (Swift Package Manager, pas de CocoaPods)
