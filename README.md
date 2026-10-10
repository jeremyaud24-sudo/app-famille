# App Famille

Application familiale installable (PWA), en français, sans dépendances ni build.

## Fonctionnalités
- **Accueil** : résumé du jour (événements, menu, tâches, courses, anniversaires).
- **Courses** : liste partagée, cases à cocher, nettoyage des articles cochés.
- **Tâches** : attribution à un membre, points et classement.
- **Agenda** : calendrier mensuel et événements par jour.
- **Repas** : planning de la semaine, ajout des plats à la liste de courses.
- **Budget** : opérations, solde mensuel, plafonds par catégorie, import de relevés bancaires CSV (catégories devinées, doublons ignorés).
- **Famille** : membres, dates de naissance, export/import JSON des données.

Les données sont stockées dans le navigateur (`localStorage`). L'export JSON sert de sauvegarde ou pour transférer vers un autre appareil.

## Lancer
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000 (le mode hors ligne et l'installation nécessitent http/https). Ouvrir `index.html` directement fonctionne aussi, sans service worker.
