#!/usr/bin/env python3
"""
Serveur de test de la borne — imite le futur backend, sans rien installer.

    python3 serveur.py              # port 8080
    python3 serveur.py --port 9000
    python3 serveur.py --reset      # repart d'une fausse base neuve

- La « base de données » est le fichier fausse_bdd.json, à côté de ce script.
  Mêmes noms de tables et de colonnes que la vraie base (Neon), pour que le
  passage au vrai backend ne change rien côté borne.
- http://localhost:8080 ouvre un tableau de bord qui joue aussi le rôle de
  l'app du votant (bouton « Déverrouiller la borne »).

Routes implémentées (v2, un échange par duel) — détail dans ../ROUTES.md :
    GET  /api/health
    GET  /api/bornes/{id}/etat              B2  borne, toutes les 2 s
    POST /api/bornes/{id}/choix             B3  borne, à chaque appui (A, B ou C)
    POST /api/bornes/{id}/abandon           B4  borne, appui long 5 s sur C
    POST /api/bornes/{id}/deverrouiller     A1  « fausse app » (tableau de bord)

Différence volontaire avec le vrai backend : pas de JWT. La fausse app dit
qui elle est avec {"idUtilisateur": 2} dans le corps de A1, et la borne ne
présente pas de clé.
"""

import argparse
import json
import os
import re
import socket
import threading
import time
import uuid
from collections import deque
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

DOSSIER = os.path.dirname(os.path.abspath(__file__))
FICHIER_BDD = os.path.join(DOSSIER, "fausse_bdd.json")
FICHIER_PAGE = os.path.join(DOSSIER, "tableau_de_bord.html")

DUREE_JETON = 5 * 60      # s — au-delà, le déverrouillage expire
DELAI_EN_LIGNE = 10       # s — sans appel B2 depuis ce délai, la borne est « hors ligne »
CHOIX_VALIDES = ("GAUCHE", "DROITE", "BLANC")

verrou = threading.Lock()
journal = deque(maxlen=80)
dernier_contact = {}      # id_borne -> time.time() du dernier B2 (en mémoire seulement)
dernier_etat_vu = {}      # id_borne -> dernière réponse de B2, pour ne journaliser que les changements


# ------------------------------------------------------------------
#  Fausse base de données
# ------------------------------------------------------------------

def bdd_initiale():
    # Les id de candidats ne se suivent pas exprès (3, 5, 8) : ça vérifie que
    # la borne n'utilise que les numéros de LED, jamais les id de la base.
    return {
        "periode_vote": [{"id_periode": 1, "statut": True}],
        "candidat": [
            {"id_candidat": 3, "id_periode": 1, "prenom": "Alexandre", "nom": "Moreau"},
            {"id_candidat": 5, "id_periode": 1, "prenom": "Claire", "nom": "Fontaine"},
            {"id_candidat": 8, "id_periode": 1, "prenom": "Yanis", "nom": "Belkacem"},
        ],
        "affrontement": [
            {"id_affrontement": 7, "id_candidat_1": 3, "id_candidat_2": 5},
            {"id_affrontement": 8, "id_candidat_1": 3, "id_candidat_2": 8},
            {"id_affrontement": 9, "id_candidat_1": 5, "id_candidat_2": 8},
        ],
        "utilisateur": [
            {"id_utilisateur": 1, "prenom": "Emma", "nom": "Martin"},
            {"id_utilisateur": 2, "prenom": "Karim", "nom": "Benali"},
            {"id_utilisateur": 3, "prenom": "Sofia", "nom": "Lemoine"},
            {"id_utilisateur": 4, "prenom": "Lucas", "nom": "Dupont"},
            {"id_utilisateur": 5, "prenom": "Hugo", "nom": "Pasinscrit"},
        ],
        # Hugo (5) n'a pas d'inscription : il doit être refusé.
        "inscription": [
            {"id_inscription": 101, "id_utilisateur": 1, "id_periode": 1},
            {"id_inscription": 102, "id_utilisateur": 2, "id_periode": 1},
            {"id_inscription": 103, "id_utilisateur": 3, "id_periode": 1},
            {"id_inscription": 104, "id_utilisateur": 4, "id_periode": 1},
        ],
        "borne": [{"id_borne": 1, "nom": "Isoloir 1", "etat": "LIBRE"}],
        "deverrouillage": [],
        # Choix reçus duel par duel, en attendant le dernier. Jamais comptés
        # dans les résultats : ils ne deviennent un bulletin qu'au dernier duel.
        "choix_provisoire": [],
        "bulletin": [],
        "ligne_vote": [],
    }


