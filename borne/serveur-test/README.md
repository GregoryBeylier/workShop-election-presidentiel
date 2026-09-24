# Tester la borne sur son ordinateur

Tout le parcours de vote, en vrai, avec la borne physique, mais **sans le backend Spring ni la base Neon** : un petit serveur Python joue leur rôle, avec une fausse base de données.

```
   💻 TON ORDINATEUR                                    🔌 LA BORNE (ESP32-C3)
  ┌────────────────────────────────────┐               ┌──────────────────────┐
  │ serveur.py                         │◄── Wi-Fi ─────│ IsoloireConnecte.ino │
  │   fausse_bdd.json (la « base »)    │  GET  /etat   │  LED · boutons ·     │
  │                                    │  POST /choix  │  buzzer              │
  │ http://localhost:8080              │  POST /abandon└──────────────────────┘
  │   tableau de bord = fausse app 📱   │
  │   (bouton « Déverrouiller »)        │
  └────────────────────────────────────┘
```

**Aucune installation côté Python** : uniquement la bibliothèque standard (Python 3.8+).

---

## Ce que couvre cette v2

**Un échange par duel**, tracé en détail des deux côtés :

| Route | Qui l'appelle | Quand |
|---|---|---|
| `GET /api/health` | borne | au démarrage |
| `GET /api/bornes/1/etat` | borne | toutes les 2 s tant qu'elle est verrouillée. Renvoie le **1er duel** au déverrouillage |
| `POST /api/bornes/1/deverrouiller` | tableau de bord (fausse app) | clic sur « Déverrouiller » |
| `POST /api/bornes/1/choix` | borne | **à chaque appui** A, B ou C court (blanc). Renvoie le **duel suivant**, ou `TERMINE` au dernier |
| `POST /api/bornes/1/abandon` | borne | **C maintenu 5 s** pendant un vote |
| `GET /api/vote/statut` | app | pas ici : le tableau de bord montre le statut |
| clé de borne (JWT) | borne | ⏳ v3 |

Chaque choix est écrit en base dès l'appui, dans la table `choix_provisoire`. Il ne devient un vrai bulletin (`bulletin` + `ligne_vote`) qu'au **dernier duel**. Un abandon efface les choix provisoires : aucun demi-bulletin n'entre jamais dans l'urne.

Les formats JSON et les codes HTTP sont **exactement ceux de [../ROUTES.md](../ROUTES.md)**. Seule différence voulue : pas de JWT. La fausse app dit qui elle est avec `{"idUtilisateur": 2}` dans le corps de la requête.

---

## 1. Lancer le serveur

```bash
cd borne/serveur-test
python3 serveur.py
```

Il affiche :

```
  Tableau de bord : http://localhost:8080
  Pour la borne   : http://10.112.131.132:8080   ← à recopier dans config.h (SERVEUR)
```

Ouvre le tableau de bord dans ton navigateur. La borne y apparaît **hors ligne · jamais contactée** : c'est normal, elle n'est pas encore branchée.

> **macOS** : au premier lancement, une fenêtre peut demander d'autoriser Python à accepter des connexions entrantes. **Accepter**, sinon la borne ne pourra pas joindre le serveur.

La fausse base contient :

| | |
|---|---|
| 3 candidats | Alexandre Moreau (LED 1), Claire Fontaine (LED 2), Yanis Belkacem (LED 3) |
| 3 affrontements | n° 7 : 1 contre 2 · n° 8 : 1 contre 3 · n° 9 : 2 contre 3 |
| 4 électeurs inscrits | Emma, Karim, Sofia, Lucas |
| 1 non inscrit | Hugo, pour tester les refus |
| 1 borne | Isoloir 1 |

Les id des candidats (3, 5, 8) ne se suivent volontairement pas : ça prouve que la borne ne manipule que des numéros de LED.

Tu peux ouvrir `fausse_bdd.json` pendant les tests : on y voit les tables `bulletin` et `ligne_vote` se remplir, avec les mêmes noms de colonnes que la vraie base.

