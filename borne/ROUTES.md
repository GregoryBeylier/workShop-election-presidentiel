# Borne de vote — routes d'API

> ⚠️ **Remplacé par [API.md](API.md) (v2)** : déverrouillage par le check-in QR de l'isoloir, routes `/api/borne/...` avec clé de borne. Ce document est gardé pour l'historique.

**Version** : 1.1 — 24 septembre 2026 (un échange par duel : B3 `/choix` remplace `/bulletin`)
**Pour** : équipe backend (et équipe front pour les routes marquées 📱)
**Statut** : proposition de contrat. Les noms, codes HTTP et formats JSON peuvent être discutés, mais **une fois validés, ils ne bougent plus** : ils seront codés en dur dans la carte.

> **Ce document remplace la section « Contrat d'API » de `Doc/CahierDesChargesBackend.md`.** L'ancien contrat (`/api/v1/sessions`, UUID générés par la borne, aucun votant identifié) ne correspondait pas au backend réel. Celui-ci s'appuie sur ce qui existe déjà dans `back/` : préfixe `/api`, JWT, tables `bulletin`, `ligne_vote`, `affrontement`, `inscription`, `periode_vote`.

---

## 1. Les routes en un coup d'œil

| # | Méthode | Route | Appelée par | Auth | Rôle | Existe ? |
|---|---|---|---|---|---|---|
| B1 | `GET` | `/api/health` | 🔌 Borne | aucune | Le serveur répond-il ? | ✅ déjà là |
| B2 | `GET` | `/api/bornes/{idBorne}/etat` | 🔌 Borne | clé borne | Toutes les 2 s : « suis-je déverrouillée ? » | à créer |
| B3 | `POST` | `/api/bornes/{idBorne}/choix` | 🔌 Borne | clé borne | À chaque appui : envoie le choix, reçoit le duel suivant | à créer |
| B4 | `POST` | `/api/bornes/{idBorne}/abandon` | 🔌 Borne | clé borne | Appui long 5 s sur C : annule le vote en cours | à créer |
| A1 | `POST` | `/api/bornes/{idBorne}/deverrouiller` | 📱 App | JWT électeur | Réserve la borne pour ce votant | à créer |
| A2 | `GET` | `/api/vote/statut` | 📱 App | JWT électeur | `pas_vote` / `en_cours` / `a_vote` | à créer |
| D1 | `GET` | `/api/bornes` | 🖥 Admin | JWT admin | État de toutes les bornes | optionnel |
| D2 | `POST` | `/api/bornes/{idBorne}/cle` | 🖥 Admin | JWT admin | Génère la clé à flasher dans la borne | à créer (une fois) |

`{idBorne}` est un entier : `1`, `2`… C'est le numéro écrit sur la borne et dans son QR code.

---

## 2. Le parcours complet

Trois acteurs. **La borne et le téléphone ne se parlent jamais** : ils parlent chacun au serveur, qui fait le lien.

```
   📱 APP DU VOTANT                 🗄 SERVEUR                    🔌 BORNE (ESP32)
         │                              │                              │
         │                              │◄──── B2 GET /etat ───────────│  toutes les 2 s
         │                              │───── { "etat": "LIBRE" } ───►│  LED éteintes
         │                              │                              │
   ① login (route existante)            │                              │
   ② scanne le QR collé sur la borne 1  │                              │
         │── A1 POST /bornes/1/deverrouiller ──►│                      │
         │                              │ vérifie : inscrit ? pas déjà voté ?
         │                              │ période ouverte ? borne libre et en ligne ?
         │                              │ → crée un JETON lié à (borne 1, inscription)
         │◄── 200 « Votez sur la borne 1 » ─────│                      │
         │                              │                              │
         │                              │◄──── B2 GET /etat ───────────│
         │                              │── { DEVERROUILLEE, jeton, duel 1 } ►│  affiche le duel 1
         │                              │                              │  le votant appuie (A/B/C)
         │                              │◄──── B3 POST /choix ─────────│  jeton + duel 1 + choix
         │                              │ écrit le choix (provisoire)  │
         │                              │── { SUIVANT, duel 2 } ──────►│  jingle, pause 3 s, duel 2
         │                              │◄──── B3 POST /choix ─────────│  duel 2 + choix
         │                              │── { SUIVANT, duel 3 } ──────►│  duel 3
         │                              │◄──── B3 POST /choix ─────────│  duel 3 + choix
         │                              │ dernier : choix provisoires → bulletin + lignes_vote
         │                              │ jeton → UTILISÉ, borne → LIBRE
         │                              │── { TERMINE } ──────────────►│  arpège long, se reverrouille
         │                              │                              │
         │                              │    (C maintenu 5 s à tout moment pendant le vote)
         │                              │◄──── B4 POST /abandon ───────│
         │                              │ efface les choix provisoires, borne → LIBRE
         │                              │── 204 ──────────────────────►│  double flash, se reverrouille
         │                              │                              │
         │── A2 GET /vote/statut ──────►│                              │
         │◄── { "statut": "a_vote" } ───│                              │
```