def charger_bdd(reset=False):
    if not reset and os.path.exists(FICHIER_BDD):
        with open(FICHIER_BDD, encoding="utf-8") as f:
            contenu = json.load(f)
        if "choix_provisoire" in contenu:
            return contenu
        print("  (fausse base d'une version précédente : réinitialisée)")
    bdd_neuve = bdd_initiale()
    sauver_bdd(bdd_neuve)
    return bdd_neuve


def sauver_bdd(b):
    tmp = FICHIER_BDD + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(b, f, ensure_ascii=False, indent=2)
    os.replace(tmp, FICHIER_BDD)


bdd = {}


def trouver(table, **critere):
    for ligne in bdd[table]:
        if all(ligne.get(k) == v for k, v in critere.items()):
            return ligne
    return None


def periode_ouverte():
    return trouver("periode_vote", statut=True)


def candidats_tries(id_periode):
    # Règle ROUTES.md B2 : numéro de LED = rang par id_candidat croissant.
    return sorted((c for c in bdd["candidat"] if c["id_periode"] == id_periode),
                  key=lambda c: c["id_candidat"])


def affrontements(id_periode):
    ids = {c["id_candidat"] for c in candidats_tries(id_periode)}
    return sorted((a for a in bdd["affrontement"] if a["id_candidat_1"] in ids),
                  key=lambda a: a["id_affrontement"])


def nom_candidat(id_candidat):
    c = trouver("candidat", id_candidat=id_candidat)
    return f'{c["prenom"]} {c["nom"]}' if c else f"#{id_candidat}"


def nom_votant(d):
    ins = trouver("inscription", id_inscription=d["id_inscription"])
    u = trouver("utilisateur", id_utilisateur=ins["id_utilisateur"])
    return f'{u["prenom"]} {u["nom"]}'


def choix_du_jeton(jeton):
    return [c for c in bdd["choix_provisoire"] if c["jeton"] == jeton]


def effacer_choix_provisoires(jeton):
    avant = len(bdd["choix_provisoire"])
    bdd["choix_provisoire"] = [c for c in bdd["choix_provisoire"] if c["jeton"] != jeton]
    return avant - len(bdd["choix_provisoire"])


def duel_courant(d):
    """(numéro 1..N, total N, affrontement) du premier duel sans choix, ou None si tous faits."""
    inscription = trouver("inscription", id_inscription=d["id_inscription"])
    liste = affrontements(inscription["id_periode"])
    faits = {c["id_affrontement"] for c in choix_du_jeton(d["jeton"])}
    for i, a in enumerate(liste):
        if a["id_affrontement"] not in faits:
            return i + 1, len(liste), a
    return None


def decrire_duel(numero, total, a, id_periode):
    leds = {c["id_candidat"]: i for i, c in enumerate(candidats_tries(id_periode))}
    return {"numero": numero, "total": total,
            "idAffrontement": a["id_affrontement"],
            "gauche": leds[a["id_candidat_1"]],
            "droite": leds[a["id_candidat_2"]]}


def resume_duel(a):
    return f'{nom_candidat(a["id_candidat_1"])} vs {nom_candidat(a["id_candidat_2"])}'


def traduire_choix(a, choix):
    if choix == "GAUCHE":
        return nom_candidat(a["id_candidat_1"])
    if choix == "DROITE":
        return nom_candidat(a["id_candidat_2"])
    return "vote blanc"


