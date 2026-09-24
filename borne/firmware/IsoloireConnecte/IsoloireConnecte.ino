// ============================================================
//   BORNE ISOLOIRE — VERSION CONNECTEE  (v2 : un echange par duel)
//
//   Base : IsoloireBuzzer (reference testee). Meme cablage,
//   memes boutons, meme jingle. Deroulement :
//
//     1. VERROUILLEE : la borne demande au serveur, toutes les
//        2 s, si un votant l'a deverrouillee.       GET  /etat
//     2. Le serveur repond DEVERROUILLEE + jeton + le PREMIER
//        duel. La borne l'affiche.
//     3. Le votant appuie (A, B, ou C court = blanc). Le choix
//        part AUSSITOT au serveur, qui l'ecrit et
//        renvoie le duel SUIVANT.                    POST /choix
//     4. ... jusqu'au dernier duel : le serveur repond TERMINE
//        (il a verse le bulletin dans l'urne). La borne se
//        reverrouille.
//     *  Appui long 5 s sur C pendant un vote : la borne annule
//        le vote aupres du serveur.                  POST /abandon
//
//   C'est le serveur qui sait ou en est le votant : si la borne
//   redemarre en plein vote, elle reprend au bon duel.
//
//   Chaque echange est trace sur la console : requete envoyee,
//   reponse recue, duree. Seul l'interrogation toutes les 2 s
//   n'est tracee que lorsque la reponse change.
//
//   Signaux pour le votant (pas d'ecran) :
//     LED eteintes          borne libre, en attente d'un votant
//     toutes LED clignotent probleme reseau ou serveur
//     chenillard            connexion au Wi-Fi en cours
//     2 bips montants       borne deverrouillee, a vous
//     arpege                choix enregistre par le serveur
//     arpege long           dernier choix : bulletin dans l'urne
//     2 notes graves        choix refuse ou non transmis
//     double flash          vote annule (appui long sur C)
//
//   A PREPARER AVANT DE TELEVERSER :
//     1. Bibliotheque ArduinoJson (Benoit Blanchon), v7
//     2. config.h : Wi-Fi + adresse du serveur (modele :
//        config.example.h)
//     3. Tools -> USB CDC On Boot -> Enabled
//
//   Contrat d'API complet : borne/ROUTES.md
// ============================================================

#if !defined(CONFIG_IDF_TARGET_ESP32C3)
#error "Brochage prevu pour un ESP32-C3 SuperMini. Selectionner 'ESP32C3 Dev Module' dans Tools > Board."
#endif

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

// ---------- Configuration ----------
const int NB_CANDIDATS = 3;   // paires de LED cablees

// Trace des LED, des boutons et releve periodique. Les echanges
// avec le serveur sont TOUJOURS traces, quel que soit ce reglage.
const bool MODE_TEST = true;
const unsigned long PERIODE_RELEVE = 5000;   // ms
// -----------------------------------

// ---------- Cablage (identique a IsoloireBuzzer) ----------
const int LED_GAUCHE[NB_CANDIDATS] = { 0, 1, 3 };
const int LED_DROITE[NB_CANDIDATS] = { 5, 6, 7 };
const int BUZZER_PIN = 20;

const int BTN_A = 2;    // GAUCHE
const int BTN_B = 8;    // DROITE
const int BTN_C = 9;    // BLANC (court) / annulation (5 s)

const bool BOUTONS_ACTIF_HAUT = false;   // GPIO -> bouton -> GND
// ----------------------------------------------------------

const int NB_LEDS = NB_CANDIDATS * 2;

const unsigned long DUREE_VALIDATION  = 3000;  // ms de pause entre duels
const unsigned long ANTI_REBOND       = 50;
const unsigned long PAS_CHENILLARD    = 120;
const unsigned long DUREE_APPUI_LONG  = 5000;
const unsigned long DUREE_MELODIE_MAX = 3000;

// ---------- Reseau ----------
const unsigned long PERIODE_INTERROGATION = 2000;  // ms entre deux GET /etat
const uint16_t      TIMEOUT_HTTP          = 1500;  // ms
const int           NB_TENTATIVES         = 5;     // pour POST /choix
const unsigned long PAUSE_ENTRE_ESSAIS    = 3000;  // ms
const unsigned long PERIODE_CLIGNOTEMENT  = 500;   // ms, signal d'anomalie
// ----------------------------