### Machine à états, côté serveur

Une borne n'a que deux états. Un votant en a trois.

```
  BORNE                                   VOTANT (pour la période ouverte)

  LIBRE ──A1──► DEVERROUILLEE             pas_vote ──A1──► en_cours ──B3 (dernier duel)──► a_vote
    ▲                │                       ▲                  │
    └─ B3 dernier ───┤                       └── B4 / expiré ───┘
    └─ B4 / expiré ──┘
```

**Les choix sont écrits au fil de l'eau, mais comme choix provisoires.** Ils ne deviennent un `bulletin` qu'au dernier duel, en une seule transaction. Si le votant abandonne ou si le jeton expire, ses choix provisoires sont effacés : **aucun demi-bulletin n'entre jamais dans l'urne**, il repasse `pas_vote` et peut recommencer.

C'est aussi le serveur qui sait où en est le votant (premier duel sans choix provisoire). Si la borne redémarre en plein vote, B2 lui renvoie **le duel où elle s'était arrêtée**.

---

## 3. Authentification

### La borne : un JWT « BORNE » longue durée

Le backend valide déjà des JWT HS256 signés avec `JWT_SECRET` (voir `SecurityConfig`). **La borne en utilise un aussi**, ce qui évite d'inventer un second mécanisme :

| Claim | Valeur |
|---|---|
| `sub` | `borne-1` (numéro de la borne) |
| `scope` | `BORNE` → autorité Spring `SCOPE_BORNE` |
| `exp` | fin de la période de vote (ex. 7 jours) |

La borne l'envoie à chaque requête : `Authorization: Bearer <jwt>`. Il est généré une fois par D2, puis recopié dans le firmware avant le jour J.

**À vérifier dans chaque route B2/B3/B4** : le `sub` du JWT correspond bien au `{idBorne}` de l'URL. Sinon la borne 2 pourrait lire le jeton de la borne 1.

> Le serveur de test (`serveur-test/`) n'implémente pas encore ce JWT. Il viendra dans une version suivante.

### Le votant : le JWT existant

Celui que renvoie déjà `POST /api/auth/login`, avec `scope = ELECTEUR`.

### Règles à ajouter dans `SecurityConfig`

```java
.requestMatchers(HttpMethod.GET,  "/api/bornes/*/etat").hasAuthority("SCOPE_BORNE")
.requestMatchers(HttpMethod.POST, "/api/bornes/*/choix",
                                  "/api/bornes/*/abandon").hasAuthority("SCOPE_BORNE")
.requestMatchers(HttpMethod.POST, "/api/bornes/*/deverrouiller").hasAuthority("SCOPE_ELECTEUR")
.requestMatchers(HttpMethod.GET,  "/api/vote/statut").hasAuthority("SCOPE_ELECTEUR")
.requestMatchers("/api/bornes", "/api/bornes/*/cle").hasAuthority("SCOPE_ADMIN")
```

À placer **avant** `.anyRequest().authenticated()`.

---

## 4. Routes appelées par la borne 🔌

> **Contraintes de la carte (ESP32-C3), valables pour toutes les routes B :**
> - Répondre en **moins d'1 seconde**. La borne interroge toutes les 2 s.
> - **Pas de redirection** (301/302) : la borne ne les suit pas.
> - JSON **plat et court** (< 1 Ko). Clés en camelCase, comme le reste de l'API.
> - **La borne ne lit que le code HTTP en cas d'erreur**, jamais le corps. Le code est donc le contrat.
> - **La borne n'a pas d'horloge.** Toute date est posée par le serveur.

### B1 — `GET /api/health` ✅ existe déjà

Appelée au démarrage. Réponse `200 {"status":"ok"}`. Rien à changer.

---

### B2 — `GET /api/bornes/{idBorne}/etat`