def expirer_jetons():
    """Un jeton ACTIF dépassé devient ABANDONNE, perd ses choix provisoires et libère sa borne."""
    maintenant = time.time()
    change = False
    for d in bdd["deverrouillage"]:
        if d["statut"] == "ACTIF" and d["expire_le"] < maintenant:
            d["statut"] = "ABANDONNE"
            effaces = effacer_choix_provisoires(d["jeton"])
            borne = trouver("borne", id_borne=d["id_borne"])
            if borne:
                borne["etat"] = "LIBRE"
            noter("serveur", f'jeton de {nom_votant(d)} expiré sur la borne {d["id_borne"]} : '
                             f'{effaces} choix provisoire(s) effacé(s), borne LIBRE')
            change = True
    if change:
        sauver_bdd(bdd)


# ------------------------------------------------------------------
#  Journal détaillé (console + tableau de bord)
#  recu    = corps de la requête reçue par le serveur
#  repondu = corps de la réponse renvoyée
# ------------------------------------------------------------------

def noter(qui, texte, code="", recu=None, repondu=None):
    ligne = {"heure": datetime.now().strftime("%H:%M:%S"), "qui": qui, "texte": texte,
             "code": code,
             "recu": None if recu is None else json.dumps(recu, ensure_ascii=False),
             "repondu": None if repondu is None else json.dumps(repondu, ensure_ascii=False)}
    journal.appendleft(ligne)
    print(f'{ligne["heure"]}  [{qui:<7}] {texte}' + (f"  → {code}" if code != "" else ""), flush=True)
    if ligne["recu"]:
        print(f'            reçu    : {ligne["recu"]}', flush=True)
    if ligne["repondu"]:
        print(f'            répondu : {ligne["repondu"]}', flush=True)


# ------------------------------------------------------------------
#  Routes
# ------------------------------------------------------------------

def route_etat(id_borne):
    """B2 — la borne demande si elle est déverrouillée. Sert aussi de battement de cœur."""
    borne = trouver("borne", id_borne=id_borne)
    if not borne:
        return 404, {"erreur": "borne inconnue"}

    premier_contact = id_borne not in dernier_contact or \
        time.time() - dernier_contact[id_borne] > DELAI_EN_LIGNE
    dernier_contact[id_borne] = time.time()
    if premier_contact:
        noter(f"borne {id_borne}", "connectée (premier appel de /etat)", 200)

    d = trouver("deverrouillage", id_borne=id_borne, statut="ACTIF")
    periode = periode_ouverte()
    courant = d and periode and duel_courant(d)
    if borne["etat"] != "DEVERROUILLEE" or not courant:
        reponse = {"etat": "LIBRE"}
    else:
        numero, total, a = courant
        reponse = {"etat": "DEVERROUILLEE",
                   "jeton": d["jeton"],
                   "nbCandidats": len(candidats_tries(periode["id_periode"])),
                   "duel": decrire_duel(numero, total, a, periode["id_periode"])}

    # On ne journalise que ce qui change : la borne appelle toutes les 2 s.
    if dernier_etat_vu.get(id_borne) != reponse:
        dernier_etat_vu[id_borne] = reponse
        if reponse["etat"] == "LIBRE":
            noter(f"borne {id_borne}", "GET /etat → LIBRE, en attente d'un votant", 200,
                  repondu=reponse)
        else:
            noter(f"borne {id_borne}",
                  f'GET /etat → DEVERROUILLEE pour {nom_votant(d)} : envoi du duel '
                  f'{numero}/{total} ({resume_duel(a)})', 200, repondu=reponse)
    return 200, reponse


