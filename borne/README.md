# Borne de vote (isoloir physique)

Une carte **ESP32-C3 SuperMini**, 6 LED, 3 boutons et un buzzer, installée dans l'isoloir. Le votant y départage les candidats **deux par deux** : la borne allume un candidat à gauche et un à droite, le votant appuie sur un bouton, et on passe au duel suivant jusqu'à ce que toutes les paires aient été jouées.

C'est le **canal A** de `Doc/infrastructure.md` : le vote qui garantit l'isolement.

---

## Contenu du dossier

| Fichier | Pour qui | Contenu |
|---|---|---|
| **README.md** | tout le monde | Ce fichier : ce que fait la borne, son câblage, comment la flasher |
| **[API.md](API.md)** | équipe backend, Léo | **Le contrat d'API à jour (v2)** : déverrouillage par le check-in QR de l'isoloir, clé de borne, routes `/api/borne/etat` et `/api/borne/choix`. Remplace ROUTES.md |
| **[LISTE-ROUTES.md](LISTE-ROUTES.md)** | équipe backend | **Le résumé** : toutes les routes dans un tableau, une phrase par route |
| **[ROUTES.md](ROUTES.md)** | équipe backend, équipe front | **Les routes d'API à créer.** Formats JSON, codes HTTP, tables SQL, scénario de test en `curl` |
| **[firmware/IsoloireBuzzer/IsoloireBuzzer.ino](firmware/IsoloireBuzzer/IsoloireBuzzer.ino)** | équipe embarquée, curieux | Le programme de référence, testé sur le câblage réel. Hors ligne |
| **[firmware/IsoloireConnecte/](firmware/IsoloireConnecte/)** | équipe embarquée | La même borne, connectée en Wi-Fi à l'API (v1 : échanges minimum) |
| **[serveur-test/](serveur-test/README.md)** | tout le monde | Un faux backend (Python, fausse base) + tableau de bord, pour **tester tout le parcours sur un ordinateur avec la borne branchée** |

**Équipe backend : commencez par [API.md](API.md).** ROUTES.md et LISTE-ROUTES.md décrivent l'ancien contrat (v1.1). Vous n'avez pas besoin de lire le `.ino` pour travailler. Il est là pour voir *quand* la borne appelle chaque route (cherchez `>>> API` dans le fichier).

---

## Où on en est

| | État |
|---|---|
| Câblage de l'isoloir | ✅ fait et testé |
| Scrutin local : duels, boutons, jingle, dépouillement | ✅ fonctionne |
| Remise à zéro sans redémarrer (appui long 5 s sur C) | ✅ fonctionne |
| Wi-Fi, appels API, déverrouillage par l'app | 🧪 **v1 écrite** ([IsoloireConnecte](firmware/IsoloireConnecte/)), à valider sur la borne avec le [serveur de test](serveur-test/README.md) |
| Branchement sur le vrai backend Spring | ❌ pas encore : les routes de [API.md](API.md) sont à créer côté backend |

Le programme de référence fait voter **en local** : les voix sont comptées dans la carte et affichées sur la console. La version connectée remplace ce comptage local par les appels décrits dans [ROUTES.md](ROUTES.md). En attendant le backend, elle se teste contre `serveur-test/serveur.py`, qui implémente ces mêmes routes.

---

## Ce que voit le votant

| Élément | Rôle |
|---|---|
| 3 LED à gauche | Le candidat de gauche du duel en cours (une LED par candidat) |
| 3 LED à droite | Le candidat de droite du duel en cours |
| Bouton **A** | Vote pour le candidat de **gauche** |
| Bouton **B** | Vote pour le candidat de **droite** |
| Bouton **C** | Vote **blanc** (appui court) · **remise à zéro** (maintenu 5 s) |
| Buzzer | Jingle de validation après chaque choix |

Chaque candidat a **une paire de LED fixe** (LED 1 gauche + LED 1 droite = candidat 1, etc.), avec son nom collé à côté. La borne n'a pas d'écran.

Avec 3 candidats, il y a **3 duels** : 1 contre 2, 1 contre 3, 2 contre 3.

### Déroulé aujourd'hui (hors ligne)

```
DÉMARRAGE   test des 6 LED une par une, puis jingle de test
   │
DUEL 1/3    LED gauche + LED droite allumées → attente d'un bouton
   │        appui → LED éteintes, jingle, pause de 3 s
DUEL 2/3    …
DUEL 3/3    …
   │
TERMINÉ     résultats sur la console, LED en chenillard
            n'importe quel bouton → nouveau scrutin
```

### Déroulé prévu (connectée)

