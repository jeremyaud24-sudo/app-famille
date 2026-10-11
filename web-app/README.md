# App Famille : version web autonome et verrouillée

Une version de l'application qui ne dépend plus de l'artefact Claude : elle se dépose sur n'importe quel hébergeur statique (HTTPS), s'installe sur l'écran d'accueil de l'iPhone et fonctionne hors ligne. Aucun compte, aucun serveur à maintenir.

## Sécurité : ce qui est en place

| Mesure | Détail |
|---|---|
| Code d'accès | Écran de verrouillage au lancement ; verrouillage automatique après 2 min en arrière-plan ; bouton « Verrouiller maintenant » (Famille) |
| Chiffrement | Toutes les données de l'app et la clé Claude sont chiffrées dans l'appareil (AES-GCM 256, clé dérivée du code par PBKDF2-SHA256, 310 000 itérations). En clair uniquement en mémoire, une fois déverrouillé |
| Essais limités | Délai croissant après 3 codes faux (limite côté appareil) |
| Aucune donnée sur le serveur | Le site ne contient que le code de l'app ; vos données restent dans l'iPhone ou l'ordinateur |
| CSP stricte et en-têtes | `default-src 'none'`, scripts uniquement du site, appels réseau limités à Anthropic et Open-Meteo, pas de cadre (`frame-ancestors 'none'`), HSTS, `nosniff`, pas de référent |
| Aucun service tiers | Polices embarquées, pas de Google Fonts, pas de statistiques |

Limites à connaître :
- Le chiffrement protège les données **au repos** dans l'appareil. Contre quelqu'un qui aurait l'appareil et du temps, tout dépend du code : préférez une **phrase de passe** d'au moins 8 caractères.
- **Code oublié = données perdues** (il n'existe pas de récupération). Faites régulièrement Famille › Sauvegarde › Exporter.
- Les limites d'essais sont appliquées par l'app : elles freinent un usage normal, pas une attaque directe sur le stockage (là, c'est le coût de PBKDF2 qui protège).
- Pour que seules vos personnes puissent même charger le site, ajoutez une protection d'accès devant l'hébergeur (par exemple Cloudflare Access, gratuit jusqu'à 50 personnes). Facultatif : les données restent protégées par le code.
- Face ID n'est pas géré dans cette version (code uniquement).

## Construire

```bash
cd web-app
npm install
npm run build      # produit web-app/dist/
```

## Publier

**Le plus simple (aucun outil à installer, faisable depuis un navigateur)** : le dossier `web-app/dist/` est déjà construit et versionné dans le dépôt. Sur Cloudflare Pages, choisissez *Connect to Git*, sélectionnez ce dépôt, laissez la commande de build **vide** et mettez `web-app/dist` comme dossier de sortie. Chaque mise à jour poussée sur `main` redéploie le site.

Alternative : construire soi-même puis envoyer le dossier :

- **Cloudflare Pages** (recommandé, gratuit) : Workers & Pages › Create › Pages › *Upload assets* › glissez le dossier `dist/`. Les en-têtes de sécurité viennent du fichier `_headers`.
- **Netlify** : *Add new site › Deploy manually*, glissez `dist/`. Même fichier `_headers`.
- GitHub Pages ne lit pas `_headers` : la CSP reste active (balise meta) mais pas les autres en-têtes.

Notez l'adresse https obtenue, puis sur l'iPhone : Safari › Partager › **Sur l'écran d'accueil**. L'app installée a un stockage séparé de Safari : y importer les données une seule fois (voir plus bas).

## Reprendre vos données depuis l'artefact Claude

Artefact : Famille › Sauvegarde › **Exporter** (copier le texte). Application web, déverrouillée : Famille › Sauvegarde › **Importer (coller)**.

## Ce qui change par rapport à l'artefact

| Fonction | Version web |
|---|---|
| Synchronisation famille | **Absente** (elle repose sur la base de l'artefact) : chaque appareil a ses données |
| Programme de voyage, parcours sportifs | API Claude : saisissez votre clé dans Famille › Application web (elle est chiffrée dans l'appareil) |
| Météo | Open-Meteo, direct, gratuit, sans clé |
| Cours de bourse | Yahoo refuse les appels directs depuis un navigateur : il faut un petit relais. `worker-cours.js` est prêt pour Cloudflare Workers (gratuit) ; sans relais, saisie manuelle des cours |
| Partage d'un rendez-vous | Lien Google Agenda ; pas de brouillon Gmail |
| Localisation | Demandée par le navigateur (HTTPS requis) |

Si votre domaine de relais n'est pas en `*.workers.dev`, ajoutez-le à `connect-src` dans `build.mjs` (CSP).