// ---------- Melodies ----------
const int DO4 = 262, SOL4 = 392;
const int DO5 = 523, MI5 = 659, SOL5 = 784, DO6 = 1047;

struct NoteJingle { int frequence; int duree; };   // frequence 0 = silence

const NoteJingle MELODIE_VALIDATION[]   = { {DO5,90}, {MI5,90}, {SOL5,90}, {DO6,280} };
const NoteJingle MELODIE_DEVERROUILLE[] = { {SOL5,90}, {0,40}, {DO6,160} };
const NoteJingle MELODIE_ENREGISTRE[]   = { {DO5,90}, {MI5,90}, {SOL5,90}, {DO6,150},
                                            {SOL5,90}, {DO6,400} };
const NoteJingle MELODIE_ERREUR[]       = { {SOL4,250}, {0,80}, {DO4,500} };
#define NB_NOTES(m) (int)(sizeof(m) / sizeof(m[0]))
// ------------------------------

// ############################################################
//  IMPORTANT — NE PAS DEPLACER CE BLOC PLUS BAS
//
//  L'IDE Arduino insere les prototypes generes juste avant la
//  PREMIERE fonction du fichier. Tout type utilise dans une
//  signature de fonction doit donc etre declare avant elle,
//  sinon : "variable or field '...' declared void".
// ############################################################

enum Etat  { VERROUILLEE, VOTE, VALIDATION };
enum Choix { GAUCHE, DROITE, BLANC };
enum Front { RIEN, APPUI, RELACHE, APPUI_LONG };

const char* NOM_ETAT[]  = { "VERROUILLEE", "VOTE", "VALIDATION" };
const char* NOM_CHOIX[] = { "GAUCHE", "DROITE", "BLANC" };

// Un duel tel que fourni par le serveur. gauche / droite sont des
// NUMEROS DE LED (0..NB_CANDIDATS-1), jamais des id de base.
struct Duel {
  int numero;           // 1..total
  int total;
  int idAffrontement;   // renvoye tel quel dans POST /choix
  uint8_t gauche, droite;
};

struct Bouton {
  int pin;
  const char* nom;
  bool stable;
  bool brut;
  bool longEmis;
  unsigned long change;
  unsigned long debutAppui;

  Bouton(int p, const char* n)
    : pin(p), nom(n), stable(false), brut(false), longEmis(false),
      change(0), debutAppui(0) {}

  void init() {
    pinMode(pin, BOUTONS_ACTIF_HAUT ? INPUT_PULLDOWN : INPUT_PULLUP);
  }

  int niveau() { return digitalRead(pin); }

  // APPUI a l'enfoncement, APPUI_LONG au seuil des 5 s, RELACHE
  // au relachement sauf si l'action longue a deja eu lieu.
  Front lire() {
    bool lecture = ((digitalRead(pin) == HIGH) == BOUTONS_ACTIF_HAUT);
    if (lecture != brut) {
      brut = lecture;
      change = millis();
    }

    if (millis() - change > ANTI_REBOND && lecture != stable) {
      stable = lecture;
      if (stable) {
        debutAppui = millis();
        longEmis = false;
        return APPUI;
      }
      return longEmis ? RIEN : RELACHE;
    }

    if (stable && !longEmis && millis() - debutAppui >= DUREE_APPUI_LONG) {
      longEmis = true;
      return APPUI_LONG;
    }

    return RIEN;
  }
};

Bouton btnA(BTN_A, "A");
Bouton btnB(BTN_B, "B");
Bouton btnC(BTN_C, "C");

// ---------- Etat du vote ----------
Etat etat = VERROUILLEE;
Duel duelActuel;          // celui affiche sur les LED
Duel duelSuivant;         // recu du serveur, affiche apres la pause
char jeton[48] = "";

unsigned long debutValidation = 0;
unsigned long dernierReleve = 0;

