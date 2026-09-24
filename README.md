"# workShop-election-presidentiel"
lacamarche1
23

## ⏳ À faire avant le jour J : isoloirs (check-in QR + borne ESP32)

> Un isoloir = **un écran** qui affiche le QR tournant + **une borne ESP32** où le votant vote avec les boutons.
> Tables du check-in déjà créées sur la base de prod (le 24/09/2026). Détails :
> [qr-code/sql/guide-neon.sql](qr-code/sql/guide-neon.sql), [qr-code/README.md](qr-code/README.md#installation-dun-poste-isoloir),
> [borne/API.md](borne/API.md) et [qr-code/SECURITE.md](qr-code/SECURITE.md).

**Une fois, avant de déployer la version avec la borne** : lancer l'**étape 1b** de `guide-neon.sql` sur la prod
(colonnes `cle_borne_hash` et `derniere_activite_borne`). Sans elle, le back refuse de démarrer.

Pour **chaque** isoloir, le jour de l'installation :

1. **Générer deux clés** aléatoires dans un terminal, une pour l'écran et une pour la borne :
   `openssl rand -hex 24` (deux fois). Des clés différentes par isoloir ; ne jamais réutiliser les clés de démo
   ou de test (`cle-test-isoloir`, `cle-test-borne`, `tablette-isoloir-…-demo`).
2. **Créer l'isoloir** dans Neon → SQL Editor, sur la branche **prod** (étape 4 du guide), puis noter l'`id_isoloir` renvoyé :
   ```sql
   INSERT INTO isoloir (libelle, cle_hmac, cle_tablette_hash, cle_borne_hash)
   VALUES ('Isoloir 1', encode(sha256(gen_random_uuid()::text::bytea), 'hex'),
           encode(sha256('<clé écran>'::bytea), 'hex'),
           encode(sha256('<clé borne>'::bytea), 'hex'))
   RETURNING id_isoloir;
   ```
3. **Flasher la borne** : dans `borne/firmware/IsoloireConnecte/config.h`, le Wi-Fi de l'événement, `SERVEUR` = l'IP du
   serveur sur ce réseau (jamais `localhost`) et `CLE_BORNE` = la clé borne. `config.h` n'est jamais commité.
4. **Ouvrir la page sur l'écran**, en mode kiosque :
   `https://<adresse-de-l-appli>/isoloir/<id_isoloir>?cle=<clé écran>`, puis **effacer l'historique** du navigateur (l'URL contenait la clé).
5. **Installer le poste** selon la checklist : serveur sur une autre machine, pas de clavier ni de souris dans l'isoloir,
   veille désactivée, zoom à 100 %.
6. **Vérifier** : l'écran affiche « Connecté », et la borne est en ligne (LED éteintes, pas de clignotement) :
   ```sql
   SELECT id_isoloir, libelle,
          derniere_activite_borne > (now() AT TIME ZONE 'UTC') - INTERVAL '10 seconds' AS borne_en_ligne
   FROM isoloir;
   ```
   Ne pas faire de vrai vote de test sur la prod : il consommerait un droit de vote. Le parcours complet (scan, duels,
   « Merci ») se teste avant, sur une branche Neon de test.
7. **Ne conserver les clés nulle part** (ni dans le dépôt, ni dans un message) : la base n'en garde que l'empreinte.

Isoloir perdu ou manipulé : `UPDATE isoloir SET actif = FALSE WHERE id_isoloir = <id>;`, puis recréer un isoloir avec de nouvelles clés
et reflasher la borne.

⚠️ Ne jamais lancer le back avec le profil `demo` sur la base de prod : il crée l'admin `root@demo.fr` / `root`.