Appelée **toutes les 2 secondes** tant que la borne est verrouillée. Sert aussi de **battement de cœur** : à chaque appel, le serveur met à jour `derniere_activite` de la borne (utilisé par A1 pour savoir si la borne est en ligne). Pendant un vote, la borne n'appelle plus B2 : ce sont B3 et B4 qui mettent `derniere_activite` à jour.

**Réponse `200` — borne libre**
```json
{ "etat": "LIBRE" }
```

**Réponse `200` — borne déverrouillée par un votant**
```json
{
  "etat": "DEVERROUILLEE",
  "jeton": "3f6c2a9e-8b1d-4e7a-9c55-0d2f1b7a4e10",
  "nbCandidats": 3,
  "duel": { "numero": 1, "total": 3, "idAffrontement": 7, "gauche": 0, "droite": 1 }
}
```

| Champ | Explication |
|---|---|
| `jeton` | UUID v4 (`UUID.randomUUID()`), usage unique, lié à (borne, inscription) côté serveur. **Jamais envoyé au téléphone.** |
| `nbCandidats` | La borne a 3 paires de LED câblées. Si le serveur annonce autre chose, la borne se met hors service au lieu de voter faux. |
| `duel` | **Le duel à jouer maintenant** : le premier affrontement (par `id_affrontement` croissant) qui n'a pas encore de choix provisoire. `numero` 1 pour un nouveau vote, plus si la borne reprend après un redémarrage. |
| `duel.idAffrontement` | L'id de la table `affrontement`. La borne le renverra tel quel dans B3. |
| `duel.gauche` / `droite` | **Numéro de LED (0, 1 ou 2), pas un id de candidat.** `gauche` = LED de `candidat1`, `droite` = LED de `candidat2`. |

Le même objet `duel` revient dans la réponse de B3.

#### ⚠️ Correspondance candidat ↔ LED

La borne n'a pas d'écran. Chaque candidat a **une paire de LED fixe**, avec son nom collé à côté. Règle proposée :

> **Numéro de LED = rang du candidat dans la période ouverte, triés par `id_candidat` croissant.**
> Le plus petit `id_candidat` → LED 0, le suivant → LED 1, etc.

Tant que la liste des candidats ne change pas pendant le scrutin, les étiquettes restent justes. Si un candidat est ajouté ou retiré, **il faut réétiqueter la borne**.

| Code | Quand | Réaction de la borne |
|---|---|---|
| `200` | Normal | — |
| `401` | JWT absent, invalide ou expiré | Hors service (clé à reflasher) |
| `403` | Le JWT est celui d'une autre borne | Hors service |
| `404` | Borne inconnue | Hors service |

---

### B3 — `POST /api/bornes/{idBorne}/choix`

Appelée **à chaque appui** sur A, B ou C (appui court), pour le duel affiché. Le serveur écrit le choix et renvoie le duel suivant.

**Requête**
```json
{
  "jeton": "3f6c2a9e-8b1d-4e7a-9c55-0d2f1b7a4e10",
  "idAffrontement": 7,
  "choix": "GAUCHE"
}
```

`choix` vaut `GAUCHE` (bouton A), `DROITE` (bouton B) ou `BLANC` (bouton C, appui court).

**Réponse `200` — il reste des duels**
```json
{
  "statut": "SUIVANT",
  "duel": { "numero": 2, "total": 3, "idAffrontement": 8, "gauche": 0, "droite": 2 }
}
```

**Réponse `200` — c'était le dernier duel**
```json
{ "statut": "TERMINE" }
```

**Ce que fait le serveur :**

1. Retrouve le jeton : il doit appartenir à **cette** borne, être `ACTIF` et non expiré.
2. Vérifie que `idAffrontement` est **le duel attendu** : le premier sans choix provisoire. Sinon `409`.
3. Écrit le choix dans `choix_provisoire` (voir §7).
4. S'il reste un duel sans choix → répond `SUIVANT` avec ce duel.
5. Si c'était le dernier, **dans une seule transaction (`@Transactional`)** :
   - crée un `Bulletin` pour l'inscription liée au jeton ;
   - crée une `LigneVote` par choix provisoire, en traduisant la position en candidat :

     | `choix` | `ligne_vote.id_candidat_choisi` |
     |---|---|
     | `GAUCHE` | `affrontement.id_candidat_1` |
     | `DROITE` | `affrontement.id_candidat_2` |
     | `BLANC` | `NULL` (déjà prévu par le modèle : « null = égalité ») |

   - efface les choix provisoires, passe le jeton à `UTILISE` et la borne à `LIBRE` ;
   - répond `TERMINE`.