// ---------- Etat du reseau ----------
unsigned long dernierAppel = 0;
bool   anomalie = true;            // LED clignotantes tant que rien n'est confirme
String derniereReponseEtat = "";   // pour ne tracer GET /etat que s'il change

bool etatLeds[NB_LEDS];

// ---------- Lecteur de melodie non bloquant ----------
const NoteJingle* melodie = nullptr;
int nbNotesMelodie = 0;
int noteCourante = -1;             // -1 = rien en cours
unsigned long debutNote = 0;
unsigned long debutMelodie = 0;

// ------------------------------------------------------------
//  Buzzer — lecteur de melodie non bloquant
// ------------------------------------------------------------
void jouerNote(int i) {
  if (melodie[i].frequence == 0) noTone(BUZZER_PIN);
  else                           tone(BUZZER_PIN, melodie[i].frequence);
}

void arreterMelodie() {
  noTone(BUZZER_PIN);
  noteCourante = -1;
}

void demarrerMelodie(const NoteJingle* m, int n) {
  melodie        = m;
  nbNotesMelodie = n;
  noteCourante   = 0;
  debutNote      = millis();
  debutMelodie   = millis();
  jouerNote(0);
}

void majMelodie() {
  if (noteCourante < 0) return;

  if (millis() - debutMelodie >= DUREE_MELODIE_MAX) {
    arreterMelodie();
    return;
  }
  if (millis() - debutNote < (unsigned long)melodie[noteCourante].duree) return;

  noteCourante++;
  if (noteCourante >= nbNotesMelodie) {
    arreterMelodie();
    return;
  }
  debutNote = millis();
  jouerNote(noteCourante);
}

bool melodieEnCours() { return noteCourante >= 0; }

// ------------------------------------------------------------
//  LED
// ------------------------------------------------------------
int idxGauche(int led) { return led; }
int idxDroite(int led) { return NB_CANDIDATS + led; }

int pinDeLed(int index) {
  if (index < NB_CANDIDATS) return LED_GAUCHE[index];
  return LED_DROITE[index - NB_CANDIDATS];
}

void ecrireLed(int index, bool allumee) {
  etatLeds[index] = allumee;
  digitalWrite(pinDeLed(index), allumee ? HIGH : LOW);
}

void eteindreTout() {
  for (int i = 0; i < NB_LEDS; i++) ecrireLed(i, false);
}

void allumerSeule(int index) {
  for (int i = 0; i < NB_LEDS; i++) ecrireLed(i, i == index);
}

void doubleFlash() {
  for (int f = 0; f < 2; f++) {
    for (int i = 0; i < NB_LEDS; i++) ecrireLed(i, true);
    delay(120);
    eteindreTout();
    delay(120);
  }
}

void chenillard() {
  static unsigned long dernierPas = 0;
  static int index = 0;
  if (millis() - dernierPas < PAS_CHENILLARD) return;
  dernierPas = millis();
  allumerSeule(index);
  index = (index + 1) % NB_LEDS;
}

// Toutes les LED clignotent ensemble : probleme reseau/serveur.
void clignoterAnomalie() {
  static unsigned long dernier = 0;
  static bool allume = false;
  if (millis() - dernier < PERIODE_CLIGNOTEMENT) return;
  dernier = millis();
  allume = !allume;
  for (int i = 0; i < NB_LEDS; i++) ecrireLed(i, allume);
}

// ------------------------------------------------------------
//  Journal
// ------------------------------------------------------------
void imprimerCarte() {
  Serial.print("G[");
  for (int i = 0; i < NB_CANDIDATS; i++) Serial.print(etatLeds[idxGauche(i)] ? '#' : '.');
  Serial.print("] D[");
  for (int i = 0; i < NB_CANDIDATS; i++) Serial.print(etatLeds[idxDroite(i)] ? '#' : '.');
  Serial.print("] BUZ[");
  Serial.print(melodieEnCours() ? '*' : '.');
  Serial.print(']');
}

void journalLeds(const char* contexte) {
  if (!MODE_TEST) return;
  Serial.printf("  [LED] %-20s ", contexte);
  imprimerCarte();
  Serial.println();
}

