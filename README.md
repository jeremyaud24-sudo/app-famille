# App Famille

Application familiale installable (PWA), en français, sans dépendances ni build.

## Navigation
5 onglets (Accueil, Agenda, Listes, Argent, Famille). Listes regroupe Courses, Tâches et Repas ; Argent regroupe Bourse et Budget. Les ajouts se font par un bouton « + » qui ouvre une feuille de saisie ; les suppressions proposent « Annuler ».

## Fonctionnalités
- **Accueil** : résumé du jour (événements, menu, tâches, courses, anniversaires).
- **Courses** : liste partagée, cases à cocher, nettoyage des articles cochés.
- **Tâches** : attribution à un membre, points et classement.
- **Agenda** : calendrier mensuel et événements par jour.
- **Repas** : planning de la semaine, ajout des plats à la liste de courses.
- **Budget** : opérations, solde mensuel, plafonds par catégorie, import de relevés bancaires CSV (catégories devinées, doublons ignorés).
- **Bourse** : suivi du portefeuille (cours saisis à la main), répartitions, conseils automatiques, rééquilibrage, dividendes, frais, fiscalité estimée, simulation long terme.
- **Recherche** : loupe en haut à droite, cherche dans toute l'application.
- **Récurrence** : tâches et événements répétés, rappels sur l'accueil, opérations de budget récurrentes, objectifs d'épargne, historique du portefeuille, dividendes reçus, lignes en dollars.
- **Prêts** : échéancier, capital restant dû, intérêts, remboursement anticipé, et alerte rachat/renégociation d'après un taux du marché saisi à la main.
- **Famille** : membres, dates de naissance, export/import JSON des données.

Les données sont stockées dans le navigateur (`localStorage`). L'export JSON sert de sauvegarde ou pour transférer vers un autre appareil.

## Lancer
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000 (le mode hors ligne et l'installation nécessitent http/https). Ouvrir `index.html` directement fonctionne aussi, sans service worker.
