#!/usr/bin/env python3
"""
Fausse borne ESP32, pour une démo ou un test sans la carte.

Elle appelle exactement les mêmes routes que la vraie borne (borne/API.md) :
  - GET  /api/borne/etat  toutes les 2 s tant qu'elle est libre ;
  - POST /api/borne/choix à chaque touche A (gauche), B (droite) ou C (blanc).

Usage :
  python3 borne/fausse-borne.py [adresse du back]
  python3 borne/fausse-borne.py http://localhost:8080

Le serveur reconnaît la borne à son IP : créer l'isoloir (Admin → Isoloirs) avec l'IP de la machine
qui lance ce script, vue par le back (127.0.0.1 si le back tourne sur la même machine hors Docker).
Uniquement la bibliothèque standard de Python 3. Ctrl+C pour arrêter.
"""
import json
import sys
import time
import urllib.error
import urllib.request

PERIODE = 2  # secondes entre deux GET /etat, comme la vraie borne
BOUTONS = {"A": "GAUCHE", "B": "DROITE", "C": "BLANC"}


def appel(serveur, methode, chemin, corps=None):
    """Renvoie (code HTTP, JSON ou None). Code 0 = serveur injoignable."""
    donnees = json.dumps(corps).encode() if corps is not None else None
    requete = urllib.request.Request(serveur + chemin, data=donnees, method=methode)
    if donnees is not None:
        requete.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(requete, timeout=3) as reponse:
            texte = reponse.read().decode()
            return reponse.status, json.loads(texte) if texte else None
    except urllib.error.HTTPError as e:
        return e.code, None
    except (urllib.error.URLError, TimeoutError, ConnectionError):
        return 0, None


def afficher_duel(duel):
    print(f"\n  DUEL {duel['numero']} / {duel['total']}  (affrontement {duel['idAffrontement']})")
    print(f"    A = gauche : candidat LED {duel['gauche'] + 1}")
    print(f"    B = droite : candidat LED {duel['droite'] + 1}")
    print("    C = blanc")


def voter(serveur, jeton, duel):
    """Joue les duels au clavier jusqu'à TERMINE (ou une erreur, comme la vraie borne)."""
    while True:
        afficher_duel(duel)
        touche = ""
        while touche not in BOUTONS:
            touche = input("  Bouton (A / B / C) : ").strip().upper()
        choix = BOUTONS[touche]
        code, rep = appel(serveur, "POST", "/api/borne/choix",
                          {"jeton": jeton, "idAffrontement": duel["idAffrontement"], "choix": choix})
        if code != 200:
            print(f"  ✗ POST /choix → {code or 'serveur injoignable'} : la borne se reverrouille")
            return
        if rep["statut"] == "TERMINE":
            print(f"  ♪ {choix} enregistré. VOTE TERMINÉ : bulletin dans l'urne.\n")
            return
        print(f"  ♪ {choix} enregistré, duel suivant…")
        duel = rep["duel"]


def main():
    sys.stdout.reconfigure(line_buffering=True)
    if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)
    serveur = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080").rstrip("/")

    print(f"Fausse borne → {serveur}  (Ctrl+C pour arrêter)")
    dernier = None
    while True:
        code, rep = appel(serveur, "GET", "/api/borne/etat")
        if code == 401:
            etat = "HORS SERVICE : borne refusée (401). Vérifier l'IP de la borne dans l'isoloir (logs du back), ou l'isoloir désactivé"
        elif code != 200:
            etat = f"HORS LIGNE : {'serveur injoignable' if code == 0 else f'erreur {code}'} (les LED clignoteraient)"
        else:
            etat = rep["etat"]
        if etat != dernier:
            libelle = "LIBRE : LED éteintes, en attente d'un votant" if etat == "LIBRE" else etat
            print(f"[{time.strftime('%H:%M:%S')}] {libelle}")
            dernier = etat
        if code == 200 and rep["etat"] == "DEVERROUILLEE":
            print("  ♪♪ Borne déverrouillée par un scan.")
            voter(serveur, rep["jeton"], rep["duel"])
            dernier = None
        time.sleep(PERIODE)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nFausse borne arrêtée.")