const char* nomFront(Front f) {
  switch (f) {
    case APPUI:      return "APPUI";
    case RELACHE:    return "relache";
    case APPUI_LONG: return "LONG 5s";
    default:         return "-";
  }
}

void journalBouton(Bouton& b, Front f, const char* role) {
  if (!MODE_TEST || f == RIEN) return;
  Serial.printf("  [BTN] %s  %-8s GPIO %-2d niveau %s   (%s)\n",
                b.nom, nomFront(f), b.pin,
                b.niveau() == HIGH ? "HIGH" : "LOW ", role);
}

void releveEtat() {
  if (!MODE_TEST) return;
  if (millis() - dernierReleve < PERIODE_RELEVE) return;
  dernierReleve = millis();

  Serial.printf("  [ETAT] %-11s ", NOM_ETAT[etat]);
  if (etat != VERROUILLEE) Serial.printf("duel %d/%d  ", duelActuel.numero, duelActuel.total);
  imprimerCarte();
  Serial.printf("  WiFi %s", WiFi.status() == WL_CONNECTED ? "ok" : "PERDU");
  if (WiFi.status() == WL_CONNECTED) Serial.printf(" (%d dBm)", WiFi.RSSI());
  Serial.printf("  BTN A=%d B=%d C=%d\n", btnA.niveau(), btnB.niveau(), btnC.niveau());
}

void titre(const char* texte) {
  Serial.println();
  Serial.printf("======== %s ========\n", texte);
}

// ------------------------------------------------------------
//  HTTP
//  Renvoie le code HTTP, ou un code negatif en cas d'erreur
//  reseau (serveur injoignable, timeout, Wi-Fi perdu).
//  tracer = false seulement pour l'interrogation toutes les 2 s.
// ------------------------------------------------------------
const int ERREUR_WIFI = -100;

String decrireCode(int code) {
  if (code == ERREUR_WIFI) return "Wi-Fi non connecte";
  if (code < 0) return HTTPClient::errorToString(code);
  return "HTTP " + String(code);
}

int requeteHttp(const char* methode, const String& chemin,
                const String& corps, String& reponse, bool tracer) {
  reponse = "";
  if (tracer) {
    Serial.printf("  [API] >>> %s %s%s\n", methode, SERVEUR, chemin.c_str());
    if (corps.length()) Serial.printf("            envoye  : %s\n", corps.c_str());
  }

  if (WiFi.status() != WL_CONNECTED) {
    if (tracer) Serial.println("  [API] <<< ECHEC : Wi-Fi non connecte");
    return ERREUR_WIFI;
  }

  HTTPClient http;
  http.setConnectTimeout(TIMEOUT_HTTP);
  http.setTimeout(TIMEOUT_HTTP);
  http.begin(String(SERVEUR) + chemin);

  unsigned long debut = millis();
  int code;
  if (strcmp(methode, "POST") == 0) {
    http.addHeader("Content-Type", "application/json");
    code = http.POST(corps);
  } else {
    code = http.GET();
  }
  if (code > 0) reponse = http.getString();
  http.end();

  if (tracer) {
    if (code > 0) Serial.printf("  [API] <<< %d  (%lu ms)\n", code, millis() - debut);
    else          Serial.printf("  [API] <<< ECHEC : %s  (%lu ms)\n",
                                decrireCode(code).c_str(), millis() - debut);
    if (reponse.length()) Serial.printf("            recu    : %s\n", reponse.c_str());
  }
  return code;
}

