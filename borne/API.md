# Borne de vote — contrat d'API (v2)

**Version** : 2.0 — 24 septembre 2026
**Remplace** [ROUTES.md](ROUTES.md) (v1.1), gardé pour l'historique.
**Pour** : Léo (firmware), équipe backend.

> **Ce qui change par rapport à ROUTES.md**
> - Le déverrouillage de la borne se fait par le **check-in QR de l'isoloir** (QR tournant affiché sur l'écran de l'isoloir), plus par un autocollant QR fixe. Les routes A1, A2, D1, D2 et la page front `/borne/:id` disparaissent.
> - La borne **n'envoie plus son numéro** : elle s'identifie par sa clé (`X-Borne-Cle`). Les routes deviennent `/api/borne/...` au lieu de `/api/bornes/{id}/...`.
> - L'abandon (C maintenu 5 s) est **mis de côté** pour l'instant.
> - Les formats JSON de `etat` et `choix` ne changent pas : le firmware garde sa logique.

---

## 1. Le principe : la borne est l'esclave

La borne ne décide rien. Elle **affiche ce que le serveur lui dit** (deux LED) et **transmet les boutons appuyés**. Elle ne sait pas qui vote et ne parle jamais au téléphone. Tout se décide au serveur, qui a la base.

```
📱 téléphone ──scan du QR tournant──► 🗄 serveur ◄──« j'affiche quoi ? » / « on a appuyé sur A »── 🔌 borne
```

Un **isoloir** = un écran qui affiche le QR tournant + une borne. Il n'y a pas de vote papier (seulement en secours, en cas de panne : procédure du bureau de vote, rien à coder).

---

## 2. Les routes

Il n'y en a que trois pour la borne, et **aucune nouvelle pour l'appli** : le téléphone utilise le check-in qui existe déjà (`POST /api/checkin`) et `GET /api/voter/me/status`.

| # | Méthode | Route | Quand | Auth |
|---|---|---|---|---|
| B1 | `GET` | `/api/health` | au démarrage | aucune — **existe déjà** |
| B2 | `GET` | `/api/borne/etat` | toutes les 2 s tant que la borne attend | `X-Borne-Cle` |
| B3 | `POST` | `/api/borne/choix` | à chaque appui A, B ou C | `X-Borne-Cle` |

### Contraintes de la carte (valables pour B2 et B3)

- Répondre en **moins d'1 seconde**. Pas de redirection (301/302).
- JSON **plat et court** (< 1 Ko), clés en camelCase.
- **En cas d'erreur, la borne ne lit que le code HTTP**, jamais le corps. Le code est le contrat.
- La borne n'a pas d'horloge : toute date est posée par le serveur.

---

## 3. Authentification : la clé de la borne

Chaque borne a **sa propre clé**, envoyée à chaque appel :

```
X-Borne-Cle: 3b9f…(48 caractères hex)
```

- Le serveur retrouve **de quel isoloir il s'agit à partir de la clé**. La borne n'envoie jamais de numéro : elle ne peut donc pas se faire passer pour une autre.
- La base ne garde que l'**empreinte SHA-256** de la clé (`isoloir.cle_borne_hash`), jamais la clé elle-même.
- Cette clé est **différente de celle de l'écran** de l'isoloir : si l'une fuit, l'autre reste sûre.
- Générée une fois par borne avant le jour J (`openssl rand -hex 24`), recopiée dans `config.h`, jamais commitée.

> Pourquoi pas l'id dans l'URL ou dans le body ? Ça ne change rien à la sécurité : l'URL et le body partent dans la même requête, et une borne peut y écrire ce qu'elle veut. C'est la clé qui prouve qui parle.

> ⚠️ La borne parle en **HTTP simple** : la clé passe en clair sur le Wi-Fi. C'est acceptable sur le **réseau local dédié** à l'événement (protégé par mot de passe, seulement serveur + écrans + bornes). HTTPS sur l'ESP32 : plus tard si besoin.

---

## 4. B2 — `GET /api/borne/etat`

Appelée **toutes les 2 secondes** tant que la borne est verrouillée. Sert aussi de **battement de cœur** : le serveur note l'heure de chaque appel (`isoloir.derniere_activite_borne`). Le check-in refuse d'ouvrir un vote sur une borne silencieuse depuis plus de 10 s.

