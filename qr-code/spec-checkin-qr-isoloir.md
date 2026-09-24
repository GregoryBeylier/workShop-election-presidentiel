# Spec — Check-in QR pour vote hybride (appli + isoloir papier)

## 1. Objectif

Empêcher qu'un votant vote deux fois (une fois dans l'appli, une fois sur papier
dans l'isoloir). Le check-in QR fonctionne comme une **liste d'émargement
digitale** : dès que le votant scanne le QR affiché dans l'isoloir, son droit
de vote via l'appli est révoqué de façon définitive, qu'il aille ensuite au
bout de son vote papier ou non.

## 2. Dépendance au serveur

Ce système **n'est pas** un plan de secours indépendant : il dépend du même
serveur/backend que l'appli de vote. Si le serveur est down, ni le vote appli
ni le check-in isoloir ne fonctionnent. C'est un mode hybride qui tourne *en
parallèle* de l'appli en conditions normales, pas une solution offline.
Hypothèse : le réseau local (Wi-Fi de l'école) est disponible pendant tout le
scrutin ; les tablettes isoloir et les téléphones des votants y sont connectés.

## 3. Flux fonctionnel

1. Le votant est déjà authentifié dans l'appli (session/JWT existant).
2. Il se rend dans l'isoloir. Une tablette fixée à l'intérieur affiche un QR
   code qui se régénère toutes les 5 secondes.
3. Le votant scanne le QR avec la caméra de l'appli (pas un scanner externe).
4. L'appli envoie `{ qr_token, voter_session }` au serveur.
5. Le serveur valide le token (voir §5) et l'état du votant, puis :
   - si tout est valide → marque le votant comme `checked_in_isoloir`,
     révoque définitivement son droit de vote via l'appli, renvoie une
     confirmation à son téléphone ("Identification réussie — vous pouvez
     voter").
   - si le votant a déjà voté (appli ou isoloir) → rejet avec message clair,
     aucune action.
   - si le token est expiré/invalide → rejet, message "QR expiré, relancer le
     scan".
6. Le votant vote sur le bulletin papier, plie, dépose dans l'urne. **Aucun
   lien n'est fait entre son identité et son vote papier** (c'est tout
   l'intérêt de l'isoloir) — le check-in sert uniquement à verrouiller
   l'appli, pas à tracer le contenu du vote.
7. S'il abandonne après le check-in sans voter réellement, son droit de vote
   reste révoqué (comportement volontaire, identique à un émargement papier
   classique : une fois signé, le droit est consommé).

## 4. Modèle de données (indicatif)

```
Voter
  id
  status: enum [not_voted, voted_app, checked_in_isoloir]
  checked_in_at: timestamp | null
  checked_in_booth_id: string | null

Booth (isoloir)
  id
  label            // ex: "Isoloir 1"
  active: boolean
  secret_key       // clé HMAC propre à ce booth, jamais exposée au client

CheckinLog          // pour audit / debug, pas pour le résultat du vote
  id
  voter_id
  booth_id
  scanned_at
  result: enum [success, already_voted, expired_token, invalid_token]
```

## 5. Génération et sécurité du QR

- Le QR encode : `{ booth_id, window_id, expires_at, signature }`
- `window_id` = timestamp arrondi à la fenêtre de 5s en cours.
- `signature` = HMAC-SHA256(`booth_id + window_id`, `secret_key` du booth),
  calculée côté serveur, jamais recalculable côté client.
- **Fenêtre de validité légèrement plus large que la rotation** : un token est
  accepté s'il correspond à la fenêtre actuelle OU à la précédente (~7-8
  secondes de validité totale pour une rotation de 5s), pour éviter qu'un
  scan pile au moment du changement échoue.
- Le serveur pousse le nouveau QR à la tablette toutes les 5s (polling léger
  ou WebSocket — au choix de l'implémentation, WebSocket préférable pour
  éviter le flash/latence visuelle).
- **Limite connue à assumer, pas à "corriger"** : la rotation empêche la
  réutilisation d'une photo prise à l'avance, mais n'empêche pas un relais en
  temps réel (photo envoyée instantanément à quelqu'un d'autre dans la
  fenêtre de validité). Acceptable pour une élection étudiante ; à ne pas
  présenter comme une preuve de présence physique infalsifiable.

## 6. Endpoints API (indicatif)

```
GET  /booths/:id/current-qr        → { qr_payload, expires_in }
     (appelé par la tablette isoloir, ou push serveur→tablette)

POST /checkin                      → { status, message }
     body: { qr_token, voter_session }
     (appelé par l'appli du votant après scan)

GET  /voter/me/status              → { status: not_voted | voted_app | checked_in_isoloir }
     (l'appli l'utilise pour savoir si elle doit encore proposer le vote in-app)
```

Le endpoint `/checkin` doit être transactionnel : deux scans simultanés pour
le même votant ne doivent jamais produire deux check-in valides (contrainte
unique sur `voter_id` + statut, ou verrou applicatif).

## 7. UI Tablette isoloir

- Plein écran, QR centré, gros.
- Pas de texte identifiant qui que ce soit (écran anonyme — n'importe quel
  isoloir affiche la même chose structurellement).
- Optionnel : un indicateur "connecté au serveur" discret, pour que le staff
  repère vite une tablette déconnectée du Wi-Fi.
- Aucune information sur qui a scanné ne doit apparaître sur cet écran (le
  résultat du scan ne s'affiche que sur le téléphone du votant).

## 8. UI Appli votant

- Écran de scan (caméra) accessible depuis l'appli, uniquement si son statut
  est `not_voted`.
- Après scan réussi : confirmation claire ("Identification réussie — vous
  pouvez voter dans l'isoloir"), et le bouton "voter en ligne" doit
  disparaître/désactiver immédiatement dans l'appli.
- Si erreur (déjà voté, QR expiré) : message explicite, pas de jargon
  technique.

## 9. Cas limites à gérer explicitement

- Votant scanne alors qu'il a déjà voté via l'appli → rejet net.
- Votant scanne deux fois de suite (double-tap, mauvaise manip) → idempotent,
  pas d'erreur bloquante si c'est bien le même votant/même fenêtre.
- Deux isoloirs différents, un votant scanne dans l'un puis tente l'autre →
  rejet (déjà `checked_in_isoloir`).
- Coupure Wi-Fi pendant le scan → message d'erreur réseau clair côté appli,
  retry manuel, aucun état modifié côté serveur tant que la requête n'a pas
  abouti.
- Horloge désynchronisée entre serveur et tablette → la tablette ne doit
  jamais générer le QR elle-même ; elle affiche uniquement ce que le serveur
  lui pousse.

## 10. Hors scope

- Pas de vérification cryptographique de présence physique réelle (voir
  limite §5).
- Pas de lien entre check-in et contenu du bulletin papier (anonymat
  préservé).
- Pas de mode offline : si le serveur tombe, le check-in tombe avec lui (voir
  §2).
