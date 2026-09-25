"# workShop-election-presidentiel"
lacamarche1
234

## ⏳ À faire avant le jour J : isoloirs (code à 6 chiffres + borne ESP32)

> Un isoloir = **un écran** qui affiche un code à 6 chiffres (change toutes les 30 s) + **une borne ESP32** où le votant vote avec les boutons.
> Tables du check-in déjà créées sur la base de prod (le 24/09/2026). Détails :
> [qr-code/sql/guide-neon.sql](qr-code/sql/guide-neon.sql), [qr-code/README.md](qr-code/README.md#installation-dun-poste-isoloir),
> [borne/API.md](borne/API.md) et [qr-code/SECURITE.md](qr-code/SECURITE.md).

**Une fois, avant de déployer la version avec la borne** : lancer l'**étape 1b** de `guide-neon.sql` sur la prod
(colonnes `cle_borne_hash` et `derniere_activite_borne`). Sans elle, le back refuse de démarrer.

Pour **chaque** isoloir, le jour de l'installation :

1. **Créer l'isoloir dans l'appli** : se connecter en admin → **Admin** → onglet **Isoloirs** → **Créer l'isoloir**.
   Le serveur génère les deux clés (écran et borne) et les affiche **une seule fois** : l'adresse de l'écran et les
   lignes de `config.h` de la borne, avec un bouton « Copier ». Rien à taper en SQL.
   (Sans l'appli : la requête `INSERT INTO isoloir …` de l'étape 4 de `guide-neon.sql`, avec deux clés `openssl rand -hex 24`.)
2. Ne jamais réutiliser les clés de démo ou de test (`cle-test-isoloir`, `cle-test-borne`, `tablette-isoloir-…-demo`).
3. **Flasher la borne** : dans `borne/firmware/IsoloireConnecte/config.h`, coller les lignes `SERVEUR` et `CLE_BORNE`
   données par l'onglet Isoloirs (`SERVEUR` = l'IP du serveur sur le Wi-Fi, jamais `localhost`), et le Wi-Fi de
   l'événement. `config.h` n'est jamais commité.
4. **Ouvrir sur l'écran** l'adresse donnée par l'onglet Isoloirs, en mode kiosque, puis **effacer l'historique** du
   navigateur (l'URL contenait la clé).
5. **Installer le poste** selon la checklist : serveur sur une autre machine, pas de clavier ni de souris dans l'isoloir,
   veille désactivée, zoom à 100 %.
6. **Vérifier** : l'écran affiche « Connecté », la borne a ses LED éteintes, et l'onglet **Isoloirs** affiche
   « Borne en ligne » et « Libre » (mis à jour toutes les 3 s).
   Ne pas faire de vrai vote de test sur la prod : il consommerait un droit de vote. Le parcours complet (code, duels,
   « Merci ») se teste avant, sur une branche Neon de test.
7. **Ne conserver les clés nulle part** (ni dans le dépôt, ni dans un message) : la base n'en garde que l'empreinte.

Isoloir perdu ou manipulé : bouton **Désactiver** dans l'onglet Isoloirs, puis créer un nouvel isoloir et reflasher
la borne avec ses nouvelles clés.

⚠️ Ne jamais lancer le back avec le profil `demo` sur la base de prod : il crée l'admin `root@demo.fr` / `root`.