---

## 2. Préparer la borne

### Le réseau : le point le plus important

La borne et l'ordinateur doivent être **sur le même Wi-Fi**, et ce Wi-Fi doit :

- être en **2,4 GHz** : l'ESP32-C3 ne voit pas le 5 GHz ;
- laisser les appareils se parler entre eux. Les Wi-Fi d'école ou publics l'interdisent souvent (« isolation des clients »), et certains demandent un identifiant par personne, que l'ESP32 ne sait pas gérer.

**Le plus simple : le partage de connexion de ton téléphone.** Connecte l'ordinateur et la borne dessus. Sur iPhone, active **« Maximiser la compatibilité »** (Réglages → Partage de connexion) pour forcer le 2,4 GHz.

⚠️ Quand tu changes de réseau, **l'IP de l'ordinateur change**. Relance `serveur.py`, relis la ligne « Pour la borne », et mets à jour `config.h`.

### Le firmware

1. Dans l'IDE Arduino, ouvre `borne/firmware/IsoloireConnecte/IsoloireConnecte.ino`.
2. Bibliothèque **ArduinoJson** (de Benoit Blanchon, v7) : Library Manager → « ArduinoJson ». *(Déjà installée sur ce Mac.)*
3. Ouvre l'onglet **config.h** et remplis :
   ```cpp
   const char* const WIFI_SSID = "iPhone de ...";
   const char* const WIFI_MDP  = "...";
   const char* const SERVEUR   = "http://172.20.10.2:8080";   // la ligne « Pour la borne »
   ```
   Ce fichier est ignoré par git : ton mot de passe Wi-Fi ne partira pas dans le repo. Si `config.h` n'existe pas (autre ordinateur), copie `config.example.h` en `config.h`.
4. Mêmes réglages que d'habitude : **ESP32C3 Dev Module**, **USB CDC On Boot : Enabled**.
5. Téléverse, puis ouvre le moniteur série à **115200 bauds**.

### Ce que tu dois voir au démarrage

```
  Connexion au Wi-Fi "iPhone de ..."....
  Wi-Fi connecte. IP de la borne : 172.20.10.4  (signal -48 dBm)

======== TEST DU SERVEUR ========
  [API] >>> GET http://172.20.10.3:8080/api/health
  [API] <<< 200  (35 ms)
            recu    : {"status": "ok"}
  Serveur joignable.
  Borne verrouillee. Interrogation du serveur toutes les 2 s.

======== INTERROGATION DU SERVEUR (toutes les 2 s) ========
  [API] >>> GET http://172.20.10.3:8080/api/bornes/1/etat
  [API] <<< 200
            recu    : {"etat": "LIBRE"}
  -> LIBRE : personne n'a deverrouille la borne, on attend
```

Sur la borne : chenillard pendant la connexion Wi-Fi, puis **toutes les LED éteintes**. Sur le tableau de bord, la borne passe **en ligne**.

L'interrogation toutes les 2 s n'est affichée **que lorsque la réponse change**. Sinon, la console défilerait sans arrêt.

### Suivre un vote, échange par échange

Voici ce que la console montre pour un duel. Le terminal de `serveur.py` et le journal du tableau de bord montrent **le même échange vu du serveur** (`reçu` / `répondu`).

