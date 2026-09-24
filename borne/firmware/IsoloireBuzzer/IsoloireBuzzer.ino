// ============================================================
//   DASHBOARD ISOLOIRE — VERSION BUZZER (hors ligne)
//   Identique a IsoloireTest, mais la LED verte de validation
//   est remplacee par un BUZZER qui joue un jingle de validation.
//
//   3 candidats, 3 duels, vote par 3 boutons.
//   Bouton C : appui court = vote blanc, 5 s = remise a zero.
//
//   IMPORTANT : il faut un BUZZER PASSIF. Un buzzer actif
//   contient son propre oscillateur et ne joue qu'une seule
//   note quoi qu'on lui envoie ; impossible d'en tirer une
//   melodie.
//
//   PROGRAMME DE REFERENCE — passation equipe backend
//   Version testee sur le cablage reel de l'isoloir. Elle ne
//   fait AUCUN appel reseau. Les endroits ou la version
//   connectee appellera l'API sont marques :
//       >>> API (a venir) : <route>
//   Le detail de chaque route est dans borne/ROUTES.md.
// ============================================================

// ---- Cible : ESP32-C3 SuperMini ---------------------------
// REGLAGE IDE OBLIGATOIRE : Tools -> USB CDC On Boot -> Enabled
#if !defined(CONFIG_IDF_TARGET_ESP32C3)
#error "Brochage prevu pour un ESP32-C3 SuperMini. Selectionner 'ESP32C3 Dev Module' dans Tools > Board."
#endif

// ---------- Configuration ----------
const int NB_CANDIDATS = 3;

const char* NOMS[NB_CANDIDATS] = {
  "Candidat 1", "Candidat 2", "Candidat 3"
};

const bool MODE_TEST = true;
const unsigned long PERIODE_RELEVE = 5000;   // ms
// -----------------------------------

// ---------- Cablage ----------
// Aucune LED sur les GPIO 2, 8 et 9 : pins de strapping du C3.
const int LED_GAUCHE[NB_CANDIDATS] = { 0, 1, 3 };
const int LED_DROITE[NB_CANDIDATS] = { 5, 6, 7 };

// Le buzzer remplace la LED verte, sur le meme pin.
// Cablage : GPIO 20 -> resistance 100 ohms -> buzzer + ,
//           buzzer - -> GND
const int BUZZER_PIN = 20;

const int BTN_A = 2;    // vote pour le candidat de GAUCHE
const int BTN_B = 8;    // vote pour le candidat de DROITE
const int BTN_C = 9;    // vote BLANC (court) / remise a zero (5 s)

const bool BOUTONS_ACTIF_HAUT = false;   // GPIO -> bouton -> GND
// ------------------------------

const int NB_LEDS  = NB_CANDIDATS * 2;   // plus de LED de validation
const int NB_DUELS = NB_CANDIDATS * (NB_CANDIDATS - 1) / 2;

const unsigned long DUREE_VALIDATION  = 3000;  // ms de pause entre duels
const unsigned long ANTI_REBOND       = 50;    // ms
const unsigned long PAS_CHENILLARD    = 120;   // ms par LED
const unsigned long DUREE_APPUI_LONG  = 5000;  // ms pour la remise a zero

// Garde-fou : le jingle ne peut pas depasser cette duree, quoi
// qu'on mette dans le tableau MELODIE.
const unsigned long DUREE_MELODIE_MAX = 3000;  // ms

// ---------- Jingle de validation ----------
// Arpege de do majeur ascendant : lecture immediate comme un
// "c'est valide". Frequences en Hz, durees en ms.
const int DO5  = 523;
const int MI5  = 659;
const int SOL5 = 784;
const int DO6  = 1047;

struct NoteJingle { int frequence; int duree; };   // frequence 0 = silence

const NoteJingle MELODIE[] = {
  {  DO5,  90 },
  {  MI5,  90 },
  { SOL5,  90 },
  {  DO6, 280 }
};
const int NB_NOTES = sizeof(MELODIE) / sizeof(MELODIE[0]);
// ------------------------------------------

// Duels generes au demarrage : toutes les paires (i, j), i < j.
// >>> API (a venir) : les duels seront fournis par le serveur,
//     UN A LA FOIS : le premier dans la reponse de
//     GET /api/bornes/{id}/etat, les suivants dans la reponse de
//     POST /api/bornes/{id}/choix. gauche/droite restent des
//     NUMEROS DE LED (0..NB_CANDIDATS-1), jamais des id de base.
struct Duel { uint8_t gauche, droite; };
Duel duels[NB_DUELS];