def route_deverrouiller(id_borne, corps):
    """A1 — la « fausse app » réserve la borne pour un votant."""
    id_utilisateur = corps.get("idUtilisateur")
    if not isinstance(id_utilisateur, int):
        return 400, {"erreur": "idUtilisateur manquant (remplace le JWT dans ce serveur de test)"}

    periode = periode_ouverte()
    if not periode:
        return 423, {"erreur": "Scrutin fermé"}
    inscription = trouver("inscription", id_utilisateur=id_utilisateur,
                          id_periode=periode["id_periode"])
    if not inscription:
        return 403, {"erreur": "Non inscrit"}
    if trouver("bulletin", id_inscription=inscription["id_inscription"]):
        return 403, {"erreur": "A déjà voté"}
    if trouver("deverrouillage", id_inscription=inscription["id_inscription"], statut="ACTIF"):
        return 409, {"erreur": "Vote déjà en cours sur une borne"}
    borne = trouver("borne", id_borne=id_borne)
    if not borne:
        return 404, {"erreur": "Borne inconnue"}
    contact = dernier_contact.get(id_borne)
    if contact is None or time.time() - contact > DELAI_EN_LIGNE:
        return 503, {"erreur": "Borne hors ligne (aucun appel de /etat depuis 10 s)"}
    if borne["etat"] != "LIBRE":
        return 409, {"erreur": "Borne occupée"}

    bdd["deverrouillage"].append({
        "jeton": str(uuid.uuid4()),
        "id_borne": id_borne,
        "id_inscription": inscription["id_inscription"],
        "statut": "ACTIF",
        "cree_le": time.time(),
        "expire_le": time.time() + DUREE_JETON,
    })
    borne["etat"] = "DEVERROUILLEE"
    sauver_bdd(bdd)
    return 200, {"idBorne": id_borne, "message": f"Votez sur la borne {id_borne}"}


def finaliser_bulletin(d):
    """Dernier duel joué : les choix provisoires deviennent un bulletin, en une fois."""
    inscription = trouver("inscription", id_inscription=d["id_inscription"])
    attendus = {a["id_affrontement"]: a for a in affrontements(inscription["id_periode"])}
    id_bulletin = max((b["id_bulletin"] for b in bdd["bulletin"]), default=0) + 1
    bdd["bulletin"].append({"id_bulletin": id_bulletin,
                            "id_inscription": d["id_inscription"],
                            "depose_le": datetime.now().strftime("%Y-%m-%d")})
    for c in choix_du_jeton(d["jeton"]):
        a = attendus[c["id_affrontement"]]
        bdd["ligne_vote"].append({
            "id_bulletin": id_bulletin,
            "id_affrontement": c["id_affrontement"],
            "id_candidat_choisi": {"GAUCHE": a["id_candidat_1"],
                                   "DROITE": a["id_candidat_2"],
                                   "BLANC": None}[c["choix"]],
        })
    effacer_choix_provisoires(d["jeton"])
    d["statut"] = "UTILISE"
    trouver("borne", id_borne=d["id_borne"])["etat"] = "LIBRE"
    return id_bulletin