```
======== INTERROGATION DU SERVEUR (toutes les 2 s) ========
  [API] >>> GET http://172.20.10.3:8080/api/bornes/1/etat
  [API] <<< 200
            recu    : {"etat": "DEVERROUILLEE", "jeton": "6295eed6-…", "nbCandidats": 3,
                       "duel": {"numero": 1, "total": 3, "idAffrontement": 7, "gauche": 0, "droite": 1}}
  -> DEVERROUILLEE. Jeton 6295eed6-…                        ← le 1er duel arrive

======== DUEL 1 / 3  (affrontement 7) ========
  GAUCHE (btn A) : candidat LED 1   [GPIO 0]
  DROITE (btn B) : candidat LED 2   [GPIO 6]
  BLANC  (btn C) : appui court
  ANNULER        : C maintenu 5 s
  En attente d'un appui...
  [BTN] A  APPUI    GPIO 2  niveau LOW    (gauche)          ← le votant choisit

======== CHOIX DU VOTANT ========
  Duel 1/3 (affrontement 7) : bouton A -> GAUCHE (candidat LED 1)
  Envoi au serveur...
  [API] >>> POST http://172.20.10.3:8080/api/bornes/1/choix  ← le choix part en base
            envoye  : {"jeton":"6295eed6-…","idAffrontement":7,"choix":"GAUCHE"}
  [API] <<< 200  (48 ms)
            recu    : {"statut": "SUIVANT", "duel": {"numero": 2, "total": 3, …}}
  -> choix enregistre. Duel suivant recu : 2/3 (affrontement 8, LED 1 vs LED 3)
  -> jingle, puis pause de 3 s avant de l'afficher          ← le duel suivant revient
```

Le vote blanc (C court) suit exactement le même chemin avec `"choix":"BLANC"`. Au dernier duel, la réponse est `{"statut": "TERMINE"}` et la console affiche `VOTE TERMINE`. L'appui long sur C affiche `ANNULATION DU VOTE`, suivi de l'appel `POST /abandon`.

---

## 3. Le scénario de test

Coche au fur et à mesure. Chaque ligne teste une règle précise du contrat.

### Parcours normal

| # | Action | Résultat attendu |
|---|---|---|
| 1 | Tableau de bord : **Déverrouiller** pour Emma | Message `200 Votez sur la borne 1`. Borne **DÉVERROUILLÉE**, votant : Emma, duel 1/3 en attente |
| 2 | *(dans les 2 s)* | La borne reçoit le duel 1, fait 2 bips montants et allume LED 1 gauche + LED 2 droite |
| 3 | Bouton **A** | Console : `POST /choix` → `200 SUIVANT`. Tableau de bord : 1er choix provisoire `GAUCHE (Alexandre Moreau)`. Jingle, 3 s, puis duel 2 : LED 1 gauche + LED 3 droite |
| 4 | Bouton **C** (appui court) | `POST /choix` avec `BLANC` → `200 SUIVANT`. 2ᵉ choix provisoire `BLANC (vote blanc)`. Puis duel 3 : LED 2 gauche + LED 3 droite |
| 5 | Bouton **B** | `POST /choix` → `200 TERMINE`, console `VOTE TERMINE`, arpège long |
| 6 | Tableau de bord | Emma **a voté**. 1 bulletin. Duel 7 : Moreau 1, duel 8 : 1 blanc, duel 9 : Belkacem 1. Plus aucun choix provisoire |
| 7 | La borne | LED éteintes, `-> LIBRE`. Prête pour le votant suivant |

### Refus (la borne ne doit jamais se déverrouiller)

| # | Action | Résultat attendu |
|---|---|---|
| 8 | **Déverrouiller** pour Emma à nouveau | `403 A déjà voté` |
| 9 | **Déverrouiller** pour Hugo | `403 Non inscrit` |
| 10 | **Déverrouiller** Karim, puis tout de suite Sofia | Karim `200`, Sofia `409 Borne occupée`. Karim vote normalement ensuite |

### Pannes

| # | Action | Résultat attendu |
|---|---|---|
| 11 | Arrête `serveur.py` (Ctrl+C) | En ~2 s, **toutes les LED clignotent**. Console : `ECHEC : connection refused` |
| 12 | Relance `serveur.py` | Les LED s'éteignent, `-> LIBRE`. Rien d'autre à faire |
| 13 | Déverrouille Sofia, fais 2 duels, puis **maintiens C 5 s** au duel 3 | Console `ANNULATION DU VOTE` puis `POST /abandon` → `204`. Double flash, borne verrouillée. Tableau de bord : 2 choix provisoires effacés, borne LIBRE, Sofia **pas voté**. Elle peut redéverrouiller et recommencer au duel 1 |
| 14 | Déverrouille Lucas, fais 1 duel, puis **coupe `serveur.py`** et appuie sur un bouton | Console : 5 tentatives de `POST /choix`, espacées de 3 s. Relance le serveur avant la 5ᵉ : `200 SUIVANT`, le vote continue |
| 15 | Déverrouille Karim, fais 1 duel, puis **débranche la borne** et rebranche-la | Elle redémarre, et `GET /etat` la remet **directement au duel 2** : `reprise d'un vote deja commence`. Le choix du duel 1 est conservé |
| 16 | **Maintiens C 5 s** alors qu'aucun vote n'est en cours | Console : `aucun vote en cours, rien a annuler`. Aucun appel au serveur |

