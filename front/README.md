# Plateforme de vote — Élection Présidentielle 2026-2027

Projet étudiant MyDigitalSchool (Bachelor Développeur Web) : une plateforme
de vote en ligne basée sur la méthode **"tout le monde contre tout le
monde"** (chaque candidat affronte chaque autre candidat une seule fois,
sous forme de duels successifs) plutôt qu'un vote à candidat unique.

Ce dépôt contient la partie **front-end**. Le back-end (API, authentification
réelle, base de données) est développé séparément par une autre partie de
l'équipe et n'est pas encore branché — le front fonctionne pour l'instant
avec des données simulées (voir [Données mockées](#données-mockées-et-todo)).

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

## Pages et fonctionnement

| Route | Composant | Description |
|---|---|---|
| `/login` | `Login` | Connexion électeur (email + mot de passe) |
| `/set-password` | `SetPassword` | Création du mot de passe via le lien reçu par email (pas d'auto-inscription : les comptes sont créés côté admin) |
| `/` | `ElectorHome` | Accueil électeur — progression du vote, explication du fonctionnement |
| `/vote` | `Vote` | Écran de duel : les candidats s'affrontent deux par deux, sélection + confirmation du choix |
| `/resultats` | `Result` | Page des résultats du scrutin |
| `/mon-compte` | `MyAccount` | Informations du compte, sécurité, notifications, déconnexion |

Structure des dossiers :

```
src/
├── components/       # un dossier par page/composant
│   ├── Navbar/, Footer/, Layout/   → structure commune à toutes les pages (sauf Login/SetPassword)
│   ├── ProtectedRoute/             → redirige vers /login si non connecté
│   └── ...
├── data/
│   └── mockData.ts    # données simulées (candidats, électeurs)
├── assets/            # logo, images
└── App.tsx            # déclaration des routes
```

## Données mockées et TODO

Le back-end n'étant pas encore branché, le front utilise des données
simulées dans `src/data/mockData.ts` (4 candidats, 5 électeurs) et un faux
système d'authentification : la connexion stocke un token factice
(`fake-token-123`) dans le `localStorage`, vérifié par `ProtectedRoute` pour
autoriser l'accès aux pages internes.

Les endroits à brancher au vrai back sont marqués `// TODO` dans le code,
notamment :

- `Login.tsx` / `SetPassword.tsx` — appel API réel au lieu du faux token
- `Vote.tsx` — envoi du vote (duel + candidat choisi) à l'API, comportement
  exact d'un duel "passé"
- `MyAccount.tsx` — sauvegarde des informations du profil
- `ElectorHome.tsx` — récupération de la vraie progression de l'électeur

## Scripts disponibles

```bash
npm run dev       # serveur de développement
npm run build     # build de production
npm run lint      # vérification ESLint
npm run preview   # prévisualiser le build de production
```