def route_choix(id_borne, corps):
    """
    B3 — la borne envoie le choix du duel en cours (A, B ou C).
    Réponse : le duel suivant, ou TERMINE si c'était le dernier (bulletin écrit).
    Renvoie aussi un texte lisible pour le journal.
    """
    jeton, ida, choix = corps.get("jeton"), corps.get("idAffrontement"), corps.get("choix")
    if not isinstance(jeton, str) or not isinstance(ida, int) or choix not in CHOIX_VALIDES:
        return 400, {"erreur": "corps attendu : {jeton, idAffrontement, choix: GAUCHE|DROITE|BLANC}"}, \
            "requête mal formée"

    d = trouver("deverrouillage", jeton=jeton, id_borne=id_borne)
    if not d:
        return 404, {"erreur": "jeton inconnu pour cette borne"}, "jeton inconnu"

    inscription = trouver("inscription", id_inscription=d["id_inscription"])
    attendus = {a["id_affrontement"]: a for a in affrontements(inscription["id_periode"])}
    if ida not in attendus:
        return 400, {"erreur": f"affrontement inconnu : {ida}"}, f"affrontement {ida} inconnu"
    a = attendus[ida]

    # Rejeu : la borne n'a pas reçu notre réponse et renvoie la même requête.
    if d["statut"] == "UTILISE":
        return 200, {"statut": "TERMINE"}, "rejeu après la fin du vote, rien d'écrit"
    if d["statut"] != "ACTIF":
        return 410, {"erreur": "jeton expiré ou abandonné"}, "jeton expiré ou abandonné"

    deja = next((c for c in choix_du_jeton(jeton) if c["id_affrontement"] == ida), None)
    if deja is None:
        courant = duel_courant(d)
        if courant[2]["id_affrontement"] != ida:
            return 409, {"erreur": f'duel attendu : affrontement {courant[2]["id_affrontement"]}'}, \
                f'hors séquence (attendu : affrontement {courant[2]["id_affrontement"]})'
        numero = courant[0]
        bdd["choix_provisoire"].append({"jeton": jeton, "id_affrontement": ida, "choix": choix})
        texte = (f'{nom_votant(d)}, duel {numero}/{courant[1]} ({resume_duel(a)}) : '
                 f'{choix} = {traduire_choix(a, choix)} → écrit (provisoire)')
    else:
        texte = f'rejeu du duel affrontement {ida} (déjà reçu : {deja["choix"]}), rien d\'écrit'

    suivant = duel_courant(d)
    if suivant:
        numero, total, prochain = suivant
        sauver_bdd(bdd)
        return 200, {"statut": "SUIVANT",
                     "duel": decrire_duel(numero, total, prochain, inscription["id_periode"])}, \
            texte + f' ; duel suivant {numero}/{total} ({resume_duel(prochain)})'

    id_bulletin = finaliser_bulletin(d)
    sauver_bdd(bdd)
    return 200, {"statut": "TERMINE"}, \
        texte + f' ; c\'était le dernier : bulletin n°{id_bulletin} versé dans l\'urne'


def route_abandon(id_borne, corps):
    """B4 — la borne annule le vote en cours (appui long 5 s sur C)."""
    jeton = corps.get("jeton")
    if not isinstance(jeton, str):
        return 400, {"erreur": "corps attendu : {jeton}"}, "requête mal formée"
    d = trouver("deverrouillage", jeton=jeton, id_borne=id_borne)
    if not d or d["statut"] != "ACTIF":
        return 204, None, "jeton déjà clos ou inconnu, rien à faire"
    effaces = effacer_choix_provisoires(jeton)
    d["statut"] = "ABANDONNE"
    trouver("borne", id_borne=id_borne)["etat"] = "LIBRE"
    sauver_bdd(bdd)
    return 204, None, (f'{nom_votant(d)} abandonne : {effaces} choix provisoire(s) effacé(s), '
                       f'borne LIBRE, le votant peut recommencer')


# ------------------------------------------------------------------
#  Vue d'ensemble pour le tableau de bord (hors contrat d'API)
# ------------------------------------------------------------------

def statut_utilisateur(u, periode):
    ins = periode and trouver("inscription", id_utilisateur=u["id_utilisateur"],
                              id_periode=periode["id_periode"])
    if not ins:
        return "non_inscrit", None
    if trouver("bulletin", id_inscription=ins["id_inscription"]):
        return "a_vote", None
    d = trouver("deverrouillage", id_inscription=ins["id_inscription"], statut="ACTIF")
    if d:
        return "en_cours", d["id_borne"]
    return "pas_vote", None


