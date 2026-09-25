// ============================================================
//   BORNE ISOLOIRE — VERSION CONNECTEE (+ diagnostic materiel)
//
//   MODE DEBUG MATERIEL (copie « Debug » : les originaux ne l'ont pas)
//   Borne verrouillee (aucun vote en cours), taper le CODE DEBUG :
//   3 combinaisons, chacune tenue 1 s, dans cet ordre :
//     1. A seul   2. A + B   3. A + B + C
//   (on garde A enfonce, on ajoute B, puis C).
//   Un bip court apres l'etape 1, puis un plus aigu apres l'etape 2 :
//   c'est le signal pour ajouter le bouton suivant.
//   Double flash + 2 bips montants : la borne est en debug.
//   Ensuite, tant qu'un bouton est enfonce :
//     A (gauche)     -> LED GPIO 0      (gauche, candidat 1)
//     B (droite)     -> LED GPIO 7      (droite, candidat 3)
//     C (blanc)      -> LED GPIO 1 et 6 (gauche et droite, candidat 2)
//     A + B ensemble -> buzzer
//   Meme code pour sortir : 2 bips descendants, retour au
//   fonctionnement normal. Le code doit etre fini en 15 s.
//   Pendant le debug, la borne n'interroge plus le serveur : elle
//   passe « hors ligne » et personne ne peut la deverrouiller.
//
//   *** VARIANTE ESP32-S3 N16R8 (carte « USB OTG », 2 ports USB-C) ***
//
//   Copie de IsoloireConnecteAdmin (ESP32-C3), avec les MEMES
//   numeros de GPIO. Differences avec la version C3 :
//     - garde-fou de compilation : ESP32-S3 au lieu d'ESP32-C3 ;
//     - console serie sur le port « COM » / « UART » de la carte,
//       PAS sur le port « USB » (OTG) : voir « A PREPARER » ;
//     - puissance Wi-Fi par defaut (le bridage a 8,5 dBm ne
//       servait qu'a l'antenne des C3 SuperMini).
//   Deroulement du vote, API et service de diagnostic : identiques.
//
//   (copie de IsoloireConnecte : meme deroulement de vote, plus
//    un petit service de diagnostic pour la maintenance)
//
//   EN PLUS de la version de base : au demarrage, la borne ouvre
//   un point d'acces Wi-Fi de service (mode AP+STA) tout en
//   restant connectee au Wi-Fi de l'evenement. Depuis un
//   telephone sur ce reseau (ou le Wi-Fi de la borne), on ouvre
//   http://192.168.4.1/ pour un auto-test du materiel :
//     - Test voyants : allume les LED et le buzzer pour verifier
//                      que tout repond ;
//     - Fin du test  : retour au fonctionnement normal.
//   Acces et nom du reseau de service : voir config.h.
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
//        (API v2 : route pas encore fournie par le back, voir
//         abandonnerVote)
//
//   API v2 (borne/API.md) : routes /api/borne/etat et /choix, la
//   borne s'identifie par sa cle (en-tete X-Borne-Cle, CLE_BORNE
//   dans config.h), plus par un numero dans l'URL.
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
//     3. Reglages Tools pour l'ESP32-S3 N16R8 :
//          Board            : ESP32S3 Dev Module
//          USB CDC On Boot  : Disabled   <- console sur le port COM
//          Flash Size       : 16MB (128Mb)
//          Partition Scheme : 16M Flash (3MB APP/9.9MB FATFS)
//          PSRAM            : OPI PSRAM
//     4. Brancher le cable sur le port « COM » / « UART » de la
//        carte (pas « USB ») pour televerser ET lire la console.
//
//   Pourquoi pas le port « USB » (OTG) : sur l'ESP32-S3, les
//   GPIO 19 et 20 SONT les fils de donnees de ce port. Le buzzer
//   etant sur le GPIO 20 (meme brochage que le C3), le programme
//   coupe ce port USB des le demarrage. Le port COM passe par une
//   puce USB-serie separee (GPIO 43/44) : il n'est pas touche.
//
//   Contrat d'API complet : borne/API.md (v2)
// ============================================================

#if !defined(CONFIG_IDF_TARGET_ESP32S3)
#error "Variante prevue pour un ESP32-S3 N16R8. Selectionner 'ESP32S3 Dev Module' dans Tools > Board (ou IsoloireConnecteAdmin pour un ESP32-C3)."
#endif