// ------------------------------------------------------------
//  Connexion au Wi-Fi (bloquante : sans reseau, la borne ne
//  peut rien faire). Chenillard pendant l'attente.
// ------------------------------------------------------------
void connecterWifi() {
  Serial.printf("\n  Connexion au Wi-Fi \"%s\"", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_MDP);

  // Les ESP32-C3 SuperMini ont une antenne mal adaptee : a pleine
  // puissance, beaucoup n'arrivent jamais a se connecter. Baisser
  // la puissance d'emission regle le probleme dans la plupart des
  // cas (la portee reste largement suffisante dans une salle).
  WiFi.setTxPower(WIFI_POWER_8_5dBm);

  unsigned long debut = millis();
  unsigned long dernierPoint = 0;
  while (WiFi.status() != WL_CONNECTED) {
    chenillard();
    if (millis() - dernierPoint >= 1000) {
      dernierPoint = millis();
      Serial.print('.');
    }
    if (millis() - debut >= 20000) {
      Serial.println();
      Serial.println("  Toujours pas connecte. A verifier :");
      Serial.println("    - WIFI_SSID / WIFI_MDP dans config.h");
      Serial.println("    - reseau en 2,4 GHz (l'ESP32-C3 ne voit pas le 5 GHz)");
      Serial.println("    - partage de connexion iPhone : activer");
      Serial.println("      'Maximiser la compatibilite'");
      Serial.print("  Nouvel essai");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_MDP);
      debut = millis();
    }
  }
  eteindreTout();
  Serial.println();
  Serial.printf("  Wi-Fi connecte. IP de la borne : %s  (signal %d dBm)\n",
                WiFi.localIP().toString().c_str(), WiFi.RSSI());
}

void testerServeur() {
  titre("TEST DU SERVEUR");
  String reponse;
  int code = requeteHttp("GET", "/api/health", "", reponse, true);
  if (code == 200) {
    Serial.println("  Serveur joignable.");
  } else {
    Serial.println("  Serveur INJOIGNABLE. A verifier :");
    Serial.println("    - serveur.py tourne-t-il sur l'ordinateur ?");
    Serial.println("    - SERVEUR dans config.h = l'IP affichee par serveur.py ?");
    Serial.println("    - l'ordinateur et la borne sont sur le meme Wi-Fi ?");
    Serial.println("    - pare-feu macOS : autoriser Python a recevoir des connexions");
    Serial.println("  La borne va reessayer toutes les 2 s (LED clignotantes).");
  }
}

// ------------------------------------------------------------
//  Lecture d'un duel envoye par le serveur. Refuse tout ce qui
//  ne colle pas au cablage : mieux vaut une borne hors service
//  qu'un vote mal attribue.
// ------------------------------------------------------------
bool lireDuel(JsonObject d, Duel& sortie, String& erreur) {
  if (d.isNull()) { erreur = "duel absent"; return false; }
  int g  = d["gauche"] | -1;
  int dr = d["droite"] | -1;
  int id = d["idAffrontement"] | -1;
  int numero = d["numero"] | -1;
  int total  = d["total"] | -1;
  if (id < 0 || numero < 1 || total < numero) { erreur = "duel incomplet"; return false; }
  if (g < 0 || g >= NB_CANDIDATS || dr < 0 || dr >= NB_CANDIDATS || g == dr) {
    erreur = "numeros de LED hors cablage (gauche=" + String(g) + ", droite=" + String(dr) + ")";
    return false;
  }
  sortie.idAffrontement = id;
  sortie.numero = numero;
  sortie.total  = total;
  sortie.gauche = g;
  sortie.droite = dr;
  return true;
}