def resultats(periode):
    if not periode:
        return None
    duels = []
    victoires = {c["id_candidat"]: 0 for c in candidats_tries(periode["id_periode"])}
    voix = dict(victoires)
    for a in affrontements(periode["id_periode"]):
        lignes = [l for l in bdd["ligne_vote"] if l["id_affrontement"] == a["id_affrontement"]]
        v1 = sum(1 for l in lignes if l["id_candidat_choisi"] == a["id_candidat_1"])
        v2 = sum(1 for l in lignes if l["id_candidat_choisi"] == a["id_candidat_2"])
        blancs = sum(1 for l in lignes if l["id_candidat_choisi"] is None)
        voix[a["id_candidat_1"]] += v1
        voix[a["id_candidat_2"]] += v2
        gagnant = a["id_candidat_1"] if v1 > v2 else a["id_candidat_2"] if v2 > v1 else None
        if gagnant:
            victoires[gagnant] += 1
        duels.append({"idAffrontement": a["id_affrontement"],
                      "gauche": nom_candidat(a["id_candidat_1"]), "votesGauche": v1,
                      "droite": nom_candidat(a["id_candidat_2"]), "votesDroite": v2,
                      "blancs": blancs,
                      "gagnant": nom_candidat(gagnant) if gagnant else None})

    meilleur = max(victoires.values(), default=0)
    en_tete = [i for i, v in victoires.items() if v == meilleur]
    if not bdd["bulletin"] or meilleur == 0:
        resolution, vainqueur = "aucun_vainqueur", None
    elif len(en_tete) == 1:
        resolution, vainqueur = "vainqueur", nom_candidat(en_tete[0])
    elif len(en_tete) == len(victoires):
        resolution, vainqueur = "cycle_condorcet", None
    else:
        resolution, vainqueur = "egalite", None

    return {"duels": duels,
            "candidats": [{"nom": nom_candidat(i), "led": n + 1,
                           "victoires": victoires[i], "voix": voix[i]}
                          for n, i in enumerate(victoires)],
            "nbBulletins": len(bdd["bulletin"]),
            "resolution": resolution, "vainqueur": vainqueur}


def vue_ensemble():
    periode = periode_ouverte()
    maintenant = time.time()
    bornes = []
    for b in bdd["borne"]:
        contact = dernier_contact.get(b["id_borne"])
        d = trouver("deverrouillage", id_borne=b["id_borne"], statut="ACTIF")
        vote = None
        if d:
            courant = duel_courant(d)
            recus = []
            for c in choix_du_jeton(d["jeton"]):
                a = trouver("affrontement", id_affrontement=c["id_affrontement"])
                recus.append({"duel": resume_duel(a), "choix": c["choix"],
                              "pour": traduire_choix(a, c["choix"])})
            vote = {"votant": nom_votant(d),
                    "expireDans": int(d["expire_le"] - maintenant),
                    "duelEnCours": None if not courant else
                    {"numero": courant[0], "total": courant[1], "duel": resume_duel(courant[2])},
                    "choixRecus": recus}
        bornes.append({"idBorne": b["id_borne"], "nom": b["nom"], "etat": b["etat"],
                       "enLigne": contact is not None and maintenant - contact <= DELAI_EN_LIGNE,
                       "secondesDepuisContact": None if contact is None else round(maintenant - contact, 1),
                       "vote": vote})
    electeurs = []
    for u in bdd["utilisateur"]:
        statut, id_borne = statut_utilisateur(u, periode)
        electeurs.append({"idUtilisateur": u["id_utilisateur"],
                          "nom": f'{u["prenom"]} {u["nom"]}',
                          "statut": statut, "idBorne": id_borne})
    return {"scrutinOuvert": bool(periode), "bornes": bornes, "electeurs": electeurs,
            "resultats": resultats(periode), "journal": list(journal)}


# ------------------------------------------------------------------
#  HTTP
# ------------------------------------------------------------------

RE_BORNE = re.compile(r"^/api/bornes/(\d+)/(etat|choix|abandon|deverrouiller)$")