#include <WiFi.h>
#include <WebServer.h>       // fourni par le core ESP32 : rien a installer
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

// ---------- Cablage (memes GPIO que la version ESP32-C3) ----------
// Deux broches demandent attention sur l'ESP32-S3 :
//   GPIO 0  : broche de demarrage (c'est aussi le bouton BOOT de la
//             carte). Elle doit etre a l'etat HAUT a la mise sous
//             tension. Une LED rouge ou verte vers la masse peut la
//             tirer trop bas : la carte demarre alors en mode
//             telechargement (console : "waiting for download") au
//             lieu de lancer le programme. Si ca arrive, deplacer
//             cette LED sur un GPIO libre (4, 10, 11, 12, 13...).
//   GPIO 20 : fil D+ du port « USB » (OTG). Utilisable pour le
//             buzzer UNIQUEMENT si on passe par le port « COM ».
// Les GPIO 1, 2, 3, 5, 6, 7, 8 et 9 n'ont aucune contrainte sur le
// S3 (8 et 9 etaient des broches de demarrage sur le C3, plus ici).
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
// Un buzzer passif sonne bien plus fort pres de sa frequence de
// resonance (souvent 2 a 4 kHz). Toutes les notes sont multipliees
// par TRANSPOSITION au moment de les jouer : 1 = hauteur d'origine,
// 2 = +1 octave, 4 = +2 octaves (DO5 -> ~2,1 kHz, DO6 -> ~4,2 kHz).
const int TRANSPOSITION = 4;
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

// ---------- Service de diagnostic (auto-test materiel) ----------
WebServer serveurDiag(80);            // service sur AP de service ET Wi-Fi

// Auto-test des voyants : declenche depuis le service de diag.
// Pendant le test, toutes les LED clignotent et le buzzer sonne ;
// le test reprend la main sur l'affichage jusqu'a "Fin du test".
// La tache de diag tourne dans sa PROPRE tache (tacheDiag) et
// pilote elle-meme l'animation : elle continue meme si loop() est
// bloquee (attente du serveur, essais sur /choix...).
// Tant que testEnCours est vrai, c'est la tache de diag qui ecrit
// sur les broches LED et le buzzer. La logique de vote continue de
// noter dans etatLeds ce qu'il faudrait afficher : a la fin du
// test, on reapplique cet etat, le duel en cours revient tel quel.
volatile bool testEnCours       = false;
unsigned long dernierBlinkTest = 0;
bool          testAllume       = false;

const unsigned long PERIODE_TEST = 300;   // ms : cadence du clignotement/bip
const int           BIP_TEST_HZ      = 2700;  // bip de l'auto-test, pres de la resonance du buzzer

// ---------- Mode debug materiel (code a 3 combinaisons) ----------
// Les LED de test sont prises dans les tableaux de cablage
// (LED_GAUCHE / LED_DROITE) : si une LED change de GPIO, le debug suit.
//
// Code d'entree ET de sortie : une combinaison de boutons par etape,
// chacune tenue DUREE_ETAPE_DEBUG. Bits : A = 1, B = 2, C = 4.
// Pour changer le code, il suffit de modifier ce tableau.
const uint8_t SEQUENCE_DEBUG[] = {
  1,           // 1. A seul
  1 | 2,       // 2. A + B
  1 | 2 | 4,   // 3. A + B + C
};
const int NB_ETAPES_DEBUG = sizeof(SEQUENCE_DEBUG) / sizeof(SEQUENCE_DEBUG[0]);
const unsigned long DUREE_ETAPE_DEBUG    = 1000;   // ms : chaque combinaison tenue 1 s
const unsigned long DUREE_MAX_CODE_DEBUG = 15000;  // ms : code complet en 15 s max

volatile bool modeDebug      = false;           // lu aussi par la tache de diag
int           etapeDebug      = 0;              // etapes du code deja reussies
unsigned long debutCodeDebug  = 0;              // moment ou l'etape 1 a ete validee
uint8_t       masqueCourant   = 0;              // boutons enfonces en ce moment (bits)
unsigned long debutMasque     = 0;              // depuis quand cette combinaison est tenue
bool          masqueTraite    = false;          // combinaison deja comptee
bool          attenteRelache  = false;          // code complet : on attend que tout soit relache
bool debugA = false, debugB = false, debugC = false, debugBuzzer = false;  // etat applique

