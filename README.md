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
- **Trésorerie** : prévision du solde sur 45 jours d'après les opérations récurrentes, alertes de plafond et de rythme.
- **Patrimoine** : actifs, dettes, patrimoine net et son évolution.
- **Synchronisation** (dans l'artifact Claude) : membres, courses, tâches, agenda et repas partagés entre appareils.
- **Plan d'investissement** : répartition mensuelle en achats seulement, suivi des exécutions.
- **Recettes**, **Carnet de famille**, **Voyages**, **Cadeaux** : dans Listes et Famille.
- **Accueil personnalisable** : blocs masquables et réordonnables.
- **Budget** : opérations et opérations automatiques modifiables ou suspendables.
- **Sport** : plan d'entraînement et suivi par membre, charge hebdomadaire, conseils de récupération et d'alimentation adaptés aux séances.
- **Suivi d'allure** (course, marche, vélo, natation), estimations 10 km et semi, écart à l'allure prévue du programme.
- **Menus de la semaine** : 7 dîners qui changent chaque semaine, 30 recettes complètes, adaptés au sport (glucides la veille d'une sortie longue, protéines après le renfo).
- **Voyages** : programme jour par jour adapté aux voyageurs (seul, couple, famille), proposé par Claude dans l'artifact, modèle générique sinon.
- **Famille** : membres, dates de naissance, export/import JSON des données.

Les données sont stockées dans le navigateur (`localStorage`). L'export JSON sert de sauvegarde ou pour transférer vers un autre appareil.

## Lancer
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000 (le mode hors ligne et l'installation nécessitent http/https). Ouvrir `index.html` directement fonctionne aussi, sans service worker.