**`200` — personne n'a scanné**
```json
{ "etat": "LIBRE" }
```

**`200` — un votant a scanné le QR de cet isoloir**
```json
{
  "etat": "DEVERROUILLEE",
  "jeton": "42",
  "nbCandidats": 3,
  "duel": { "numero": 1, "total": 3, "idAffrontement": 7, "gauche": 0, "droite": 1 }
}
```

| Champ | Explication |
|---|---|
| `jeton` | Identifie le vote ouvert sur cette borne (en pratique : le numéro d'émargement). Chaîne de caractères. La borne le renvoie tel quel dans B3. Il ne sert qu'à cette borne : le serveur vérifie toujours qu'il appartient à l'isoloir de la clé. |
| `nbCandidats` | Si ce n'est pas le nombre de paires de LED câblées, la borne se met hors service au lieu de voter faux. |
| `duel` | **Le duel à jouer maintenant** : le premier sans choix. `numero` vaut 1 pour un nouveau vote, plus si la borne redémarre en plein vote (elle reprend où elle en était). |
| `duel.gauche` / `droite` | **Numéro de LED (0, 1, 2), pas un id de candidat.** `gauche` = LED de `candidat1` de l'affrontement, `droite` = LED de `candidat2`. |

### Correspondance candidat ↔ LED

> **Numéro de LED = rang du candidat dans la période ouverte, triés par `id_candidat` croissant.**
> Plus petit `id_candidat` → LED 0, le suivant → LED 1, etc.

Les duels sont joués par `id_affrontement` croissant. Si la liste des candidats change, **il faut réétiqueter la borne**.

| Code | Quand | Réaction de la borne |
|---|---|---|
| `200` | Normal | — |
| `401` | Clé absente, inconnue, ou isoloir désactivé | Hors service (clé à vérifier dans `config.h`) |

---

## 5. B3 — `POST /api/borne/choix`

Appelée **à chaque appui** sur A, B ou C, pour le duel affiché.

**Requête**
```json
{ "jeton": "42", "idAffrontement": 7, "choix": "DROITE" }
```
`choix` : `GAUCHE` (bouton A), `DROITE` (bouton B), `BLANC` (bouton C).

**`200` — il reste des duels**
```json
{ "statut": "SUIVANT", "duel": { "numero": 2, "total": 3, "idAffrontement": 8, "gauche": 0, "droite": 2 } }
```

**`200` — c'était le dernier duel**
```json
{ "statut": "TERMINE" }
```

**Ce que fait le serveur :**
1. Retrouve le vote `jeton` : il doit appartenir à l'isoloir de la clé et ne pas avoir encore de bulletin.
2. Vérifie que `idAffrontement` est **le duel attendu** (le premier sans choix). Sinon `409`.
3. Écrit un **choix provisoire** (table `choix_provisoire`).
4. S'il reste un duel → `SUIVANT` avec ce duel.
5. Si c'était le dernier, **en une seule transaction**, sous le même verrou que le check-in et le vote en ligne (`findPeriodeOuverteForUpdate`) :
   - crée le `bulletin` de l'inscription ;
   - crée une `ligne_vote` par choix :

     | `choix` | `ligne_vote.id_candidat_choisi` |
     |---|---|
     | `GAUCHE` | `affrontement.id_candidat_1` |
     | `DROITE` | `affrontement.id_candidat_2` |
     | `BLANC` | `NULL` |

   - efface les choix provisoires ;
   - répond `TERMINE`. La borne redevient `LIBRE` d'elle-même : son vote a maintenant un bulletin.

> **Un vote commencé mais pas fini ne compte jamais.**
> - Côté borne, par construction : les choix restent provisoires jusqu'au dernier duel, et le bulletin est écrit d'un coup avec toutes ses lignes. Si le vote n'est pas terminé, ses choix provisoires sont effacés.
> - Côté résultats, en double sécurité : le classement et les statistiques ne lisent que les lignes des **bulletins complets** (autant de lignes que de duels dans la période), via `LigneVoteRepository.findCompletesByPeriode`. Ça protège aussi le vote en ligne, qui écrit ses lignes duel par duel.

### Idempotence : obligatoire

Le Wi-Fi peut couper **après** l'écriture mais **avant** que la réponse arrive. La borne renvoie alors exactement la même requête.

- **Choix déjà reçu pour ce duel** → ne rien écrire, répondre comme la première fois (le duel suivant).
- **Bulletin déjà écrit** (rejeu du dernier duel) → `200 {"statut":"TERMINE"}` sans rien écrire.

La contrainte `UNIQUE` sur `bulletin.id_inscription` reste le dernier filet contre un double vote.

| Code | Quand | Réaction de la borne |
|---|---|---|
| `200` `SUIVANT` | Choix écrit (ou rejeu) | Jingle, pause 3 s, affiche le duel reçu |
| `200` `TERMINE` | Bulletin écrit (ou rejeu) | Arpège long, se reverrouille |
| `400` | Corps mal formé, affrontement inconnu | Signal d'erreur, se reverrouille |
| `401` | Clé absente ou inconnue | Hors service |
| `404` | Jeton inconnu pour cette borne | Signal d'erreur, se reverrouille |
| `409` | Ce n'est pas le duel attendu | Signal d'erreur, se reverrouille. Le B2 suivant renvoie le bon duel |
| `410` | Le scrutin a été clos pendant le vote | Signal d'erreur, se reverrouille |
| erreur réseau / `5xx` | — | **Retente** la même requête (5 fois, toutes les 3 s), puis se reverrouille. Le B2 suivant la remet au bon duel |

---

## 6. Le parcours complet

Emma, 3 candidats : Moreau (LED 0), Fontaine (LED 1), Belkacem (LED 2).

```
   📱 TÉLÉPHONE D'EMMA               🗄 SERVEUR                          🔌 BORNE          🖥 ÉCRAN ISOLOIR
         │                              │◄──── GET /api/borne/etat ──────│  toutes les 2 s   QR tournant
         │                              │───── LIBRE ───────────────────►│  LED éteintes     (change toutes les 5 s)
         │                              │                                │
 ① login, Vote → « Voter à l'isoloir »  │                                │
 ② scanne le QR de l'écran              │                                │
         │── POST /api/checkin ────────►│ QR valide ? inscrite ? pas de bulletin ?
         │                              │ borne en ligne et libre ?
         │                              │ → émargement : vote ouvert sur la borne
         │◄── success « Votez sur la borne »                             │
         │                              │◄──── GET /api/borne/etat ──────│  (≤ 2 s)
         │                              │── DEVERROUILLEE, jeton, duel 1 ►│  2 bips, LED Moreau | Fontaine
         │                              │                                │  Emma appuie sur B
         │                              │◄──── POST choix duel 7 DROITE ─│
         │                              │ choix provisoire               │
         │                              │── SUIVANT, duel 2 ────────────►│  jingle, 3 s, Moreau | Belkacem
         │                              │◄──── POST choix duel 8 GAUCHE ─│
         │                              │── SUIVANT, duel 3 ────────────►│  Fontaine | Belkacem
         │                              │◄──── POST choix duel 9 BLANC ──│
         │                              │ bulletin + 3 lignes_vote       │
         │                              │── TERMINE ────────────────────►│  arpège long, LED éteintes
         │── GET /api/voter/me/status ─►│                                │
         │◄── voted_booth ──────────────│                                │
 « Merci, votre vote est enregistré »   │◄──── GET /api/borne/etat ──────│  LIBRE : prête pour le suivant
```

Le téléphone et la borne ne se parlent jamais. Le lien entre les deux, c'est **l'émargement** créé par le scan : « la borne de l'isoloir 1 vote pour Emma ».

### Statut du votant (`GET /api/voter/me/status`)

| Moment | `status` |
|---|---|
| Avant le scan | `not_voted` |
| Scan fait, vote en cours sur la borne | `checked_in_isoloir` |
| Bulletin écrit par la borne | `voted_booth` (nouveau) |
| A voté (ou commencé à voter) en ligne | `voted_app` |
| Pas inscrit à la période ouverte | `not_registered` |

### Refus du check-in liés à la borne (nouveaux)

| `status` | Quand | Message sur le téléphone |
|---|---|---|
| `booth_offline` | Pas d'appel `etat` depuis plus de 10 s | Borne hors ligne, prévenez un assesseur |
| `booth_busy` | Un autre vote est déjà ouvert sur cette borne | Borne occupée |

Dans ces deux cas, rien n'est écrit : pas d'émargement, le votant peut réessayer.

---

## 7. Changements dans le firmware (`IsoloireConnecte`)

1. Les URL `/api/bornes/{ID_BORNE}/etat` et `/choix` deviennent **`/api/borne/etat`** et **`/api/borne/choix`**.
2. Ajouter l'en-tête **`X-Borne-Cle`** sur chaque appel B2 et B3 (pas sur `/api/health`).
3. `config.h` : **`CLE_BORNE`** remplace `ID_BORNE`.
   ```cpp
   const char* const SERVEUR   = "http://192.168.1.10:8080";
   const char* const CLE_BORNE = "…";   // openssl rand -hex 24, une par borne
   ```
4. `jeton` reste une chaîne : rien à changer dans sa lecture.
5. L'appui long sur C (abandon) n'a plus de route : le garder en local (double flash) sans appel serveur, ou le désactiver.
6. Réagir à `401` sur B2 : hors service (toutes les LED clignotent), comme aujourd'hui.

Tout le reste (formats JSON, boucle toutes les 2 s, reprise au bon duel, 5 tentatives sur `/choix`) ne change pas.

`serveur-test/serveur.py` suit encore l'ancien contrat (ROUTES.md) : à mettre à jour de la même façon pour tester sans le back.

---

## 8. Côté base (équipe backend)

Pas de table `borne` ni `deverrouillage` : on complète la table `isoloir` du check-in.

```sql
ALTER TABLE isoloir ADD COLUMN cle_borne_hash VARCHAR(64);          -- SHA-256 (hex) de la clé de la borne
ALTER TABLE isoloir ADD COLUMN derniere_activite_borne TIMESTAMP;   -- mis à jour par chaque B2 / B3

-- Choix reçus duel par duel, en attendant le dernier. N'entre JAMAIS dans les résultats.
CREATE TABLE choix_provisoire (
  id_emargement   INTEGER     NOT NULL REFERENCES emargement_isoloir (id_emargement),
  id_affrontement INTEGER     NOT NULL REFERENCES affrontement (id_affrontement),
  choix           VARCHAR(10) NOT NULL CHECK (choix IN ('GAUCHE', 'DROITE', 'BLANC')),
  PRIMARY KEY (id_emargement, id_affrontement)   -- un seul choix par duel : rejeu sans doublon
);
```

- **Vote ouvert sur une borne** = un `emargement_isoloir` de cet isoloir dont l'inscription n'a pas encore de `bulletin`.
- **Borne occupée** : le check-in verrouille la ligne `isoloir` (`SELECT … FOR UPDATE`) pour que deux votants qui scannent en même temps ne l'ouvrent pas tous les deux.
- **Heure en UTC** : `derniere_activite_borne` est écrite avec le `Clock` du back (`CheckinConfig`, UTC), comme le check-in qui la compare. Toujours utiliser ce bean, jamais `LocalDateTime.now()` sans horloge.
- **Fait** : check-in (refus `booth_offline` / `booth_busy`, statut `voted_booth`), routes B2 et B3 (`fr.election.api.borne` : `BorneController`, `BorneService`, entité `ChoixProvisoire`), back office admin des isoloirs. Tests : `BorneTests`. SQL : `qr-code/sql/migration-borne.sql` puis `migration-borne-choix.sql`.
- Code `410` sur B3 : le scrutin a été clos pendant le vote.
- **Un seul verrou contre le double vote** : check-in, vote en ligne et dernier duel de la borne passent tous par `findPeriodeOuverteForUpdate` sur l'inscription.

---

## 9. Mis de côté (à reprendre plus tard)

| Sujet | Aujourd'hui |
|---|---|
| **Abandon** (C maintenu 5 s) | Pas de route. Le votant n'est pas censé abandonner. |
| **Vote jamais terminé** (votant parti, borne en panne) | Ses choix provisoires seront effacés et ne comptent de toute façon pas (voir §5). Reste à décider quand : procédure assesseur ou expiration automatique, et si le votant peut alors recommencer. En attendant, la borne reste occupée et le votant émargé sans bulletin. |
| **HTTPS** sur la borne | HTTP sur le réseau local dédié. |
| **Plus de 3 candidats** | 4 au maximum sur cette carte (3 GPIO libres). |
