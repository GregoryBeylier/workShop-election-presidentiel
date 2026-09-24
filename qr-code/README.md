# Check-in QR isoloir — prototype

> **Le check-in est maintenant intégré dans l'appli** (`back/` et `front/`), avec le vrai login JWT :
> voir [Intégration dans l'appli](#intégration-dans-lappli). Ce dossier garde la spec, le script SQL
> et le prototype autonome (sans login), utile pour une démo rapide.
>
> 🔒 **Sécurité** : comment le système empêche de truquer le vote, et les failles qui restent : [SECURITE.md](SECURITE.md).

Implémentation autonome de [spec-checkin-qr-isoloir.md](spec-checkin-qr-isoloir.md), sur la même stack
que l'appli (Spring Boot 4 + React/Vite/Tailwind).

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

Un isoloir = **un écran** (tablette ou PC branché sur un écran) qui affiche le QR, et **une borne ESP32** où le votant
vote avec les boutons (voir [borne/API.md](../borne/API.md)). La page `/isoloir/:id` s'affiche dans n'importe quel
navigateur récent. Chaque isoloir a sa propre adresse (`/isoloir/1`, `/isoloir/2`…), une clé pour l'écran et une autre
pour la borne.

- [ ] **Le serveur (back + front) tourne sur une machine du staff**, jamais sur le poste isoloir :
      sinon, un accès au poste donnerait accès à la base et à toutes les clés.
- [ ] **Seuls l'écran et la borne sont dans l'isoloir.** Pas de clavier ni de souris à portée : avec un clavier,
      on peut sortir du plein écran et lire la clé de l'isoloir (F12). Tablette : fixée, en mode kiosque.
- [ ] **Borne fermée, câble USB hors de portée** : brancher un PC sur la borne permet de lire sa clé dans le firmware.
- [ ] **Mode kiosque** (plein écran sans barre d'adresse) :
      `chrome.exe --kiosk "https://<ip-serveur>:5173/isoloir/1?cle=<clé>"` (Windows) ou
      `open -a "Google Chrome" --args --kiosk "https://<ip-serveur>:5173/isoloir/1?cle=<clé>"` (Mac).
- [ ] **Mise en veille et économiseur d'écran désactivés.**
- [ ] **Certificat accepté** une fois sur le poste avant le scrutin (tant qu'il est auto-signé).
- [ ] **Zoom du navigateur à 100 %** et pas de reflet sur l'écran.
- [ ] **Parcours complet testé avant le jour J** (scan, duels sur la borne, « Merci ») sur une branche Neon de test.
      Sur la prod, pas de vrai vote de test : il consommerait un droit de vote et laisserait la borne occupée.
- [ ] **Le jour J** : indicateur « Connecté » sur l'écran, et borne en ligne (LED éteintes, requête de l'étape 5 de `sql/guide-neon.sql`).
- [ ] **Wi-Fi de l'événement en 2,4 GHz**, protégé par mot de passe : l'ESP32 ne voit pas le 5 GHz et envoie sa clé en HTTP.
- [ ] **Historique du navigateur effacé** après la première ouverture (l'URL contenait la clé).
- [ ] Poste perdu ou manipulé : désactiver l'isoloir (`actif = FALSE`) et en créer un nouveau, avec de nouvelles clés
      pour l'écran et la borne (reflasher la borne).

## Intégration dans l'appli

| Prototype (`qr-code/`) | Appli |
|---|---|
| `back/.../service`, `web` | `back/src/main/java/fr/election/api/checkin/` |
| `back/.../model`, `repository` | `back/.../api/model/` et `repository/` (`Isoloir`, `EmargementIsoloir`, `JournalCheckin`) |
| `front/src/pages/Isoloir.tsx` | `front/src/pages/isoloir/PageIsoloir.tsx` → route publique `/isoloir/:id` |
| `front/src/pages/Votant.tsx` | `front/src/pages/vote/` → `/vote` (choix du mode), `/vote/en-ligne` (confirmation puis duels), `/vote/isoloir` (scan) |
| header `X-User-Id` | **JWT** : le votant est `sub` du jeton, le back ignore toute autre identité |

- `SecurityConfig` : `GET /api/booths/*/current-qr` est public (le poste présente sa clé),
  tout le reste du check-in exige un JWT valide.
- Tests : `cd back && ./mvnw test` tourne sur H2 (`src/test/resources/application.properties`), sans Neon.
- Tester le scan sur téléphone : `cd front && npm run dev:https` (HTTPS + accessible depuis le Wi-Fi).
  `npm run dev` reste inchangé pour le reste de l'équipe.

### Reste à faire

1. ~~Lancer `sql/migration-postgres.sql` sur la base Neon de prod~~ : **fait le 24/09/2026**.
   Reste à créer les vrais isoloirs le jour de l'installation : voir le README à la racine du dépôt
   et l'étape 4 de `sql/guide-neon.sql`.
2. ~~Vote en ligne : `ElectionService.voter()` doit refuser le vote après un check-in~~ : **fait**
   (même verrou que le check-in, refus en 409, testé dans `CheckinTests`).
3. **Déploiement** : nginx doit servir le front en HTTPS et relayer `/api` vers le back
   (`front/nginx.conf` ne fait ni l'un ni l'autre aujourd'hui). Côté CORS, mettre la vraie adresse de l'appli
   dans `app.cors.allowed-origins`, ou retirer l'en-tête `Origin` dans nginx comme le fait `npm run dev:https`.
4. **Borne ESP32** : ~~le scan ouvre le vote sur la borne de l'isoloir~~ : **fait** (refus `booth_offline` /
   `booth_busy`, statut `voted_booth`, page « Votez sur la borne » puis « Merci », testé avec un faux bulletin SQL).
   Reste : lancer `sql/migration-borne.sql` (étape 1b du guide) sur la prod, les routes `/api/borne/etat` et
   `/api/borne/choix` (autre équipe), le firmware (Léo), puis un test de bout en bout avec la vraie borne.
   Contrat : [borne/API.md](../borne/API.md).