```
VERROUILLÉE   LED éteintes, interroge le serveur toutes les 2 s      ← B2
   │          le votant scanne le QR de la borne avec l'app          ← A1
DÉVERROUILLÉE le serveur envoie un jeton + le duel 1                 ← B2
   │
DUEL n        le votant appuie → le choix part aussitôt au serveur   ← B3
   │          le serveur l'écrit et renvoie le duel n+1
   │          jingle, pause 3 s, duel suivant…
   │
DERNIER DUEL  le serveur répond TERMINE : bulletin versé dans l'urne ← B3
   │          arpège long
   └──► VERROUILLÉE (prête pour le votant suivant)

Appui long 5 s sur C pendant un vote → annulation                    ← B4
```

---

## Câblage

Carte : **ESP32-C3 SuperMini**. Broches disponibles : GPIO 0 à 10, 20 et 21.

| Élément | GPIO | Branchement |
|---|---|---|
| LED gauche — candidat 1 | 0 | GPIO → résistance → LED → GND |
| LED gauche — candidat 2 | 1 | idem |
| LED gauche — candidat 3 | 3 | idem |
| LED droite — candidat 1 | 5 | idem |
| LED droite — candidat 2 | 6 | idem |
| LED droite — candidat 3 | 7 | idem |
| Buzzer **passif** | 20 | GPIO → résistance 100 Ω → buzzer + ; buzzer − → GND |
| Bouton A (gauche) | 2 | GPIO → bouton → GND (pull-up interne) |
| Bouton B (droite) | 8 | idem |
| Bouton C (blanc / RAZ) | 9 | idem |
| *libres* | 4, 10, 21 | |

**Trois pièges déjà rencontrés, à ne pas refaire :**

- **Pas de LED sur les GPIO 2, 8 et 9.** Ce sont les broches de démarrage du C3 : elles doivent être à l'état haut au boot. Une LED les tirerait vers le bas et la carte démarrerait en mode flash au lieu de lancer le programme. Les boutons y sont sans risque, **tant qu'on n'appuie pas pendant le démarrage**.
- **Le buzzer doit être passif.** Un buzzer actif ne joue qu'une seule note : pas de jingle possible. Au démarrage, si le jingle de test est muet, c'est la cause.
- **Le GPIO 20 est aussi la broche RX du port série matériel.** Ça fonctionne parce que la console passe par l'USB (réglage ci-dessous).

---

## Flasher la carte

1. **Arduino IDE 2** avec le paquet **esp32 by Espressif** (Boards Manager).
2. Ouvrir `firmware/IsoloireBuzzer/IsoloireBuzzer.ino`.
3. Réglages dans le menu **Tools** :

   | Réglage | Valeur |
   |---|---|
   | Board | **ESP32C3 Dev Module** |
   | USB CDC On Boot | **Enabled** ⚠️ sans ça, la console reste muette |
   | Port | le port USB de la carte |

4. Téléverser, puis ouvrir le **Serial Monitor à 115200 bauds**.

Si le programme refuse de compiler avec *« Brochage prévu pour un ESP32-C3 SuperMini »*, c'est que la mauvaise carte est sélectionnée.

> **Après un appui sur le bouton RESET de la carte**, le moniteur série ne se reconnecte pas tout seul (la carte disparaît puis réapparaît sur l'USB). Fermer et rouvrir le moniteur. Pour relancer un scrutin, préférer l'appui long sur C : ça ne coupe pas l'USB.

---

## Lire la console

Avec `MODE_TEST = true` (réglage par défaut), tout est tracé :

```
--------- DUEL 1 / 3 ---------
  GAUCHE (btn A) : Candidat 1   [GPIO 0]
  DROITE (btn B) : Candidat 2   [GPIO 6]
  BLANC  (btn C) : aucun choix
  [LED] duel 1 affiche       G[#..] D[.#.] BUZ[.]
  En attente d'un appui...
  [BTN] B  APPUI    GPIO 8  niveau LOW    (droite)
  [VOTE] btn B -> Candidat 2 (total : 1 voix)
  [LED] jingle validation    G[...] D[...] BUZ[*]
```

| Préfixe | Signification |
|---|---|
| `[LED]` | État des LED : `#` allumée, `.` éteinte. `BUZ[*]` = le buzzer joue |
| `[BTN]` | Un bouton vient d'être appuyé, relâché, ou maintenu 5 s |
| `[VOTE]` | Un choix vient d'être enregistré |
| `[ETAT]` | Relevé automatique toutes les 5 s (utile pour repérer un bouton bloqué) |

Passer `MODE_TEST` à `false` pour ne garder que le déroulé du vote.

---

## Changer le nombre de candidats

Le programme s'adapte tout seul à `NB_CANDIDATS` (duels, chenillard, dépouillement). Il faut aussi :

1. compléter les tableaux `NOMS`, `LED_GAUCHE` et `LED_DROITE` ;
2. câbler les LED en plus. Il reste 3 GPIO libres (4, 10, 21), soit **un seul candidat de plus** au maximum sur cette carte (2 LED par candidat).

Côté serveur, la borne vérifiera que le `nbCandidats` renvoyé par l'API correspond à ce qui est câblé (voir [API.md](API.md), B2).