// ------------------------------------------------------------
//  B2 — GET /api/bornes/{id}/etat  (toutes les 2 s)
// ------------------------------------------------------------
void interrogerServeur() {
  String reponse;
  String chemin = "/api/bornes/" + String(ID_BORNE) + "/etat";
  int code = requeteHttp("GET", chemin, "", reponse, false);

  // Trace complete, mais seulement si la reponse a change depuis
  // le dernier appel : sinon une ligne toutes les 2 s.
  String signature = String(code) + reponse;
  bool nouveau = signature != derniereReponseEtat;
  derniereReponseEtat = signature;
  if (nouveau) {
    titre("INTERROGATION DU SERVEUR (toutes les 2 s)");
    Serial.printf("  [API] >>> GET %s%s\n", SERVEUR, chemin.c_str());
    if (code > 0) Serial.printf("  [API] <<< %d\n", code);
    else          Serial.printf("  [API] <<< ECHEC : %s\n", decrireCode(code).c_str());
    if (reponse.length()) Serial.printf("            recu    : %s\n", reponse.c_str());
  }

  if (code != 200) {
    anomalie = true;
    if (nouveau) Serial.println("  -> probleme reseau/serveur : LED clignotantes, nouvel essai dans 2 s");
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, reponse)) {
    anomalie = true;
    if (nouveau) Serial.println("  -> JSON illisible : LED clignotantes");
    return;
  }

  const char* etatServeur = doc["etat"] | "";

  if (strcmp(etatServeur, "LIBRE") == 0) {
    if (anomalie) eteindreTout();
    anomalie = false;
    if (nouveau) Serial.println("  -> LIBRE : personne n'a deverrouille la borne, on attend");
    return;
  }

  if (strcmp(etatServeur, "DEVERROUILLEE") != 0) {
    anomalie = true;
    if (nouveau) Serial.printf("  -> etat inconnu \"%s\" : LED clignotantes\n", etatServeur);
    return;
  }

  // Deverrouillee : jeton + premier duel a jouer
  const char* j = doc["jeton"] | "";
  int nbCandidatsServeur = doc["nbCandidats"] | -1;
  String erreur;
  bool ok = true;
  if (strlen(j) == 0 || strlen(j) >= sizeof(jeton)) {
    erreur = "jeton absent ou trop long"; ok = false;
  } else if (nbCandidatsServeur != NB_CANDIDATS) {
    erreur = "le serveur annonce " + String(nbCandidatsServeur) +
             " candidats, la borne en a " + String(NB_CANDIDATS) + " cables";
    ok = false;
  } else {
    ok = lireDuel(doc["duel"].as<JsonObject>(), duelActuel, erreur);
  }
  if (!ok) {
    anomalie = true;
    if (nouveau) Serial.printf("  -> reponse REFUSEE : %s. LED clignotantes.\n", erreur.c_str());
    return;
  }

  anomalie = false;
  strcpy(jeton, j);
  Serial.printf("  -> DEVERROUILLEE. Jeton %s\n", jeton);
  if (duelActuel.numero > 1) {
    Serial.printf("  -> reprise d'un vote deja commence : on repart au duel %d/%d\n",
                  duelActuel.numero, duelActuel.total);
  }

  eteindreTout();
  demarrerMelodie(MELODIE_DEVERROUILLE, NB_NOTES(MELODIE_DEVERROUILLE));
  etat = VOTE;
  afficherDuel();
}

// ------------------------------------------------------------
//  Deroulement du vote
// ------------------------------------------------------------
void afficherDuel() {
  const Duel& d = duelActuel;
  eteindreTout();
  ecrireLed(idxGauche(d.gauche), true);
  ecrireLed(idxDroite(d.droite), true);

  char texte[48];
  snprintf(texte, sizeof(texte), "DUEL %d / %d  (affrontement %d)",
           d.numero, d.total, d.idAffrontement);
  titre(texte);
  Serial.printf("  GAUCHE (btn A) : candidat LED %d   [GPIO %d]\n",
                d.gauche + 1, LED_GAUCHE[d.gauche]);
  Serial.printf("  DROITE (btn B) : candidat LED %d   [GPIO %d]\n",
                d.droite + 1, LED_DROITE[d.droite]);
  Serial.println("  BLANC  (btn C) : appui court");
  Serial.println("  ANNULER        : C maintenu 5 s");
  journalLeds("duel affiche");
  Serial.println("  En attente d'un appui...");
}