> **Les choix provisoires ne comptent jamais dans les résultats.** Seuls `bulletin` et `ligne_vote` alimentent le dépouillement.

#### 🔁 Idempotence : obligatoire

Le Wi-Fi peut couper **après** l'écriture mais **avant** que la réponse arrive. La borne renverra alors exactement la même requête.

> - **Choix déjà reçu pour ce duel** → ne rien écrire, répondre comme si c'était la première fois (le duel suivant attendu).
> - **Jeton déjà `UTILISE`** (le rejeu porte sur le dernier duel) → répondre `200 {"statut":"TERMINE"}` sans rien écrire.

Sans ces règles, le votant verrait une erreur alors que son choix est bien enregistré, ou un choix serait compté deux fois.
La contrainte `UNIQUE` sur `bulletin.id_inscription` reste le dernier filet contre un double vote.

| Code | Quand | Réaction de la borne |
|---|---|---|
| `200` `SUIVANT` | Choix écrit (ou rejeu) | Jingle, pause 3 s, affiche le duel reçu |
| `200` `TERMINE` | Dernier choix : bulletin écrit (ou rejeu) | Arpège long, se reverrouille |
| `400` | Corps mal formé, affrontement inconnu | Signal d'erreur, se reverrouille |
| `404` | Jeton inconnu pour cette borne | Signal d'erreur, se reverrouille |
| `409` | Ce n'est pas le duel attendu | Signal d'erreur, se reverrouille. Le B2 suivant lui renvoie le bon duel |
| `410` | Jeton expiré ou abandonné | Signal d'erreur, se reverrouille (le votant recommence) |
| erreur réseau / `5xx` | — | **Retente** la même requête (5 fois, toutes les 3 s), puis se reverrouille. Le B2 suivant la remet au bon duel |

---

### B4 — `POST /api/bornes/{idBorne}/abandon`

Appelée quand le votant maintient **le bouton C pendant 5 secondes** pendant un vote.

**Requête**
```json
{ "jeton": "3f6c2a9e-8b1d-4e7a-9c55-0d2f1b7a4e10" }
```

**Réponse `204`** (sans corps). Le serveur **efface les choix provisoires** du jeton, passe le jeton à `ABANDONNE`, la borne à `LIBRE`. Le votant redevient `pas_vote` et peut redéverrouiller une borne depuis l'app.

Si le jeton est déjà `UTILISE`, `ABANDONNE`, expiré ou inconnu, répondre aussi `204` sans rien changer. La borne n'a pas à s'en soucier.

Un seul essai côté borne : si l'annulation se perd, le vote reste ouvert côté serveur, et la borne le reprend au prochain B2 (au duel où elle en était). Rien n'est perdu ni compté en double.

---

## 5. Routes appelées par l'app 📱

### A1 — `POST /api/bornes/{idBorne}/deverrouiller`

Appelée par l'app juste après le scan du QR de la borne. Pas de corps : l'électeur est identifié par son JWT, la borne par l'URL.

**Le QR collé sur la borne** contient une URL du front, par exemple `https://<front>/borne/1`. L'appareil photo l'ouvre directement dans l'app, qui lit le `1` et appelle A1. C'est une page à ajouter côté front.

**Contrôles, dans cet ordre :**

| # | Vérification | Si échec |
|---|---|---|
| 1 | Une `periode_vote` est ouverte (`statut = true`) | `423` Scrutin fermé |
| 2 | L'utilisateur a une `inscription` pour cette période | `403` Non inscrit |
| 3 | Pas de `bulletin` pour cette inscription | `403` A déjà voté |
| 4 | Pas d'autre jeton `ACTIF` pour cette inscription | `409` Vote déjà en cours sur une autre borne |
| 5 | La borne existe | `404` |
| 6 | La borne est en ligne : dernier B2 il y a moins de 10 s | `503` Borne hors ligne |
| 7 | La borne est `LIBRE` | `409` Borne occupée |

Si tout passe : créer le jeton (`ACTIF`, expire dans **5 minutes**) et passer la borne à `DEVERROUILLEE`.

**Réponse `200`**
```json
{ "idBorne": 1, "message": "Votez sur la borne 1" }
```

