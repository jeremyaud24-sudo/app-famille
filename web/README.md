# AppFamille — web (PWA)

Version web de l'app, installable sur iPhone sans Mac ni compte Apple
Developer (voir le README à la racine du dépôt pour le contexte du projet).

## Développement local

```bash
npm install
npm run dev
```

## Build de production (ce que la CI vérifie)

```bash
npm run build
npm run preview   # pour tester le build localement
```

## Régénérer les icônes

```bash
node scripts/generate-icons.mjs
```
