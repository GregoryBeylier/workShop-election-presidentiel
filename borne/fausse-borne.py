#!/usr/bin/env python3
"""
Fausse borne ESP32, pour une démo ou un test sans la carte.

Elle appelle exactement les mêmes routes que la vraie borne (borne/API.md) :
  - GET  /api/borne/etat  toutes les 2 s tant qu'elle est libre ;
  - POST /api/borne/choix à chaque touche A (gauche), B (droite) ou C (blanc).

Usage :
  python3 borne/fausse-borne.py <clé borne> [adresse du back]
  python3 borne/fausse-borne.py 3f9a...  http://localhost:8080

La clé borne est celle affichée à la création de l'isoloir (Admin → Isoloirs), ligne CLE_BORNE.
Uniquement la bibliothèque standard de Python 3. Ctrl+C pour arrêter.
"""
import json
import sys
import time
import urllib.error
import urllib.request

PERIODE = 2  # secondes entre deux GET /etat, comme la vraie borne
BOUTONS = {"A": "GAUCHE", "B": "DROITE", "C": "BLANC"}


def appel(serveur, cle, methode, chemin, corps=None):
    """Renvoie (code HTTP, JSON ou None). Code 0 = serveur injoignable."""
    donnees = json.dumps(corps).encode() if corps is not None else None
    requete = urllib.request.Request(serveur + chemin, data=donnees, method=methode)
    requete.add_header("X-Borne-Cle", cle)
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


def voter(serveur, cle, jeton, duel):
    """Joue les duels au clavier jusqu'à TERMINE (ou une erreur, comme la vraie borne)."""
    while True:
        afficher_duel(duel)
        touche = ""
        while touche not in BOUTONS:
            touche = input("  Bouton (A / B / C) : ").strip().upper()
        choix = BOUTONS[touche]
        code, rep = appel(serveur, cle, "POST", "/api/borne/choix",
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
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cle = sys.argv[1].strip()
    serveur = (sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8080").rstrip("/")

    print(f"Fausse borne → {serveur}  (Ctrl+C pour arrêter)")
    dernier = None
    while True:
        code, rep = appel(serveur, cle, "GET", "/api/borne/etat")
        if code == 401:
            etat = "HORS SERVICE : clé refusée (401). Vérifier la clé ou l'isoloir (désactivé ?)"
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
            voter(serveur, cle, rep["jeton"], rep["duel"])
            dernier = None
        time.sleep(PERIODE)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nFausse borne arrêtée.")
