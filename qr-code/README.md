# Check-in QR isoloir — prototype

Implémentation autonome de [spec-checkin-qr-isoloir.md](spec-checkin-qr-isoloir.md), sur la même stack
que l'appli (Spring Boot 4 + React/Vite/Tailwind) pour être intégrée ensuite dans `back/` et `front/`.

```
qr-code/
├── back/   API Spring Boot, base H2 en mémoire + données de démo (port 8080)
├── front/  page tablette isoloir + page votant (port 5173, en HTTPS)
└── sql/    migration-postgres.sql : les tables à créer dans Neon
```

## Lancer

```bash
cd qr-code/back && ./mvnw spring-boot:run
cd qr-code/front && npm install && npm run dev
```

Le front n'est servi qu'en **https://** : en `http://` la page charge sans fin.

- Tablette isoloir, ou simplement le PC pour tester :
  `https://localhost:5173/isoloir/1?cle=tablette-isoloir-1-demo`
  (depuis un autre appareil : `https://<ip-du-pc>:5173/isoloir/1?cle=tablette-isoloir-1-demo`)
  (isoloir 2 : `/isoloir/2?cle=tablette-isoloir-2-demo`)
- Votant (téléphone) : `https://<ip-du-pc>:5173/`, puis choisir un votant de démo

Le certificat HTTPS est auto-signé : il faut accepter l'avertissement une fois par appareil.
Le HTTPS est obligatoire, sinon les navigateurs mobiles bloquent la caméra.

Votants de démo : 1 Alice et 3 Chloé (n'ont pas voté), 2 Bob (a déjà voté dans l'appli), 4 David (pas inscrit).
La base H2 est remise à zéro à chaque redémarrage du back.

Tests : `cd qr-code/back && ./mvnw test`.

## API

| Méthode | Route | Appelée par | Auth (temporaire) |
|---|---|---|---|
| GET | `/api/booths/{id}/current-qr` → `{ qr_payload, expires_in }` | tablette, chaque seconde | header `X-Isoloir-Cle` |
| POST | `/api/checkin` `{ qr_token }` → `{ status, message }` | appli après le scan | header `X-User-Id` |
| GET | `/api/voter/me/status` → `{ status }` | appli | header `X-User-Id` |

`status` du check-in : `success`, `already_voted`, `expired_token`, `invalid_token`, `not_registered`.
Les refus métier sont renvoyés en HTTP 200 ; `401` si le votant ou la tablette n'est pas identifié.

## Choix par rapport à la spec

- **Le droit de vote est rattaché à l'`inscription`, pas à l'utilisateur.** C'est déjà comme ça dans l'appli
  (un `bulletin` = une inscription à une période). Pas de colonne `status` : il se déduit de
  `emargement_isoloir` (→ `checked_in_isoloir`) et de `bulletin` (→ `voted_app`).
- **Format du QR** : `CHK1.{isoloir}.{fenêtre}.{expire_le}.{signature}`. La signature est un
  HMAC-SHA256 de `"{isoloir}:{fenêtre}"` avec la clé de l'isoloir. Un QR est accepté pendant sa
  fenêtre de 5 s et la suivante (5 à 10 s, ~7,5 s en moyenne). Seule l'horloge du serveur compte.
- **Clé tablette (ajout à la spec)** : sans elle, n'importe qui sur le réseau pourrait appeler
  `current-qr` et émarger à distance sans passer par l'isoloir. Chaque tablette a une clé, stockée
  hachée côté serveur.
- **Concurrence** : `/checkin` verrouille la ligne `inscription` (`SELECT … FOR UPDATE`), et une
  contrainte unique sur `emargement_isoloir.id_inscription` sert de filet de sécurité.
- **Double scan** dans le même isoloir → `success` sans rien modifier. Dans un autre isoloir → `already_voted`.
- **Polling** au lieu du WebSocket : la tablette interroge le serveur chaque seconde et ne redessine le QR
  que s'il a changé. Si le serveur ne répond plus, elle masque le QR dès qu'il expire et affiche « Hors ligne ».

## Installation d'un poste isoloir

Le poste isoloir peut être une tablette ou un PC branché sur un écran : la page `/isoloir/:id`
s'affiche dans n'importe quel navigateur récent. Chaque écran a sa propre adresse
(`/isoloir/1`, `/isoloir/2`…) et sa propre clé.

- [ ] **Le serveur (back + front) tourne sur une machine du staff**, jamais sur le poste isoloir :
      sinon, un accès au poste donnerait accès à la base et à toutes les clés.
- [ ] **Seul l'écran est dans l'isoloir.** Pas de clavier ni de souris à portée : avec un clavier,
      on peut sortir du plein écran et lire la clé de l'isoloir (F12). Tablette : fixée, en mode kiosque.
- [ ] **Mode kiosque** (plein écran sans barre d'adresse) :
      `chrome.exe --kiosk "https://<ip-serveur>:5173/isoloir/1?cle=<clé>"` (Windows) ou
      `open -a "Google Chrome" --args --kiosk "https://<ip-serveur>:5173/isoloir/1?cle=<clé>"` (Mac).
- [ ] **Mise en veille et économiseur d'écran désactivés.**
- [ ] **Certificat accepté** une fois sur le poste avant le scrutin (tant qu'il est auto-signé).
- [ ] **Zoom du navigateur à 100 %** et pas de reflet sur l'écran.
- [ ] **Scan testé avec un vrai téléphone** sur chaque poste avant l'ouverture, puis indicateur « Connecté » vérifié.
- [ ] **Historique du navigateur effacé** après la première ouverture (l'URL contenait la clé).
- [ ] Poste perdu ou manipulé : changer sa clé (`cle_tablette_hash`) et sa clé de signature (`cle_hmac`).

## À faire lors de l'intégration dans l'appli

1. Remplacer `X-User-Id` (`VotantCourant.java`, `api.ts`) par l'utilisateur du JWT.
2. Lancer `sql/migration-postgres.sql` sur Neon et créer les isoloirs (exemple en bas du script).
3. **Le futur endpoint de vote en ligne doit prendre le même verrou**
   (`InscriptionRepository.findPeriodeOuverteForUpdate`) et refuser le vote s'il existe un
   `emargement_isoloir`. Sinon, un vote appli et un check-in simultanés pourraient passer tous les deux.
4. Autoriser `/api/booths/**` sans JWT dans `SecurityConfig` (la tablette s'authentifie avec sa clé).