enum Etat { VOTE, VALIDATION, TERMINE };
Etat etat = VOTE;

int duelCourant = 0;
int scores[NB_CANDIDATS];
int blancs = 0;
int indexChenillard = 0;
unsigned long debutValidation = 0;
unsigned long dernierReleve = 0;

// Lecteur de melodie non bloquant.
int noteCourante = -1;                  // -1 = rien en cours
unsigned long debutNote = 0;
unsigned long debutMelodie = 0;

bool etatLeds[NB_LEDS];

const char* NOM_ETAT[] = { "VOTE", "VALIDATION", "TERMINE" };

// ############################################################
//  IMPORTANT — NE PAS DEPLACER CE BLOC PLUS BAS
//
//  L'IDE Arduino insere les prototypes generes juste avant la
//  PREMIERE fonction du fichier. Tout type utilise dans une
//  signature de fonction doit donc etre declare avant elle,
//  sinon : "variable or field 'journalBouton' declared void".
// ############################################################

enum Front { RIEN, APPUI, RELACHE, APPUI_LONG };

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
  bool enfonce() { return stable; }

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

// ------------------------------------------------------------
//  Buzzer — lecteur de melodie non bloquant
//
//  On n'utilise pas tone(pin, freq, duree) : selon la version du
//  core ESP32, la variante avec duree bloque la boucle pendant
//  toute la note. Ici on enchaine les notes depuis loop(), ce
//  qui laisse les boutons reactifs pendant que ca joue.
// ------------------------------------------------------------
void jouerNote(int i) {
  if (MELODIE[i].frequence == 0) noTone(BUZZER_PIN);
  else                           tone(BUZZER_PIN, MELODIE[i].frequence);
}

void arreterMelodie() {
  noTone(BUZZER_PIN);
  noteCourante = -1;
}

void demarrerMelodie() {
  noteCourante  = 0;
  debutNote     = millis();
  debutMelodie  = millis();
  jouerNote(0);
}

void majMelodie() {
  if (noteCourante < 0) return;

  // Garde-fou absolu : jamais plus de DUREE_MELODIE_MAX.
  if (millis() - debutMelodie >= DUREE_MELODIE_MAX) {
    arreterMelodie();
    return;
  }

  if (millis() - debutNote < (unsigned long)MELODIE[noteCourante].duree) return;

  noteCourante++;
  if (noteCourante >= NB_NOTES) {
    arreterMelodie();
    return;
  }

  debutNote = millis();
  jouerNote(noteCourante);
}

bool melodieEnCours() { return noteCourante >= 0; }

// ------------------------------------------------------------
//  Correspondance index logique <-> pin physique
//  index 0..NB_CANDIDATS-1  : colonne gauche
//  index NB_CANDIDATS..2N-1 : colonne droite
// ------------------------------------------------------------
int idxGauche(int candidat) { return candidat; }
int idxDroite(int candidat) { return NB_CANDIDATS + candidat; }

int pinDeLed(int index) {
  if (index < NB_CANDIDATS) return LED_GAUCHE[index];
  return LED_DROITE[index - NB_CANDIDATS];
}

const char* nomDeLed(int index) {
  static char tampon[20];
  if (index < NB_CANDIDATS) {
    snprintf(tampon, sizeof(tampon), "GAUCHE C%d", index + 1);
  } else {
    snprintf(tampon, sizeof(tampon), "DROITE C%d", index - NB_CANDIDATS + 1);
  }
  return tampon;
}

// ------------------------------------------------------------
//  Journal
// ------------------------------------------------------------

// Carte compacte : G[.#.] D[..#] BUZ[*]
//   #  = LED allumee    .  = eteinte    *  = buzzer en train de jouer
void imprimerCarte() {
  Serial.print("G[");
  for (int i = 0; i < NB_CANDIDATS; i++) {
    Serial.print(etatLeds[idxGauche(i)] ? '#' : '.');
  }
  Serial.print("] D[");
  for (int i = 0; i < NB_CANDIDATS; i++) {
    Serial.print(etatLeds[idxDroite(i)] ? '#' : '.');
  }
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

  Serial.printf("  [ETAT] %-10s duel %d/%d   ",
                NOM_ETAT[etat], duelCourant + 1, NB_DUELS);
  imprimerCarte();
  Serial.printf("   BTN A=%d B=%d C=%d\n",
                btnA.niveau(), btnB.niveau(), btnC.niveau());
}