Pour tout recommencer : bouton **Réinitialiser la fausse base** sur le tableau de bord, ou `python3 serveur.py --reset`.

---

## 4. Dépannage

| Symptôme | Cause probable |
|---|---|
| Chenillard sans fin, pas de « Wi-Fi connecte » | Mauvais SSID ou mot de passe, réseau en 5 GHz, ou Wi-Fi d'entreprise. Voir « Le réseau » ci-dessus |
| `ECHEC : connection refused` | `serveur.py` n'est pas lancé, ou le port dans `config.h` n'est pas le bon |
| `ECHEC : read Timeout` ou `connection lost` | Mauvaise IP dans `config.h`, pare-feu macOS (autoriser Python), ou Wi-Fi qui isole les appareils |
| `POST /choix` → `404` après avoir relancé le serveur avec `--reset` | Normal : la base a été vidée, le jeton n'existe plus. La borne se reverrouille, redéverrouille depuis le tableau de bord |
| `SERVEUR` contient `localhost` | Pour la borne, `localhost` désigne la borne elle-même. Il faut l'IP de l'ordinateur |
| Tableau de bord : borne « hors ligne » alors que la console dit LIBRE | La borne parle à un **autre** serveur (vieille IP dans `config.h`, ou un autre `serveur.py`) |
| `reponse REFUSEE : le serveur annonce 4 candidats…` | La base ne correspond pas au câblage. Protection voulue : la borne refuse de voter faux |
| Le port 8080 est déjà pris (le backend Spring tourne ?) | `python3 serveur.py --port 9000`, et `:9000` dans `config.h` |

---

## 5. Les prochaines étapes

Chaque étape s'ajoute sans casser la précédente. On ne passe à la suivante que quand le scénario ci-dessus est entièrement vert.

| Version | Ajout | Pourquoi |
|---|---|---|
| v1 | Bulletin complet envoyé en fin de vote | Un vote complet, de bout en bout ✅ |
| **v2** | *ce qui est là* : un échange par duel, `/abandon` sur appui long, traces détaillées | Suivre le vote en direct, reprise au bon duel après redémarrage ✅ |
| **v2.1** | Abandon automatique après 3 min sans appui | Un votant parti ne bloque pas l'isoloir 5 minutes |
| **v3** | Clé de borne (JWT `scope=BORNE`) dans l'en-tête `Authorization` | Seule une vraie borne peut envoyer un choix |
| **v4** | La fausse app sur un téléphone : ouvrir `http://<IP>:8080` depuis un téléphone sur le même Wi-Fi | Tester le vrai geste du votant |
| **v5** | **Brancher la borne sur le backend Spring** : il suffit de changer `SERVEUR` dans `config.h` | Si le backend respecte ROUTES.md, la borne ne change pas d'une ligne |

La v5 est le vrai but : ce serveur de test sert de **référence exécutable** du contrat. Si un jour la borne marche avec `serveur.py` mais pas avec le backend, c'est le backend qui s'écarte de ROUTES.md. Le tableau de bord et le scénario ci-dessus permettent de voir exactement où.

> **Mémoire de la carte** : ce firmware occupe 86 % de la flash, à cause du Wi-Fi et du HTTP. Pour ajouter le HTTPS plus tard, choisir *Tools → Partition Scheme → Huge APP (3MB No OTA)*.