// ------------------------------------------------------------
//  B3 — POST /api/bornes/{id}/choix
//  Appele des l'appui. Le serveur ecrit le choix et renvoie le
//  duel suivant (SUIVANT) ou la fin du vote (TERMINE).
//  Bloquant : jusqu'a NB_TENTATIVES essais avec la MEME requete.
//  Le serveur est idempotent : un rejeu n'ecrit rien deux fois.
// ------------------------------------------------------------
void envoyerChoix(Choix c, const char* bouton) {
  const Duel& d = duelActuel;
  eteindreTout();

  titre("CHOIX DU VOTANT");
  Serial.printf("  Duel %d/%d (affrontement %d) : bouton %s -> %s",
                d.numero, d.total, d.idAffrontement, bouton, NOM_CHOIX[c]);
  if (c == GAUCHE)      Serial.printf(" (candidat LED %d)\n", d.gauche + 1);
  else if (c == DROITE) Serial.printf(" (candidat LED %d)\n", d.droite + 1);
  else                  Serial.println(" (vote blanc)");
  Serial.println("  Envoi au serveur...");

  JsonDocument requete;
  requete["jeton"] = jeton;
  requete["idAffrontement"] = d.idAffrontement;
  requete["choix"] = NOM_CHOIX[c];
  String corps;
  serializeJson(requete, corps);
  String chemin = "/api/bornes/" + String(ID_BORNE) + "/choix";

  String reponse;
  int code = -1;
  for (int tentative = 1; tentative <= NB_TENTATIVES; tentative++) {
    code = requeteHttp("POST", chemin, corps, reponse, true);
    if (code > 0 && code < 500) break;          // reponse du serveur : on s'arrete
    if (tentative < NB_TENTATIVES) {
      Serial.printf("  Pas de reponse exploitable, nouvel essai dans %lu s (%d/%d)\n",
                    PAUSE_ENTRE_ESSAIS / 1000, tentative, NB_TENTATIVES);
      delay(PAUSE_ENTRE_ESSAIS);
    }
  }

  if (code != 200) {
    String raison;
    if (code > 0) raison = "choix REFUSE par le serveur (" + decrireCode(code) + ")";
    else          raison = "choix NON TRANSMIS apres " + String(NB_TENTATIVES) + " essais";
    echecChoix(raison);
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, reponse)) {
    echecChoix("reponse illisible");
    return;
  }
  const char* statut = doc["statut"] | "";

  if (strcmp(statut, "TERMINE") == 0) {
    titre("VOTE TERMINE");
    Serial.println("  Le serveur a recu le dernier choix et verse le bulletin dans l'urne.");
    demarrerMelodie(MELODIE_ENREGISTRE, NB_NOTES(MELODIE_ENREGISTRE));
    verrouiller();
    return;
  }

  if (strcmp(statut, "SUIVANT") != 0) {
    echecChoix(String("statut inconnu : ") + statut);
    return;
  }
  String erreur;
  if (!lireDuel(doc["duel"].as<JsonObject>(), duelSuivant, erreur)) {
    echecChoix(erreur);
    return;
  }

  Serial.printf("  -> choix enregistre. Duel suivant recu : %d/%d (affrontement %d, LED %d vs LED %d)\n",
                duelSuivant.numero, duelSuivant.total, duelSuivant.idAffrontement,
                duelSuivant.gauche + 1, duelSuivant.droite + 1);
  Serial.printf("  -> jingle, puis pause de %lu s avant de l'afficher\n", DUREE_VALIDATION / 1000);
  demarrerMelodie(MELODIE_VALIDATION, NB_NOTES(MELODIE_VALIDATION));
  journalLeds("jingle validation");
  debutValidation = millis();
  etat = VALIDATION;
}

// Le choix n'est pas enregistre. On se reverrouille : si le jeton
// est encore valide, le prochain GET /etat renverra le MEME duel
// (le serveur sait ou en est le votant) et il pourra rejouer.
void echecChoix(const String& raison) {
  Serial.printf("  -> ECHEC : %s\n", raison.c_str());
  Serial.println("  -> la borne se reverrouille ; si le vote est toujours ouvert");
  Serial.println("     cote serveur, elle reprendra au meme duel dans 2 s.");
  demarrerMelodie(MELODIE_ERREUR, NB_NOTES(MELODIE_ERREUR));
  verrouiller();
}

// ------------------------------------------------------------
//  B4 — POST /api/bornes/{id}/abandon  (C maintenu 5 s)
//  Un seul essai : si le serveur ne le recoit pas, le vote reste
//  ouvert cote serveur et la borne le reprendra au prochain
//  GET /etat. Rien n'est perdu ni compte en double.
// ------------------------------------------------------------
void abandonnerVote() {
  titre("ANNULATION DU VOTE (C maintenu 5 s)");
  Serial.printf("  Duel en cours : %d/%d. Envoi de l'annulation au serveur...\n",
                duelActuel.numero, duelActuel.total);
  arreterMelodie();

  JsonDocument requete;
  requete["jeton"] = jeton;
  String corps;
  serializeJson(requete, corps);
  String reponse;
  int code = requeteHttp("POST", "/api/bornes/" + String(ID_BORNE) + "/abandon",
                         corps, reponse, true);

  if (code == 204 || code == 200) {
    Serial.println("  -> vote annule : le serveur a efface les choix provisoires.");
    Serial.println("     Le votant peut recommencer depuis l'app.");
  } else {
    Serial.printf("  -> annulation NON RECUE (%s) : le vote reste ouvert cote serveur,\n",
                  decrireCode(code).c_str());
    Serial.println("     la borne le reprendra au prochain GET /etat.");
  }
  doubleFlash();
  verrouiller();
}

