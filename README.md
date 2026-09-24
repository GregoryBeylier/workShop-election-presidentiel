"# workShop-election-presidentiel"
lacamarche1
2

## ⏳ À faire le jour de l'installation : postes isoloirs (check-in QR)

> Migration du check-in déjà faite sur la base de prod (tables `isoloir`, `emargement_isoloir`,
> `journal_checkin`, le 24/09/2026). Il ne reste qu'à **créer les vrais isoloirs**, le jour où les postes
> sont installés. Détails : [qr-code/sql/guide-neon.sql](qr-code/sql/guide-neon.sql) (étape 4) et
> [qr-code/README.md](qr-code/README.md#installation-dun-poste-isoloir).

Pour **chaque** poste isoloir (tablette ou PC + écran) :

1. **Générer une clé poste** aléatoire dans un terminal : `openssl rand -hex 24`.
   Une clé différente par poste ; ne jamais réutiliser les clés de démo ou de test (`cle-test-isoloir`, `tablette-isoloir-…-demo`).
2. **Créer l'isoloir** dans Neon → SQL Editor, sur la branche **prod** (étape 4 du guide), puis noter l'`id_isoloir` renvoyé :
   ```sql
   INSERT INTO isoloir (libelle, cle_hmac, cle_tablette_hash)
   VALUES ('Isoloir 1', encode(sha256(gen_random_uuid()::text::bytea), 'hex'),
           encode(sha256('<clé poste>'::bytea), 'hex'))
   RETURNING id_isoloir;
   ```
3. **Ouvrir la page sur le poste**, en mode kiosque :
   `https://<adresse-de-l-appli>/isoloir/<id_isoloir>?cle=<clé poste>`, puis **effacer l'historique** du navigateur (l'URL contenait la clé).
4. **Installer le poste** selon la checklist : serveur sur une autre machine, pas de clavier ni de souris dans l'isoloir,
   veille désactivée, zoom à 100 %.
5. **Tester** : l'indicateur « Connecté » est vert, et un scan avec un vrai téléphone fonctionne.
6. **Ne conserver la clé poste nulle part** (ni dans le dépôt, ni dans un message) : la base n'en garde que l'empreinte.

Poste perdu ou manipulé : `UPDATE isoloir SET actif = FALSE WHERE id_isoloir = <id>;`, puis recréer un isoloir avec une nouvelle clé.

⚠️ Ne jamais lancer le back avec le profil `demo` sur la base de prod : il crée l'admin `root@demo.fr` / `root`.
