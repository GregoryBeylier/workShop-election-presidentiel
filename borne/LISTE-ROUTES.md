# Routes de la borne de vote

Résumé pour l'équipe backend. Le détail (formats JSON, codes d'erreur, sécurité, tables SQL) est dans [ROUTES.md](ROUTES.md) (v1.1).

| # | Méthode | Route | Appelée par | Auth | Ce que fait la route |
|---|---|---|---|---|---|
| B1 | `GET` | `/api/health` | Borne, au démarrage | aucune | Vérifie que l'API répond (`{"status":"ok"}`). **Existe déjà.** |
| B2 | `GET` | `/api/bornes/{idBorne}/etat` | Borne, toutes les 2 s | clé borne | Dit à la borne si elle est `LIBRE` ou `DEVERROUILLEE`. Si elle est déverrouillée, renvoie le jeton du vote et le duel à afficher. |
| B3 | `POST` | `/api/bornes/{idBorne}/choix` | Borne, à chaque appui (A, B ou C court) | clé borne | Enregistre le choix du votant (`GAUCHE`, `DROITE` ou `BLANC`) pour le duel en cours, puis renvoie le duel suivant. Au dernier duel, écrit le bulletin et répond `TERMINE`. |
| B4 | `POST` | `/api/bornes/{idBorne}/abandon` | Borne, bouton C maintenu 5 s | clé borne | Annule le vote en cours : efface les choix provisoires et libère la borne. Le votant peut recommencer. |
| A1 | `POST` | `/api/bornes/{idBorne}/deverrouiller` | App, après le scan du QR de la borne | JWT électeur | Vérifie que l'électeur a le droit de voter, puis réserve la borne pour lui. Le jeton part uniquement vers la borne, jamais vers le téléphone. |
| A2 | `GET` | `/api/vote/statut` | App, toutes les 2-3 s pendant le vote | JWT électeur | Renvoie `pas_vote`, `en_cours` ou `a_vote`, pour afficher « Merci, votre vote est enregistré ». |
| D1 | `GET` | `/api/bornes` | Admin (optionnel) | JWT admin | Liste les bornes avec leur état et si elles sont en ligne, pour un tableau de bord le jour J. |
| D2 | `POST` | `/api/bornes/{idBorne}/cle` | Admin, une fois par borne | JWT admin | Génère la clé (JWT `scope=BORNE`) à recopier dans le firmware de la borne avant le jour J. |

**Toutes ces routes sont à créer, sauf B1 qui existe déjà.**

## Ce qui a été validé avec la vraie borne

B1 à B4 et A1 tournent dans le serveur de test [serveur-test/serveur.py](serveur-test/serveur.py), validé avec la borne physique. En cas de doute sur un comportement, c'est lui qui fait foi.

A2, D1 et D2 ne sont pas dans le serveur de test, et celui-ci ne vérifie pas encore la clé de borne (JWT).