// ------------------------------------------------------------
//  Ecriture LED
// ------------------------------------------------------------
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

// ------------------------------------------------------------
//  Affichage du duel courant
// ------------------------------------------------------------
void afficherDuel() {
  const Duel& d = duels[duelCourant];
  eteindreTout();
  ecrireLed(idxGauche(d.gauche), true);
  ecrireLed(idxDroite(d.droite), true);

  Serial.println();
  Serial.printf("--------- DUEL %d / %d ---------\n", duelCourant + 1, NB_DUELS);
  Serial.printf("  GAUCHE (btn A) : %s   [GPIO %d]\n",
                NOMS[d.gauche], LED_GAUCHE[d.gauche]);
  Serial.printf("  DROITE (btn B) : %s   [GPIO %d]\n",
                NOMS[d.droite], LED_DROITE[d.droite]);
  Serial.println("  BLANC  (btn C) : aucun choix");

  char contexte[24];
  snprintf(contexte, sizeof(contexte), "duel %d affiche", duelCourant + 1);
  journalLeds(contexte);

  Serial.println("  En attente d'un appui...");
}

// ------------------------------------------------------------
//  Enregistrement d'un vote. candidat = -1 pour un vote blanc.
// ------------------------------------------------------------
// >>> API (a venir) : POST /api/bornes/{id}/choix, des l'appui.
//     Le choix (GAUCHE / DROITE / BLANC) part aussitot ; le
//     serveur l'ecrit et renvoie le duel suivant, ou TERMINE au
//     dernier duel (il verse alors le bulletin dans l'urne).
void enregistrer(int candidat, const char* bouton) {
  if (candidat < 0) {
    blancs++;
    Serial.printf("  [VOTE] btn %s -> BLANC (total blancs : %d)\n",
                  bouton, blancs);
  } else {
    scores[candidat]++;
    Serial.printf("  [VOTE] btn %s -> %s (total : %d voix)\n",
                  bouton, NOMS[candidat], scores[candidat]);
  }

  eteindreTout();
  demarrerMelodie();
  journalLeds("jingle validation");

  debutValidation = millis();
  etat = VALIDATION;
  Serial.printf("  Validation : jingle puis pause de %lu ms\n", DUREE_VALIDATION);
}

// ------------------------------------------------------------
//  Depouillement
// ------------------------------------------------------------
void afficherResultats() {
  Serial.println();
  Serial.println("=============== RESULTATS ===============");

  for (int i = 0; i < NB_CANDIDATS; i++) {
    Serial.printf("  %-12s : %d voix\n", NOMS[i], scores[i]);
  }
  Serial.printf("  %-12s : %d\n", "Blancs", blancs);

  int exprimes = 0;
  for (int i = 0; i < NB_CANDIDATS; i++) exprimes += scores[i];
  Serial.printf("  Total : %d votes exprimes + %d blancs = %d duels\n",
                exprimes, blancs, exprimes + blancs);

  int meilleur = 0;
  for (int i = 0; i < NB_CANDIDATS; i++) {
    if (scores[i] > meilleur) meilleur = scores[i];
  }

  Serial.println();

  if (meilleur == 0) {
    Serial.println("  *****************************************");
    Serial.println("  ***  AUCUN VAINQUEUR                  ***");
    Serial.println("  ***  aucun duel n'a ete tranche       ***");
    Serial.println("  *****************************************");
  } else {
    int nbExAequo = 0;
    for (int i = 0; i < NB_CANDIDATS; i++) {
      if (scores[i] == meilleur) nbExAequo++;
    }

    if (nbExAequo == 1) {
      for (int i = 0; i < NB_CANDIDATS; i++) {
        if (scores[i] == meilleur) {
          Serial.println("  *****************************************");
          Serial.printf("  ***  VAINQUEUR : %s\n", NOMS[i]);
          Serial.printf("  ***  %d duel%s gagne%s sur %d\n",
                        meilleur, meilleur > 1 ? "s" : "",
                        meilleur > 1 ? "s" : "", NB_DUELS);
          Serial.println("  *****************************************");
        }
      }

    } else if (nbExAequo == NB_CANDIDATS) {
      // Paradoxe de Condorcet : les preferences tournent en rond
      // (A bat B, B bat C, C bat A). Inherent au vote par duels.
      Serial.println("  *****************************************");
      Serial.println("  ***  PAS DE VAINQUEUR                 ***");
      Serial.println("  ***  cycle de Condorcet               ***");
      Serial.println("  *****************************************");
      Serial.printf("  Les %d candidats ont %d victoire%s chacun :\n",
                    NB_CANDIDATS, meilleur, meilleur > 1 ? "s" : "");
      Serial.println("  les preferences tournent en rond, aucun");
      Serial.println("  candidat ne bat tous les autres.");

    } else {
      Serial.println("  *****************************************");
      Serial.printf("  ***  EGALITE a %d victoire%s entre :\n",
                    meilleur, meilleur > 1 ? "s" : "");
      for (int i = 0; i < NB_CANDIDATS; i++) {
        if (scores[i] == meilleur) Serial.printf("  ***    %s\n", NOMS[i]);
      }
      Serial.println("  *****************************************");
    }
  }
  Serial.println("=========================================");
}