// ---------- Lecteur de melodie non bloquant ----------
const NoteJingle* melodie = nullptr;
int nbNotesMelodie = 0;
int noteCourante = -1;             // -1 = rien en cours
unsigned long debutNote = 0;
unsigned long debutMelodie = 0;

// ------------------------------------------------------------
//  Buzzer — lecteur de melodie non bloquant
// ------------------------------------------------------------
// Pendant l'auto-test, le buzzer appartient a la tache de diag : les melodies
// du vote continuent de "tourner" (temps, notes) mais restent muettes.
void jouerNote(int i) {
  if (testEnCours || modeDebug) return;
  if (melodie[i].frequence == 0) noTone(BUZZER_PIN);
  else                           tone(BUZZER_PIN, melodie[i].frequence * TRANSPOSITION);
}

void arreterMelodie() {
  if (!testEnCours && !modeDebug) noTone(BUZZER_PIN);
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

// etatLeds = ce que le vote veut afficher. Pendant l'auto-test, on le
// note sans toucher aux broches : la tache de diag les pilote, puis les
// remet dans cet etat au STOP (restaurerAffichage).
void ecrireLed(int index, bool allumee) {
  etatLeds[index] = allumee;
  if (!testEnCours && !modeDebug) digitalWrite(pinDeLed(index), allumee ? HIGH : LOW);
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

// Auto-test, appele par la tache de diag : toutes les LED
// clignotent et le buzzer alterne sirene / silence, au meme rythme.
// Ecrit directement sur les broches, sans toucher a etatLeds.
void animerTest() {
  if (millis() - dernierBlinkTest < PERIODE_TEST) return;
  dernierBlinkTest = millis();
  testAllume = !testAllume;
  for (int i = 0; i < NB_LEDS; i++) digitalWrite(pinDeLed(i), testAllume ? HIGH : LOW);
  if (testAllume) tone(BUZZER_PIN, BIP_TEST_HZ);
  else              noTone(BUZZER_PIN);
}

// Fin de l'auto-test (appele par la tache de diag) : coupe le bip et remet
// les LED dans l'etat voulu par le vote (duel en cours, eteintes...).
void restaurerAffichage() {
  noTone(BUZZER_PIN);
  for (int i = 0; i < NB_LEDS; i++) digitalWrite(pinDeLed(i), etatLeds[i] ? HIGH : LOW);
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
  if (!MODE_TEST || modeDebug) return;
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

  // API v2 : la borne prouve qui elle est par sa cle, sur les routes
  // /api/borne/... seulement (pas sur /api/health).
  if (chemin.startsWith("/api/borne/") && CLE_BORNE[0] != '\0') {
    http.addHeader("X-Borne-Cle", CLE_BORNE);
  }

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
  WiFi.mode(WIFI_AP_STA);   // station (Wi-Fi salle) + point d'acces de service
  WiFi.begin(WIFI_SSID, WIFI_MDP);

  // Version C3 : puissance bridee a 8,5 dBm pour contourner
  // l'antenne des ESP32-C3 SuperMini. Inutile sur l'ESP32-S3 :
  // on garde la puissance par defaut, pour une meilleure portee.

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
      Serial.println("    - reseau en 2,4 GHz (l'ESP32-S3 ne voit pas le 5 GHz)");
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

  // Point d'acces de service, demarre APRES la connexion STA
  // pour heriter du meme canal (radio unique 2,4 GHz sur l'ESP32-S3).
  bool ap = WiFi.softAP(SERVICE_AP_SSID, SERVICE_AP_CLE, WiFi.channel(),
                        SERVICE_AP_CACHE ? 1 : 0);
  if (ap) {
    Serial.printf("  Service de diag \"%s\"%s pret sur http://%s/\n",
                  SERVICE_AP_SSID, SERVICE_AP_CACHE ? " (masque)" : "",
                  WiFi.softAPIP().toString().c_str());
    Serial.printf("  (ou http://%s/ depuis le meme Wi-Fi que la borne)\n",
                  WiFi.localIP().toString().c_str());
  } else {
    Serial.println("  ATTENTION : le point d'acces de service n'a pas demarre");
    Serial.println("    - SERVICE_AP_CLE doit faire au moins 8 caracteres (WPA2)");
  }
}

void testerServeur() {
  titre("TEST DU SERVEUR");
  String reponse;
  int code = requeteHttp("GET", "/api/health", "", reponse, true);
  if (code == 200) {
    Serial.println("  Serveur joignable.");
  } else {
    Serial.println("  Serveur INJOIGNABLE. A verifier :");
    Serial.println("    - le back tourne-t-il sur le serveur ?");
    Serial.println("    - SERVEUR dans config.h = IP + port du serveur ?");
    Serial.println("    - le serveur et la borne sont sur le meme Wi-Fi ?");
    Serial.println("    - pare-feu du serveur : port ouvert aux connexions entrantes ?");
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
//  B2 — GET /api/borne/etat  (toutes les 2 s)
// ------------------------------------------------------------
void interrogerServeur() {
  String reponse;
  String chemin = "/api/borne/etat";
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

  if (code == 401) {
    anomalie = true;
    if (nouveau) Serial.println("  -> 401 : cle de la borne refusee (CLE_BORNE dans config.h). "
                                "HORS SERVICE : LED clignotantes");
    return;
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
//  B3 — POST /api/borne/choix
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
  String chemin = "/api/borne/choix";

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
//  B4 — POST /api/borne/abandon  (C maintenu 5 s)
//  TODO API v2 : route PAS ENCORE fournie par le back (API.md §9).
//  Le chemin ci-dessous est provisoire, a aligner sur ce que les
//  devs livreront. D'ici la, le serveur repond une erreur : la
//  borne le signale, et le vote reste ouvert (repris au prochain
//  GET /etat).
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
  int code = requeteHttp("POST", "/api/borne/abandon", corps, reponse, true);

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
//  Service de diagnostic : petit serveur web de maintenance
//  Deux commandes protegees par identifiant (config.h) :
//    POST /selftest -> auto-test : LED + buzzer
//    POST /reset    -> retour au fonctionnement normal
//  Joignable via l'AP de service (192.168.4.1) ou via le Wi-Fi de
//  la borne (son IP STA).
//  serveurDiag.handleClient() et l'animation de test tournent dans
//  leur propre tache (tacheDiag) : le service repond meme pendant
//  que loop() attend le serveur, sans ralentir le vote.
// ------------------------------------------------------------
bool accesAutorise() {
  if (serveurDiag.authenticate(DIAG_ID, DIAG_CLE)) return true;
  serveurDiag.requestAuthentication();   // renvoie 401 + demande le login
  return false;
}

void handleRacine() {
  if (!accesAutorise()) return;
  static const char PAGE[] PROGMEM = R"rawliteral(<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Borne — Diagnostic</title>
<link rel="icon" href="data:,">
<style>
 :root{color-scheme:dark}
 body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#0f1115;
      color:#e8eaed;min-height:100vh;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:24px;padding:24px}
 h1{font-size:1.2rem;font-weight:600;margin:0;text-align:center}
 #etat{font-size:.95rem;padding:6px 14px;border-radius:999px;background:#1b1f27}
 #etat.on{background:#7f1d1d;color:#fff}
 button{width:100%;max-width:340px;border:0;border-radius:16px;padding:28px;
        font-size:1.4rem;font-weight:700;color:#fff;cursor:pointer;
        -webkit-tap-highlight-color:transparent}
 #full{background:#2563eb}#stop{background:#16a34a}
 button:active{transform:scale(.98)}
 small{opacity:.6;text-align:center;max-width:340px}
</style></head><body>
<h1>Borne — Diagnostic</h1>
<div id="etat" class="%CLS%">%ETAT%</div>
<button id="full">Test voyants</button>
<button id="stop">Fin du test</button>
<small>Test voyants : allume les LED et le buzzer pour verifier le materiel.
Fin du test : retour au fonctionnement normal.</small>
<script>
 const e=document.getElementById('etat');
 function maj(a){e.textContent=a?'Test en cours':'Normal';e.className=a?'on':'off';}
 async function cmd(u,a){try{const r=await fetch(u,{method:'POST'});
   if(r.ok)maj(a);else alert('Refuse ('+r.status+')');}
   catch(x){alert('Borne injoignable');}}
 document.getElementById('full').onclick=()=>cmd('/selftest',true);
 document.getElementById('stop').onclick=()=>cmd('/reset',false);
</script></body></html>)rawliteral";

  String html = FPSTR(PAGE);
  html.replace("%ETAT%", testEnCours ? "Test en cours" : "Normal");
  html.replace("%CLS%",  testEnCours ? "on" : "off");
  serveurDiag.send(200, "text/html; charset=utf-8", html);
}

// Handlers executes dans la tache de diag : ils pilotent eux-memes
// les LED et le buzzer, sans attendre loop().
void handleSelftest() {
  if (!accesAutorise()) return;
  if (modeDebug) {
    serveurDiag.send(409, "application/json", "{\"erreur\":\"mode debug actif sur la borne\"}");
    return;
  }
  if (!testEnCours) {
    dernierBlinkTest = 0;    // premier clignotement tout de suite
    testAllume = false;
    testEnCours = true;       // des maintenant, le vote n'ecrit plus sur les broches
    noTone(BUZZER_PIN);        // coupe une eventuelle melodie du vote
  }
  Serial.println("\n  [DIAG] auto-test des voyants lance");
  serveurDiag.send(200, "application/json", "{\"test\":true}");
}

void handleFinTest() {
  if (!accesAutorise()) return;
  if (testEnCours) {
    testEnCours = false;      // le vote reprend la main sur les broches
    restaurerAffichage();      // duel en cours / LED eteintes, comme avant le test
  }
  Serial.println("\n  [DIAG] fin de l'auto-test");
  serveurDiag.send(200, "application/json", "{\"test\":false}");
}

// Tache de diag : repond aux requetes et anime l'auto-test, en
// parallele de loop(). Jamais bloquee par les appels au serveur.
void tacheDiag(void* parametre) {
  for (;;) {
    serveurDiag.handleClient();
    if (testEnCours) animerTest();
    vTaskDelay(pdMS_TO_TICKS(2));   // laisse la main a loop() et au Wi-Fi
  }
}

void configurerDiag() {
  serveurDiag.on("/",        HTTP_GET,  handleRacine);
  serveurDiag.on("/selftest", HTTP_POST, handleSelftest);
  serveurDiag.on("/reset",    HTTP_POST, handleFinTest);
  serveurDiag.onNotFound([]() {
    if (!accesAutorise()) return;
    serveurDiag.send(404, "text/plain", "introuvable");
  });
  serveurDiag.begin();
  xTaskCreate(tacheDiag, "diag", 8192, nullptr, 1, nullptr);
  Serial.println("  Service de diagnostic pret (routes / , /selftest , /reset).");
}

// ------------------------------------------------------------
//  MODE DEBUG MATERIEL
//  Entree / sortie : le code SEQUENCE_DEBUG, borne verrouillee
//  seulement (pendant un vote, chaque appui envoie deja un choix
//  au serveur : le code y est ignore).
//  Comme l'auto-test : les broches sont pilotees directement, et
//  etatLeds garde ce que le vote veut afficher, reapplique a la
//  sortie (restaurerAffichage).
// ------------------------------------------------------------
void ecrireBroche(int gpio, bool allumee) {
  digitalWrite(gpio, allumee ? HIGH : LOW);
}

void toutesLesBroches(bool allumees) {
  for (int i = 0; i < NB_LEDS; i++) ecrireBroche(pinDeLed(i), allumees);
}

void eteindreDebug() {
  toutesLesBroches(false);
  noTone(BUZZER_PIN);
  debugA = debugB = debugC = debugBuzzer = false;
}

void entrerDebug() {
  arreterMelodie();              // coupe une melodie du vote avant de prendre le buzzer
  modeDebug = true;              // des maintenant, le vote n'ecrit plus sur les broches
  eteindreDebug();

  // Signal d'entree : double flash + 2 bips montants
  for (int f = 0; f < 2; f++) {
    toutesLesBroches(true);  delay(120);
    toutesLesBroches(false); delay(120);
  }
  tone(BUZZER_PIN, 2000);        delay(100);
  tone(BUZZER_PIN, BIP_TEST_HZ); delay(150);
  noTone(BUZZER_PIN);

  titre("MODE DEBUG");
  Serial.printf("  A (gauche)     -> LED GPIO %d\n", LED_GAUCHE[0]);
  Serial.printf("  B (droite)     -> LED GPIO %d\n", LED_DROITE[2]);
  Serial.printf("  C (blanc)      -> LED GPIO %d et %d\n", LED_GAUCHE[1], LED_DROITE[1]);
  Serial.printf("  A + B ensemble -> buzzer (GPIO %d, %d Hz)\n", BUZZER_PIN, BIP_TEST_HZ);
  Serial.println("  Sortie : meme code (A, A+B, A+B+C, 1 s chacun)");
  Serial.println("  (plus d'appel au serveur pendant le debug)");
}

void sortirDebug() {
  eteindreDebug();
  tone(BUZZER_PIN, BIP_TEST_HZ); delay(100);
  tone(BUZZER_PIN, 2000);        delay(150);
  noTone(BUZZER_PIN);

  modeDebug = false;             // le vote reprend la main sur les broches
  restaurerAffichage();          // LED comme le vote les veut (eteintes si borne libre)
  derniereReponseEtat = "";      // retrace la prochaine reponse de /etat
  dernierAppel = 0;              // interroge le serveur tout de suite

  titre("FIN DU MODE DEBUG");
  Serial.println("  Retour au fonctionnement normal : la borne interroge le serveur.");
}

// LED et buzzer suivent les boutons : allumes tant que c'est enfonce.
// Le buzzer ne sonne que pour A + B SANS C : pendant le code de
// sortie, il sonne donc a l'etape 2 (A + B) et se tait a l'etape 3.
void animerDebug(bool a, bool b, bool c) {
  bool buzzer = a && b && !c;

  if (a != debugA) {
    ecrireBroche(LED_GAUCHE[0], a);
    Serial.printf("  [DEBUG] A %s -> LED GPIO %d %s\n",
                  a ? "enfonce" : "relache", LED_GAUCHE[0], a ? "ON" : "OFF");
  }
  if (b != debugB) {
    ecrireBroche(LED_DROITE[2], b);
    Serial.printf("  [DEBUG] B %s -> LED GPIO %d %s\n",
                  b ? "enfonce" : "relache", LED_DROITE[2], b ? "ON" : "OFF");
  }
  if (c != debugC) {
    ecrireBroche(LED_GAUCHE[1], c);
    ecrireBroche(LED_DROITE[1], c);
    Serial.printf("  [DEBUG] C %s -> LED GPIO %d et %d %s\n",
                  c ? "enfonce" : "relache", LED_GAUCHE[1], LED_DROITE[1], c ? "ON" : "OFF");
  }
  if (buzzer != debugBuzzer) {
    if (buzzer) tone(BUZZER_PIN, BIP_TEST_HZ);
    else        noTone(BUZZER_PIN);
    Serial.printf("  [DEBUG] A + B -> buzzer %s\n", buzzer ? "ON" : "OFF");
  }

  debugA = a;
  debugB = b;
  debugC = c;
  debugBuzzer = buzzer;
}

// Nom lisible d'une combinaison de boutons, pour la console.
const char* nomMasque(uint8_t m) {
  switch (m) {
    case 1:  return "A seul";
    case 2:  return "B seul";
    case 4:  return "C seul";
    case 3:  return "A + B";
    case 5:  return "A + C";
    case 6:  return "B + C";
    case 7:  return "A + B + C";
    default: return "aucun bouton";
  }
}

// Bip court : « etape validee, ajoute le bouton suivant ».
// Plus aigu a chaque etape (etape 1 : 2500 Hz, etape 2 : 3000 Hz).
// Bloquant 80 ms seulement.
void bipEtapeDebug(int etape) {
  tone(BUZZER_PIN, 2000 + 500 * etape);
  delay(80);
  noTone(BUZZER_PIN);
  // En debug, A + B fait deja sonner le buzzer (code de sortie,
  // etape 2) : on le relance apres le bip.
  if (modeDebug && debugBuzzer) tone(BUZZER_PIN, BIP_TEST_HZ);
}

// Suit le code debug. Une combinaison compte quand elle est tenue
// DUREE_ETAPE_DEBUG sans changer : les combinaisons de passage
// (moins d'1 s, le temps de lacher un bouton et d'appuyer sur le
// suivant) sont ignorees. Une mauvaise combinaison tenue 1 s, ou un
// code trop lent, fait repartir de zero.
// Apres une bascule, plus rien ne compte tant que tous les boutons
// ne sont pas relaches (attenteRelache).
void gererGesteDebug() {
  uint8_t masque = (btnA.stable ? 1 : 0) | (btnB.stable ? 2 : 0) | (btnC.stable ? 4 : 0);

  if (attenteRelache) {
    if (masque == 0) attenteRelache = false;
    return;
  }

  // Pendant un vote, chaque appui envoie deja un choix : pas de code.
  if (!modeDebug && etat != VERROUILLEE) {
    etapeDebug = 0;
    return;
  }

  if (masque != masqueCourant) {
    masqueCourant = masque;
    debutMasque   = millis();
    masqueTraite  = false;
  }

  if (etapeDebug > 0 && millis() - debutCodeDebug > DUREE_MAX_CODE_DEBUG) {
    Serial.printf("  [DEBUG] code trop lent (plus de %lu s) : on repart de zero\n",
                  DUREE_MAX_CODE_DEBUG / 1000);
    etapeDebug = 0;
  }

  if (masque == 0 || masqueTraite || millis() - debutMasque < DUREE_ETAPE_DEBUG) return;
  masqueTraite = true;               // cette combinaison ne compte qu'une fois

  if (masque != SEQUENCE_DEBUG[etapeDebug]) {
    if (etapeDebug > 0) {
      Serial.printf("  [DEBUG] %s au lieu de %s : code repris de zero\n",
                    nomMasque(masque), nomMasque(SEQUENCE_DEBUG[etapeDebug]));
    }
    etapeDebug = 0;
    if (masque != SEQUENCE_DEBUG[0]) return;   // meme pas un debut de code
  }

  if (etapeDebug == 0) debutCodeDebug = millis();
  etapeDebug++;
  Serial.printf("  [DEBUG] code %d/%d : %s OK\n", etapeDebug, NB_ETAPES_DEBUG, nomMasque(masque));
  if (etapeDebug < NB_ETAPES_DEBUG) {
    Serial.printf("          bip : ajoute le bouton suivant -> %s\n",
                  nomMasque(SEQUENCE_DEBUG[etapeDebug]));
    bipEtapeDebug(etapeDebug);
    return;
  }

  etapeDebug = 0;
  attenteRelache = true;
  if (modeDebug) sortirDebug();
  else           entrerDebug();
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
  Serial.println("#  Variante ESP32-S3 N16R8 (console : port COM)   #");
  Serial.println("##################################################");
  Serial.printf("  Cle borne : %s   Candidats cables : %d\n",
                CLE_BORNE[0] ? "configuree" : "VIDE (en-tete non envoye)", NB_CANDIDATS);
  Serial.println("  Boutons : A = gauche | B = droite");
  Serial.printf("            C = blanc (court) / annuler le vote (%lu s)\n",
                DUREE_APPUI_LONG / 1000);
  Serial.println("  Mode debug : code A, A+B, A+B+C (1 s chacun, borne verrouillee)");

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
  configurerDiag();
  testerServeur();
  verrouiller();
  dernierAppel = 0;                 // premier GET /etat tout de suite
}

void loop() {
  // Le service de diag (et l'animation de test) tourne dans tacheDiag.
  // Pendant un auto-test, le vote local est en pause : boutons ignores,
  // LED et buzzer pilotes par la tache de diag. Le vote cote serveur
  // n'est pas touche : a la fin du test, on reaffiche l'etat du vote.
  if (testEnCours) {
    delay(2);
    return;
  }

  majMelodie();

  Front fA = btnA.lire();
  Front fB = btnB.lire();
  Front fC = btnC.lire();

  journalBouton(btnA, fA, "gauche");
  journalBouton(btnB, fB, "droite");
  journalBouton(btnC, fC, "blanc");

  releveEtat();

  // Mode debug : le code a 3 combinaisons l'ouvre et le ferme.
  gererGesteDebug();
  if (modeDebug) {
    // Juste apres l'entree, on attend que les 3 boutons soient
    // relaches avant d'allumer quoi que ce soit.
    if (attenteRelache) animerDebug(false, false, false);
    else                animerDebug(btnA.stable, btnB.stable, btnC.stable);
    return;              // vote en pause : ni appel serveur, ni choix
  }
  // Juste apres la sortie : boutons ignores jusqu'au relachement,
  // pour qu'aucun appui du code ne compte (ex. C maintenu 5 s).
  if (attenteRelache) return;

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
