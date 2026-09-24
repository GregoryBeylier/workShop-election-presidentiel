# Plateforme de vote — Élection Présidentielle 2026-2027

Projet étudiant MyDigitalSchool (Bachelor Développeur Web) : une plateforme
de vote en ligne basée sur la méthode **"tout le monde contre tout le
monde"** (chaque candidat affronte chaque autre candidat une seule fois,
sous forme de duels successifs) plutôt qu'un vote à candidat unique.

Ce dossier contient la partie **front-end**. Il appelle l'API Spring Boot du
dossier `back/` : en dev, Vite redirige les appels `/api/...` vers
`http://localhost:8080` (voir `vite.config.ts`).

## Stack technique

- **React 19** + **TypeScript**
- **Vite** — serveur de dev et build
- **Tailwind CSS v4** (`@tailwindcss/vite`) — styles utilitaires
- **React Router v7** (`react-router-dom`) — navigation entre les pages
- **lucide-react** — icônes

## Dépendances installées

| Paquet | Rôle |
|---|---|
| `react`, `react-dom` | Librairie UI |
| `react-router-dom` | Routing (pages, redirections, routes protégées) |
| `tailwindcss`, `@tailwindcss/vite` | Styles (classes utilitaires) |
| `lucide-react` | Icônes utilisées dans toute l'interface (œil du mot de passe, navigation, etc.) |
| `typescript`, `@types/*` | Typage statique |
| `eslint`, `typescript-eslint` | Qualité de code / lint |

Pour installer le projet :

```bash
npm install
npm run dev
```

## Charte graphique

Les couleurs et typographies suivent la charte graphique officielle
MyDigitalSchool 25-26, déclarées comme tokens Tailwind dans `src/index.css` :

- `brand-dark` (`#3C3C3B`) — gris anthracite, couleur principale
- `brand-teal` / `brand-teal-dark` / `brand-teal-light` (`#2EC7D3` et dérivés) — teal officiel, accents et boutons
- `brand-purple`, `brand-green`, `brand-pink` — couleurs secondaires (secteurs de formation)
- Police des titres : **Bricolage Grotesque** (chargée depuis Google Fonts) — police officielle de la charte
- Police du texte courant : **Arial** (police système recommandée par la charte, en remplacement de DIN OT qui n'est pas libre de droits)

## Pages

| Route | Page | Description |
|---|---|---|
| `/login` | `PageConnexion` | Connexion (email + mot de passe) |
| `/changer-mot-de-passe` | `PageChangerMotDePasse` | Première connexion : remplacer le mot de passe provisoire fixé par l'admin |
| `/` | `PageAccueil` | Accueil électeur : progression du vote, fonctionnement |
| `/vote` | `PageVote` | Duels : les candidats s'affrontent deux par deux |
| `/waiting` | `PageAttente` | Pendant le vote : compte à rebours et participation (résultats verrouillés) |
| `/resultats` | `PageResultats` | Résultats, une fois le scrutin clos |
| `/mon-compte` | `PageMonCompte` | Informations du compte, statut du vote, déconnexion |
| `/admin` | `PageAdmin` | Admin : pilotage du scrutin, statistiques en direct, inscriptions, candidats |

## Organisation du code

```
src/
├── App.tsx              # déclaration des routes
├── api/                 # appels au back, un fichier par domaine
│   ├── client.ts        #   fetch commun (JWT, erreurs, 401 => /login)
│   ├── auth.ts          #   connexion, session, changement de mot de passe
│   ├── election.ts      #   scrutin, vote, résultats (côté électeur)
│   └── admin.ts         #   statistiques, scrutin, utilisateurs, candidats
├── hooks/               # hooks React réutilisables (usePolling)
├── utils/               # fonctions pures : formatage, règles de mot de passe
├── components/          # composants réutilisables, sans appel à l'API
│   ├── layout/          #   Layout, Navbar, Footer, RouteProtegee
│   └── ui/              #   Bouton, Champ, Badge, Avatar, Panneau, Bandeau,
│                        #   BarreProgression, Confirmation, Onglets…
└── pages/               # une page = un dossier, avec ses propres composants
    ├── connexion/
    ├── changer-mot-de-passe/
    ├── accueil/         #   PageAccueil + CarteProgression, CommentCaMarche…
    ├── vote/            #   PageVote + CarteCandidat, ProgressionDuels…
    ├── attente/         #   PageAttente + CompteARebours, ParticipationEnCours
    ├── resultats/       #   PageResultats + CarteElu, ClassementAutres…
    ├── mon-compte/
    └── admin/           #   PageAdmin + PilotageScrutin
        ├── tableau-de-bord/
        ├── inscriptions/
        └── candidats/
```

Règles pour s'y retrouver :

- **Une page** (`PageXxx`) charge ses données via `api/` et assemble ses
  composants ; ses morceaux propres vivent dans le même dossier.
- **Un composant utilisé par plusieurs pages** va dans `components/ui/` (ou
  `components/layout/` s'il fait partie de la structure commune). Il reçoit
  tout par ses props et n'appelle jamais l'API.
- **Une fonction sans JSX** (calcul, formatage) va dans `utils/`.
- Les noms sont en français, comme le domaine (scrutin, candidat, duel…).

## Scripts disponibles

```bash
npm run dev       # serveur de développement
npm run build     # build de production
npm run lint      # vérification ESLint
npm run preview   # prévisualiser le build de production
```
