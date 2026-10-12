---
name: ponytail-audit
description: Audit de l'application App Famille (artefact, version web verrouillée et coque iOS) : sécurité, données personnelles, bugs et cohérence. À lancer avant une publication ou après une grosse modification.
---

# Audit App Famille

Fais un audit en lecture seule du dépôt, puis rends un rapport en français, classé par gravité (bloquant, important, mineur), avec pour chaque point le fichier et la ligne, le risque concret et le correctif proposé. Ne modifie rien sans accord.

## 1. Données personnelles et secrets
- Aucune donnée personnelle (montants, comptes, adresses, e-mails, positions) ni clé d'API dans le dépôt, l'historique récent ou `web-app/dist` et `ios-app/ios`.
- Les imports de données privées ne sont pas dans les sources versionnées.

## 2. Version web (`web-app/`)
- `verrou.js` : dérivation PBKDF2, AES-GCM avec IV aléatoire par écriture, aucune donnée en clair dans `localStorage`, verrouillage automatique, effacement en cas de code oublié.
- CSP dans `build.mjs` et `_headers` : pas de source inutile, pas de script inline, `connect-src` limité aux services utilisés.
- Service worker : aucune réponse d'API externe mise en cache.
- Toute insertion de texte utilisateur dans le HTML passe par `esc()` (recherche de `innerHTML` avec des données non échappées).

## 3. Coque iOS (`ios-app/`)
- Clés et permissions de `Info.plist` justifiées, pas de trafic non chiffré, clé Claude stockée localement uniquement.

## 4. Artefact et pont autonome
- `standalone/shim.js` : erreurs gérées, entrées validées, pas d'URL arbitraire acceptée.
- Appels externes (Open-Meteo, Yahoo Finance, Anthropic, Gmail) : données minimales envoyées, échecs affichés sans casser l'app.

## 5. Qualité
- Bugs probables, doublons de logique, régressions possibles sur les calculs financiers (prêts, trésorerie, patrimoine, bourse) et sur les dates.
- Accessibilité de base : libellés des boutons, contrastes, saisie au clavier.

Termine par les 3 corrections les plus utiles à faire en premier.
