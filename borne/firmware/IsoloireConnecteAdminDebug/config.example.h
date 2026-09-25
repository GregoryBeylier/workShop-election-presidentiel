// ============================================================
//  MODELE de config.h — a copier en config.h puis a remplir.
//  config.h contient le mot de passe Wi-Fi : il n'est jamais
//  commite (voir .gitignore).
// ============================================================
#pragma once

// Reseau Wi-Fi en 2,4 GHz (l'ESP32-C3 ne voit pas le 5 GHz).
// L'ordinateur qui fait tourner serveur.py doit etre sur le
// MEME reseau.
const char* const WIFI_SSID = "NOM_DU_WIFI";
const char* const WIFI_MDP  = "MOT_DE_PASSE";

// Adresse du serveur, SANS slash final. serveur.py l'affiche au
// demarrage (ligne "Pour la borne"). Jamais localhost : pour la
// borne, localhost c'est elle-meme.
const char* const SERVEUR = "http://192.168.1.10:8080";

// Cle de la borne (API v2), envoyee dans l'en-tete X-Borne-Cle sur
// /api/borne/etat et /api/borne/choix. C'est elle qui dit au serveur
// de quel isoloir il s'agit. Vide = en-tete non envoye (si le back
// ne la verifie pas encore). Une par borne : openssl rand -hex 24
const char* const CLE_BORNE = "";

// ============================================================
//  DIAGNOSTIC / MAINTENANCE (specifique a IsoloireConnecteAdmin)
// ============================================================

// Point d'acces Wi-Fi de service ouvert par la borne, EN PLUS de
// sa connexion au Wi-Fi de l'evenement (mode AP+STA). Sert a
// joindre l'auto-test du materiel depuis un telephone, meme si le
// Wi-Fi de la salle tombe.
const char* const SERVICE_AP_SSID  = "borne-diag";       // nom du reseau de service
const char* const SERVICE_AP_CLE   = "change-moi-min8";  // WPA2 : 8 caracteres MINIMUM
const bool        SERVICE_AP_CACHE = false;              // true = SSID masque (option)

// Acces au diagnostic (demandes par le navigateur).
const char* const DIAG_ID = "identifiant-a-toi";
const char* const DIAG_CLE = "mot-de-passe-fort";