// ------------------------------------------------------------
//  Chenillard de fin
// ------------------------------------------------------------
void chenillard() {
  static unsigned long dernierPas = 0;

  if (millis() - dernierPas < PAS_CHENILLARD) return;
  dernierPas = millis();

  allumerSeule(indexChenillard);
  indexChenillard = (indexChenillard + 1) % NB_LEDS;
}

// ------------------------------------------------------------
//  Remise a zero, sans redemarrer la carte.
// ------------------------------------------------------------
void nouveauScrutin() {
  arreterMelodie();

  // Double flash : confirmation visuelle de la remise a zero.
  for (int f = 0; f < 2; f++) {
    for (int i = 0; i < NB_LEDS; i++) ecrireLed(i, true);
    delay(120);
    eteindreTout();
    delay(120);
  }

  for (int i = 0; i < NB_CANDIDATS; i++) scores[i] = 0;
  blancs = 0;
  duelCourant = 0;
  indexChenillard = 0;
  etat = VOTE;

  Serial.println();
  Serial.println("######## NOUVEAU SCRUTIN ########");
  afficherDuel();
}

// ------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(300);

  for (int i = 0; i < NB_CANDIDATS; i++) {
    pinMode(LED_GAUCHE[i], OUTPUT);
    pinMode(LED_DROITE[i], OUTPUT);
    scores[i] = 0;
  }
  pinMode(BUZZER_PIN, OUTPUT);
  eteindreTout();

  btnA.init();
  btnB.init();
  btnC.init();

  // Generation des duels : toutes les paires (i, j) avec i < j.
  int n = 0;
  for (int i = 0; i < NB_CANDIDATS; i++) {
    for (int j = i + 1; j < NB_CANDIDATS; j++) {
      duels[n].gauche = i;
      duels[n].droite = j;
      n++;
    }
  }

  Serial.println();
  Serial.println("#########################################");
  Serial.println("#   DASHBOARD ISOLOIRE — VERSION BUZZER #");
  Serial.println("#########################################");
  Serial.printf("  Candidats : %d   Duels : %d   LED : %d\n",
                NB_CANDIDATS, NB_DUELS, NB_LEDS);
  Serial.println("  Boutons   : A = gauche | B = droite");
  Serial.printf("              C = blanc (court) / RAZ (%lu s)\n",
                DUREE_APPUI_LONG / 1000);

  Serial.println();
  Serial.println("  Brochage :");
  for (int i = 0; i < NB_LEDS; i++) {
    Serial.printf("    LED %-10s GPIO %d\n", nomDeLed(i), pinDeLed(i));
  }
  Serial.printf("    BUZZER         GPIO %d\n", BUZZER_PIN);
  Serial.printf("    BTN A (gauche) GPIO %d\n", BTN_A);
  Serial.printf("    BTN B (droite) GPIO %d\n", BTN_B);
  Serial.printf("    BTN C (blanc)  GPIO %d\n", BTN_C);

  Serial.println();
  Serial.println("  Programme des duels :");
  for (int i = 0; i < NB_DUELS; i++) {
    Serial.printf("    %d. %s  vs  %s\n", i + 1,
                  NOMS[duels[i].gauche], NOMS[duels[i].droite]);
  }

  const int NIVEAU_REPOS = BOUTONS_ACTIF_HAUT ? LOW : HIGH;
  Serial.println();
  Serial.println("  Boutons au repos :");
  Serial.printf("    A GPIO %-2d = %s %s\n", BTN_A,
                btnA.niveau() == HIGH ? "HIGH" : "LOW ",
                btnA.niveau() == NIVEAU_REPOS ? "OK" : "<<< ANORMAL");
  Serial.printf("    B GPIO %-2d = %s %s\n", BTN_B,
                btnB.niveau() == HIGH ? "HIGH" : "LOW ",
                btnB.niveau() == NIVEAU_REPOS ? "OK" : "<<< ANORMAL");
  Serial.printf("    C GPIO %-2d = %s %s\n", BTN_C,
                btnC.niveau() == HIGH ? "HIGH" : "LOW ",
                btnC.niveau() == NIVEAU_REPOS ? "OK" : "<<< ANORMAL");

  Serial.println();
  Serial.println("  Test des LED une par une :");
  for (int i = 0; i < NB_LEDS; i++) {
    allumerSeule(i);
    Serial.printf("    %-10s GPIO %-2d ON    ", nomDeLed(i), pinDeLed(i));
    imprimerCarte();
    Serial.println();
    delay(400);
  }
  eteindreTout();

  // Test buzzer : le jingle doit s'entendre ici. Si rien ne sort,
  // le buzzer est probablement ACTIF et non passif.
  Serial.println();
  Serial.println("  Test buzzer : jingle de validation...");
  demarrerMelodie();
  while (melodieEnCours()) majMelodie();
  Serial.println("  (silence ici = buzzer actif au lieu de passif)");

  // >>> API (a venir) : GET /api/health pour verifier que le
  //     serveur repond. Puis la borne demarre VERROUILLEE (LED
  //     eteintes) et interroge GET /api/bornes/{id}/etat toutes
  //     les 2 s. Elle n'affiche le premier duel qu'une fois
  //     deverrouillee par l'app du votant.
  afficherDuel();
}

