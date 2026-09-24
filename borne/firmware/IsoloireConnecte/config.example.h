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

// Numero de la borne, celui de /api/bornes/{id}/...
const int ID_BORNE = 1;