class Gestionnaire(BaseHTTPRequestHandler):
    server_version = "BorneTest/2"

    def log_message(self, *args):
        pass    # journal maison à la place

    def envoyer(self, code, contenu, type_contenu="application/json; charset=utf-8"):
        if contenu is None:
            corps = b""
        elif isinstance(contenu, bytes):
            corps = contenu
        else:
            corps = json.dumps(contenu, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        if corps:
            self.send_header("Content-Type", type_contenu)
        self.send_header("Content-Length", str(len(corps)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if corps:
            self.wfile.write(corps)

    def lire_corps(self):
        taille = int(self.headers.get("Content-Length") or 0)
        brut = self.rfile.read(taille) if taille else b""
        if not brut:
            return {}, ""
        texte = brut.decode("utf-8", errors="replace")
        try:
            return json.loads(texte), texte
        except json.JSONDecodeError:
            return None, texte

    def do_GET(self):
        chemin = urlparse(self.path).path
        if chemin in ("/", "/index.html"):
            with open(FICHIER_PAGE, "rb") as f:
                return self.envoyer(200, f.read(), "text/html; charset=utf-8")
        if chemin == "/api/health":
            noter("borne", f"GET /api/health depuis {self.client_address[0]} (démarrage)", 200)
            return self.envoyer(200, {"status": "ok"})
        if chemin == "/debug/vue":
            with verrou:
                expirer_jetons()
                return self.envoyer(200, vue_ensemble())
        m = RE_BORNE.match(chemin)
        if m and m.group(2) == "etat":
            with verrou:
                expirer_jetons()
                code, rep = route_etat(int(m.group(1)))
            return self.envoyer(code, rep)
        self.envoyer(404, {"erreur": "route inconnue"})

    def do_POST(self):
        global bdd
        chemin = urlparse(self.path).path
        corps, texte = self.lire_corps()

        if chemin == "/debug/reset":
            with verrou:
                bdd = charger_bdd(reset=True)
                dernier_etat_vu.clear()
                noter("serveur", "fausse base réinitialisée")
            return self.envoyer(200, {"ok": True})

        m = RE_BORNE.match(chemin)
        if not m or m.group(2) == "etat":
            return self.envoyer(404, {"erreur": "route inconnue"})
        id_borne, action = int(m.group(1)), m.group(2)
        qui = "app" if action == "deverrouiller" else f"borne {id_borne}"
        if corps is None:
            noter(qui, f"POST /{action} — JSON illisible : {texte[:80]}", 400)
            return self.envoyer(400, {"erreur": "JSON illisible"})
        if not isinstance(corps, dict):
            corps = {}      # les routes répondront 400 sur les champs manquants

        with verrou:
            expirer_jetons()
            if action != "deverrouiller":
                dernier_contact[id_borne] = time.time()   # tout appel de la borne = signe de vie
            if action == "deverrouiller":
                code, rep = route_deverrouiller(id_borne, corps)
                u = trouver("utilisateur", id_utilisateur=corps.get("idUtilisateur"))
                nom = f'{u["prenom"]} {u["nom"]}' if u else corps.get("idUtilisateur")
                noter(qui, f"POST /deverrouiller : {nom} déverrouille la borne {id_borne} — "
                           f'{rep.get("message") or rep.get("erreur")}', code, corps, rep)
            elif action == "choix":
                code, rep, resume = route_choix(id_borne, corps)
                noter(qui, f"POST /choix : {resume}", code, corps, rep)
            else:
                code, rep, resume = route_abandon(id_borne, corps)
                noter(qui, f"POST /abandon (appui long 5 s) : {resume}", code, corps, rep)
        self.envoyer(code, rep)


def ip_locale():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))   # aucun paquet n'est envoyé
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def main():
    global bdd
    parser = argparse.ArgumentParser(description="Serveur de test de la borne")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--reset", action="store_true", help="repartir d'une fausse base neuve")
    args = parser.parse_args()

    bdd = charger_bdd(reset=args.reset)
    ip = ip_locale()
    print()
    print("  Serveur de test de la borne (v2 : un échange par duel)")
    print("  ─────────────────────────────────────────────────────")
    print(f"  Tableau de bord : http://localhost:{args.port}")
    print(f"  Pour la borne   : http://{ip}:{args.port}   ← à recopier dans config.h (SERVEUR)")
    print(f"  Fausse base     : {FICHIER_BDD}")
    print("  Ctrl+C pour arrêter.")
    print()

    serveur = ThreadingHTTPServer(("0.0.0.0", args.port), Gestionnaire)
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print("\n  Arrêt.")


if __name__ == "__main__":
    main()