void loop() {
  // Enchaine les notes du jingle sans bloquer la boucle.
  majMelodie();

  Front fA = btnA.lire();
  Front fB = btnB.lire();
  Front fC = btnC.lire();

  journalBouton(btnA, fA, "gauche");
  journalBouton(btnB, fB, "droite");
  journalBouton(btnC, fC, "blanc");

  releveEtat();

  // Appui long sur C : remise a zero, quel que soit l'etat.
  // >>> API (a venir) : si un vote est en cours, la borne envoie
  //     POST /api/bornes/{id}/abandon avant de se reverrouiller.
  if (fC == APPUI_LONG) {
    Serial.printf("\n  [BTN] C maintenu %lu s -> remise a zero\n",
                  DUREE_APPUI_LONG / 1000);
    nouveauScrutin();
    return;
  }

  switch (etat) {

    case VOTE: {
      const Duel& d = duels[duelCourant];
      // A et B agissent des l'appui. C agit au RELACHEMENT, seule
      // facon de distinguer appui court et appui long.
      if      (fA == APPUI)   enregistrer(d.gauche, "A");
      else if (fB == APPUI)   enregistrer(d.droite, "B");
      else if (fC == RELACHE) enregistrer(-1,       "C");
      break;
    }

    case VALIDATION:
      if (millis() - debutValidation >= DUREE_VALIDATION) {
        arreterMelodie();          // securite si le jingle traine
        journalLeds("validation OFF");
        duelCourant++;

        if (duelCourant >= NB_DUELS) {
          // >>> API (a venir) : plus rien a envoyer ici : le dernier
          //     POST /choix a deja recu TERMINE. Le depouillement
          //     local ci-dessous disparaitra : c'est le serveur qui
          //     compte les voix.
          duelCourant = NB_DUELS - 1;
          Serial.println("\n  Tous les duels ont ete joues.");
          afficherResultats();
          Serial.println("  Scrutin termine — chenillard en boucle.");
          Serial.println("  Appuyer sur n'importe quel bouton pour relancer.");
          etat = TERMINE;
        } else {
          etat = VOTE;
          afficherDuel();
        }
      }
      break;

    case TERMINE:
      // >>> API (a venir) : plus d'attente d'un bouton. Apres
      //     la reponse TERMINE, la borne se reverrouille seule et
      //     reprend l'interrogation de GET /api/bornes/{id}/etat.
      if (fA == APPUI || fB == APPUI || fC == APPUI) {
        nouveauScrutin();
      } else {
        chenillard();
      }
      break;
  }
}