> 🔒 **Le jeton n'apparaît jamais dans cette réponse.** Il ne part que vers la borne (B2). Sinon le votant pourrait le récupérer et voter depuis chez lui, et l'isoloir ne servirait plus à rien.

> ⚠️ Deux votants qui scannent la même borne en même temps : les contrôles 7 et la création du jeton doivent être **atomiques** (verrou sur la ligne `borne`, ou `UPDATE borne SET etat='DEVERROUILLEE' WHERE id_borne=? AND etat='LIBRE'` en vérifiant qu'une ligne a bien été modifiée).

---

### A2 — `GET /api/vote/statut`

L'app l'interroge toutes les 2-3 s après A1, pour afficher « Merci, votre vote est enregistré » dès que la borne a fini.

**Réponse `200`**
```json
{ "statut": "en_cours", "idBorne": 1 }
```

`statut` reprend les valeurs déjà utilisées par le front (`mockData.ts`) : `pas_vote`, `en_cours` ou `a_vote`. `idBorne` n'est présent que pour `en_cours`.

---

## 6. Routes d'administration 🖥

### D1 — `GET /api/bornes` (optionnel)

Pour un tableau de bord le jour J.

```json
[
  { "idBorne": 1, "nom": "Isoloir 1", "etat": "LIBRE",          "enLigne": true  },
  { "idBorne": 2, "nom": "Isoloir 2", "etat": "DEVERROUILLEE",  "enLigne": false }
]
```

Ne **jamais** y exposer le jeton ni l'inscription liée à un déverrouillage.

### D2 — `POST /api/bornes/{idBorne}/cle`

Génère le JWT de la borne (voir §3). À appeler une fois par borne, avant le jour J. Le résultat est recopié dans le firmware.

```json
{ "idBorne": 1, "cle": "eyJhbGciOiJIUzI1NiJ9...", "expireLe": "2026-10-01T20:00:00Z" }
```

---

## 7. Tables à ajouter (proposition)

Le schéma est géré directement dans Neon (`ddl-auto=validate`) : ces tables sont à créer à la main, puis leurs entités JPA à ajouter.

```sql
CREATE TABLE borne (
  id_borne          INTEGER PRIMARY KEY,           -- 1, 2… = numéro physique
  nom               VARCHAR(50)  NOT NULL,
  etat              VARCHAR(20)  NOT NULL DEFAULT 'LIBRE'
                    CHECK (etat IN ('LIBRE', 'DEVERROUILLEE')),
  derniere_activite TIMESTAMP                      -- mis à jour par chaque B2, B3, B4
);

CREATE TABLE deverrouillage (
  jeton             UUID PRIMARY KEY,
  id_borne          INTEGER NOT NULL REFERENCES borne(id_borne),
  id_inscription    INTEGER NOT NULL REFERENCES inscription(id_inscription),
  statut            VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                    CHECK (statut IN ('ACTIF', 'UTILISE', 'ABANDONNE')),
  cree_le           TIMESTAMP NOT NULL DEFAULT now(),
  expire_le         TIMESTAMP NOT NULL
);

-- Un seul déverrouillage actif par borne et par votant
CREATE UNIQUE INDEX uq_deverrouillage_borne_actif
  ON deverrouillage (id_borne)       WHERE statut = 'ACTIF';
CREATE UNIQUE INDEX uq_deverrouillage_inscription_actif
  ON deverrouillage (id_inscription) WHERE statut = 'ACTIF';

-- Choix reçus duel par duel (B3), en attendant le dernier.
-- Vidée pour un jeton quand son bulletin est écrit, abandonné ou expiré.
-- N'entre JAMAIS dans le calcul des résultats.
CREATE TABLE choix_provisoire (
  jeton             UUID    NOT NULL REFERENCES deverrouillage(jeton),
  id_affrontement   INTEGER NOT NULL REFERENCES affrontement(id_affrontement),
  choix             VARCHAR(10) NOT NULL CHECK (choix IN ('GAUCHE', 'DROITE', 'BLANC')),
  PRIMARY KEY (jeton, id_affrontement)            -- un seul choix par duel : rejeu sans doublon
);

INSERT INTO borne (id_borne, nom) VALUES (1, 'Isoloir 1');
```

**Expiration** : un jeton `ACTIF` dont `expire_le` est dépassé est traité comme abandonné. Soit un `@Scheduled` toutes les 30 s repasse ces jetons en `ABANDONNE`, efface leurs choix provisoires et remet la borne en `LIBRE`, soit chaque route vérifie `expire_le` au moment de lire le jeton. Le plus simple est de faire les deux.

---

## 8. Tester tout le cycle sans la borne

La borne ne fait que les requêtes ci-dessous. **Si ce scénario passe en `curl`, la borne fonctionnera.** Il utilise le compte de démo (profil `demo`).

```bash
API=http://localhost:8080

# 0. Clé de la borne 1 (JWT admin → D2)
ADMIN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"root@demo.fr","motDePasse":"root"}' | jq -r .token)
BORNE=$(curl -s -X POST $API/api/bornes/1/cle -H "Authorization: Bearer $ADMIN" | jq -r .cle)

# 1. La borne interroge : LIBRE
curl -s $API/api/bornes/1/etat -H "Authorization: Bearer $BORNE"

# 2. Le votant se connecte et déverrouille la borne 1
ELECTEUR=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"test@mydigitalschool.fr","motDePasse":"root"}' | jq -r .token)
curl -s -X POST $API/api/bornes/1/deverrouiller -H "Authorization: Bearer $ELECTEUR"

# 3. La borne interroge : DEVERROUILLEE + jeton + duel 1
REP=$(curl -s $API/api/bornes/1/etat -H "Authorization: Bearer $BORNE"); echo "$REP"
JETON=$(echo "$REP" | jq -r .jeton)
DUEL=$(echo "$REP" | jq -r .duel.idAffrontement)

# 4. Un choix par duel, comme le votant : SUIVANT, SUIVANT, puis TERMINE
choix() {
  curl -s -X POST $API/api/bornes/1/choix \
    -H "Authorization: Bearer $BORNE" -H 'Content-Type: application/json' \
    -d "{\"jeton\":\"$JETON\",\"idAffrontement\":$1,\"choix\":\"$2\"}"
}
REP=$(choix $DUEL GAUCHE); echo "$REP"                    # SUIVANT + duel 2
DUEL=$(echo "$REP" | jq -r .duel.idAffrontement)
REP=$(choix $DUEL BLANC);  echo "$REP"                    # SUIVANT + duel 3
DUEL=$(echo "$REP" | jq -r .duel.idAffrontement)
choix $DUEL DROITE; echo                                  # TERMINE → bulletin écrit

# 5. Dernier choix rejoué → 200 TERMINE, rien de plus en base
choix $DUEL DROITE; echo

# 6. Le votant a voté
curl -s $API/api/vote/statut -H "Authorization: Bearer $ELECTEUR"      # a_vote

# 7. Il retente → 403
curl -s -w ' %{http_code}\n' -X POST $API/api/bornes/1/deverrouiller -H "Authorization: Bearer $ELECTEUR"
```

**Cas d'erreur à tester aussi :** déverrouiller une borne déjà occupée (`409`), une borne qui n'a pas appelé B2 depuis 10 s (`503`), un choix pour un autre duel que celui attendu (`409`), un jeton expiré (`410`), un abandon en plein vote puis B2 (`LIBRE`, choix provisoires effacés), la clé de la borne 2 sur `/api/bornes/1/etat` (`403`).

> **Référence exécutable :** `serveur-test/serveur.py` implémente B1 à B4 et A1 exactement comme décrit ici (sans le JWT). En cas de doute sur un comportement, il fait foi.

---

## 9. Questions ouvertes

| # | Question | Pourquoi ça bloque la borne |
|---|---|---|
| 1 | **Quelle URL la borne appelle-t-elle ?** HTTP sur le réseau local, ou HTTPS ? | L'adresse est écrite en dur dans la carte. En HTTPS, il faut aussi y embarquer le certificat racine. |
| 2 | **La base est sur Neon (cloud).** `Doc/infrastructure.md` prévoit un réseau sans Internet le jour J. | Sans Internet, l'API ne joint plus la base, et aucune borne ne marche. Il faut Internet sur place, ou une base locale. |
| 3 | **Secret du vote** : `bulletin.id_inscription` relie chaque bulletin à un électeur. | Pas bloquant pour la borne, mais contraire à la séparation émargement / urne décrite dans `Doc/ReseauLocal.md` §5-7. À décider en équipe, en connaissance de cause. |
| 4 | Durée de validité du jeton : 5 minutes, ça convient ? | Au-delà, la borne reçoit `410` et le votant recommence. |
| 5 | Les admins peuvent-ils voter ? | Leur JWT a le scope `ADMIN`, pas `ELECTEUR`, donc A1 les refuse aujourd'hui. |