void verrouiller() {
  jeton[0] = '\0';
  etat = VERROUILLEE;
  eteindreTout();
  derniereReponseEtat = "";         // retrace la prochaine reponse de /etat
  dernierAppel = millis();          // prochain GET /etat dans 2 s
  Serial.println("  Borne verrouillee. Interrogation du serveur toutes les 2 s.");
}

// ------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(300);

  for (int i = 0; i < NB_CANDIDATS; i++) {
    pinMode(LED_GAUCHE[i], OUTPUT);
    pinMode(LED_DROITE[i], OUTPUT);
  }
  pinMode(BUZZER_PIN, OUTPUT);
  eteindreTout();

  btnA.init();
  btnB.init();
  btnC.init();

  Serial.println();
  Serial.println("##################################################");
  Serial.println("#  BORNE ISOLOIRE — CONNECTEE v2 (echange/duel)  #");
  Serial.println("##################################################");
  Serial.printf("  Borne %d   Candidats cables : %d\n", ID_BORNE, NB_CANDIDATS);
  Serial.println("  Boutons : A = gauche | B = droite");
  Serial.printf("            C = blanc (court) / annuler le vote (%lu s)\n",
                DUREE_APPUI_LONG / 1000);

  // Test rapide des LED et du buzzer, comme la version de reference.
  Serial.println("\n  Test des LED...");
  for (int i = 0; i < NB_LEDS; i++) {
    allumerSeule(i);
    delay(150);
  }
  eteindreTout();
  demarrerMelodie(MELODIE_VALIDATION, NB_NOTES(MELODIE_VALIDATION));
  while (melodieEnCours()) majMelodie();

  connecterWifi();
  testerServeur();
  verrouiller();
  dernierAppel = 0;                 // premier GET /etat tout de suite
}

void loop() {
  majMelodie();

  Front fA = btnA.lire();
  Front fB = btnB.lire();
  Front fC = btnC.lire();

  journalBouton(btnA, fA, "gauche");
  journalBouton(btnB, fB, "droite");
  journalBouton(btnC, fC, "blanc");

  releveEtat();

  if (fC == APPUI_LONG) {
    if (etat == VERROUILLEE) {
      Serial.println("\n  [BTN] C maintenu 5 s : aucun vote en cours, rien a annuler.");
    } else {
      abandonnerVote();
    }
    return;
  }

  switch (etat) {

    case VERROUILLEE:
      if (dernierAppel == 0 || millis() - dernierAppel >= PERIODE_INTERROGATION) {
        dernierAppel = millis();
        interrogerServeur();
      }
      if (etat == VERROUILLEE && anomalie) clignoterAnomalie();
      break;

    case VOTE:
      // A et B agissent des l'appui. C agit au RELACHEMENT, seule
      // facon de distinguer appui court (blanc) et appui long
      // (annulation).
      if      (fA == APPUI)   envoyerChoix(GAUCHE, "A");
      else if (fB == APPUI)   envoyerChoix(DROITE, "B");
      else if (fC == RELACHE) envoyerChoix(BLANC,  "C");
      break;

    case VALIDATION:
      // Le choix est deja enregistre par le serveur : on laisse le
      // jingle et la pause se derouler, puis on affiche le duel
      // suivant qu'il nous a renvoye.
      if (millis() - debutValidation >= DUREE_VALIDATION) {
        arreterMelodie();
        duelActuel = duelSuivant;
        etat = VOTE;
        afficherDuel();
      }
      break;
  }
}
