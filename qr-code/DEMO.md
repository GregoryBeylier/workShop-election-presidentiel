# Démo : voter à l'isoloir avec l'écran et le téléphone

Tout le parcours d'Emma, en vrai, avec seulement **ton PC**, **un écran** qui a Chrome et **ton téléphone**.
Pas de Raspberry, pas de base à préparer, et la borne ESP32 est facultative : un petit script joue son rôle.

| Qui | Rôle pendant la démo |
|---|---|
| **Ton PC** | Le serveur (back + front), comme le fera le Raspberry le jour J |
| **L'écran** (Chrome, en Wi-Fi) | Affiche le QR de l'isoloir |
| **Ton téléphone** | Le téléphone d'Emma : connexion, scan, « Merci » |
| **Un terminal du PC** | La borne : tu appuies sur A, B ou C au clavier (`borne/fausse-borne.py`) |

Les trois appareils doivent être **sur le même Wi-Fi**.

---

## 1. Lancer (sur le PC)

```bash
./qr-code/demo-locale.sh                  # terminal 1 : le back, attendre « Started »
cd front && npm run dev:https             # terminal 2 : le front
ipconfig getifaddr en0                    # l'IP du PC, par exemple 192.168.1.20
```

`demo-locale.sh` démarre le back sur une **base en mémoire**, déjà remplie :

| Compte | Mot de passe | Rôle |
|---|---|---|
| `root@demo.fr` | `root` | admin |
| `test@mydigitalschool.fr` | `root` | électeur inscrit : **Emma** |
| `moreau@demo.fr`, `fontaine@demo.fr`… | `root` | autres électeurs inscrits (et candidats) |

Le scrutin est déjà ouvert, avec 4 candidats, donc 6 duels. La base n'est ni Neon ni celle du Raspberry :
rien de ce que tu fais pendant la démo n'y laisse de trace.

## 2. Préparer l'écran (sur le Chrome de l'écran)

1. Ouvre `https://192.168.1.20:5173` (l'IP du PC), puis **Paramètres avancés → Continuer** pour le certificat.
2. Connecte-toi avec `root@demo.fr` / `root`, puis **Admin → Isoloirs → Créer l'isoloir**.
3. **Note la clé borne** : la valeur de `CLE_BORNE` dans le bloc affiché (prends-la en photo).
4. Clique **Ouvrir** à côté de l'adresse de l'écran : un nouvel onglet affiche le QR.
5. Reviens sur l'onglet de l'admin, **déconnecte-toi** et ferme-le. Mets l'onglet du QR en plein écran.

✅ Le QR change toutes les 5 s, avec l'indicateur « Connecté ».

## 3. Lancer la fausse borne (terminal 3 du PC)

```bash
python3 borne/fausse-borne.py <clé borne notée à l'étape 2>
```

✅ Elle affiche `LIBRE : LED éteintes, en attente d'un votant`. Dans l'onglet admin Isoloirs (si tu l'ouvres sur un
autre appareil) : **Borne en ligne**, **Libre**.

## 4. La démo

| # | Tu fais | Ce que le public voit |
|---|---|---|
| 1 | Sur le téléphone : `https://192.168.1.20:5173`, connexion avec `test@mydigitalschool.fr` / `root` | La page d'accueil de l'appli |
| 2 | **Voter** | Le choix : en ligne ou à l'isoloir |
| 3 | **Voter à l'isoloir** | L'avertissement « vous renoncez au vote en ligne » et le bouton Scanner |
| 4 | **Scanner** le QR de l'écran | Téléphone : « votez maintenant sur la borne », puis « En attente de la fin de votre vote… » |
| 5 | *(2 s au plus)* | Fausse borne : `DEVERROUILLEE`, puis `DUEL 1 / 6` avec les deux candidats |
| 6 | Dans le terminal : `A`, `B` ou `C` puis Entrée, pour chaque duel | `♪ … enregistré, duel suivant…` |
| 7 | Dernier duel | Fausse borne : `VOTE TERMINÉ : bulletin dans l'urne` |
| 8 | Regarde le téléphone, sans y toucher | « Votre vote est enregistré. Merci pour votre participation ! » |

### Pour aller plus loin : montrer les protections

| Démonstration | Comment | Résultat |
|---|---|---|
| Une photo du QR ne sert à rien | Photographier le QR, attendre 15 s, scanner la photo avec un autre compte | « QR expiré » |
| Un seul votant par borne | Pendant le vote d'Emma, scanner avec `moreau@demo.fr` | « La borne de cet isoloir est occupée » |
| On ne vote pas deux fois | Après le « Merci », Emma retourne dans **Voter** | Le « Merci » s'affiche, plus de scan possible |
| Plus de vote en ligne après le scan | Après le scan, Emma retourne dans **Voter** | La carte « Voter en ligne » est grisée |
| La borne doit être en ligne | Arrêter la fausse borne (Ctrl+C), attendre 10 s, scanner | « La borne de cet isoloir est hors ligne » |
| Un vote interrompu ne compte pas | Arrêter la fausse borne au milieu des duels, puis la relancer | Elle reprend au bon duel ; rien n'est compté avant le dernier |

## 5. Recommencer une démo

Ctrl+C sur le terminal 1, puis relance `./qr-code/demo-locale.sh` : tout repart de zéro. Il faut alors :

- **recréer l'isoloir** dans l'admin (étape 2) et rouvrir l'écran avec la nouvelle adresse ;
- **relancer la fausse borne** avec la nouvelle clé borne ;
- **se reconnecter** sur le téléphone (les anciennes sessions ne sont plus valables).

---

## Avec la vraie borne ESP32

Remplace la fausse borne par l'ESP32 de Léo. Dans `config.h` :

```cpp
const char* const SERVEUR   = "http://192.168.1.20:8080";   // l'IP du PC, jamais localhost
const char* const CLE_BORNE = "<clé borne notée à l'étape 2>";
```

- La borne doit être sur le même Wi-Fi, en **2,4 GHz**.
- Sur Mac, **autorise Java** si le pare-feu le demande, sinon la borne ne joint pas le back.
- ⚠️ La borne a **3 paires de LED** : avec les 4 candidats de la démo, elle se met hors service (toutes les LED
  clignotent). Pour une démo avec l'ESP32, utilise le back normal (`./mvnw spring-boot:run`) sur une base de test
  dont le scrutin a **3 candidats**.

## Le jour J

C'est la même chose, avec le **Raspberry** à la place de ton PC : on remplace l'IP du PC par celle du Raspberry,
sur l'écran, sur les téléphones et dans `config.h`. Donne-lui une **IP fixe** (réservation DHCP dans le routeur) :
si elle change, l'écran et la borne ne le retrouvent plus. Procédure complète : [README à la racine](../README.md).
