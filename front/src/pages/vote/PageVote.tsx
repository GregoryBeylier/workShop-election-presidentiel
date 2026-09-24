import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { getMonVote, getPeriode, voter, type Duel } from "../../api/election";
import MessagePage from "../../components/ui/MessagePage";
import ProgressionDuels from "./ProgressionDuels";
import CarteCandidat from "./CarteCandidat";
import ActionsDuel from "./ActionsDuel";
import VoteTermine from "./VoteTermine";

// Durée de l'animation "Victoire !" / "Égalité" avant le duel suivant
const DUREE_ANIMATION_MS = 1100;

/**
 * Page de vote : présente les candidats deux par deux, "écran vs" façon
 * jeu de combat. L'électeur sélectionne un candidat (entouré en vert),
 * confirme son choix, ou passe le duel sans se prononcer (égalité).
 * Chaque duel est enregistré immédiatement : on reprend au premier duel
 * non voté en revenant sur la page.
 */
function PageVote() {
  const navigate = useNavigate();
  const [duels, setDuels] = useState<Duel[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [scrutinClos, setScrutinClos] = useState(false);

  const [duelIndex, setDuelIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Effet "impact" joué à la confirmation, avant de passer au duel suivant
  const [isConfirming, setIsConfirming] = useState(false);
  // Même principe pour "Passer ce duel", en neutre (égalité)
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    Promise.all([getPeriode(), getMonVote()])
      .then(([periode, monVote]) => {
        if (periode.etat === "CLOS") {
          setScrutinClos(true);
          return;
        }
        if (periode.etat === "PREPARATION") {
          setErreur(
            "Le scrutin n'est pas encore ouvert. Revenez dès son ouverture !",
          );
          return;
        }
        if (!monVote.inscrit) {
          setErreur("Vous n'êtes pas inscrit à ce scrutin.");
          return;
        }
        setDuels(monVote.duels);
        // Reprise au premier duel pas encore voté
        const premierRestant = monVote.duels.findIndex((d) => !d.fait);
        setDuelIndex(
          premierRestant === -1 ? monVote.duels.length : premierRestant,
        );
      })
      .catch((e: Error) => setErreur(e.message));
  }, []);

  if (scrutinClos) {
    return <Navigate to="/resultats" replace />;
  }
  if (erreur) {
    return <MessagePage texte={erreur} erreur />;
  }
  if (!duels) {
    return <MessagePage texte="Chargement des duels…" />;
  }

  const currentDuel = duels[duelIndex];
  // Tous les duels sont déjà votés
  if (!currentDuel) {
    return <VoteTermine nbDuels={duels.length} />;
  }

  const isLastDuel = duelIndex === duels.length - 1;

  const goToNextDuel = () => {
    setSelectedId(null);
    setIsConfirming(false);
    setIsSkipping(false);
    if (isLastDuel) {
      navigate("/waiting");
    } else {
      setDuelIndex((i) => i + 1);
    }
  };

  // Enregistre le duel puis joue l'animation ; en cas d'erreur on reste sur le duel
  const envoyer = async (idCandidatChoisi: number | null) => {
    try {
      await voter(currentDuel.id, idCandidatChoisi);
    } catch (e) {
      // 409 "déjà voté" : le duel est enregistré, on peut avancer
      if (!(e instanceof ApiError && e.status === 409)) {
        setErreur((e as Error).message);
        return;
      }
    }
    window.setTimeout(goToNextDuel, DUREE_ANIMATION_MS);
  };

  const handleConfirm = () => {
    if (selectedId === null || isConfirming) return;
    setIsConfirming(true);
    envoyer(selectedId);
  };

  const handleSkip = () => {
    if (isConfirming || isSkipping) return;
    setIsSkipping(true);
    envoyer(null);
  };

  const { candidat1, candidat2 } = currentDuel;
  const gagnantId = isConfirming ? selectedId : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-2 sm:py-10">
      <ProgressionDuels index={duelIndex} total={duels.length} />

      {/* Les deux candidats du duel, avec le badge VS au centre */}
      <div
        key={duelIndex}
        className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-8"
      >
        {/* Flash blanc au moment de la confirmation / du passage */}
        {(isConfirming || isSkipping) && (
          <div className="pointer-events-none absolute -inset-2 sm:-inset-4 bg-white rounded-2xl z-20 animate-[flash-bg_0.9s_ease-out]" />
        )}

        {/* Badge VS, remplacé par "Égalité" quand on passe le duel */}
        {isSkipping ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <span className="font-heading text-sm sm:text-4xl font-extrabold italic text-gray-500 bg-white/90 px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-lg animate-[ko-zoom_0.8s_ease-out]">
              Égalité
            </span>
          </div>
        ) : (
          <div className="flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-brand-dark text-white items-center justify-center font-heading font-extrabold text-[10px] sm:text-lg shadow-lg animate-[vs-pop_1s_ease-out]">
            VS
          </div>
        )}

        {[candidat1, candidat2].map((candidat, i) => (
          <CarteCandidat
            key={candidat.id}
            candidat={candidat}
            cote={i === 0 ? "gauche" : "droite"}
            selectionne={selectedId === candidat.id}
            gagnant={gagnantId === candidat.id}
            perdant={gagnantId !== null && gagnantId !== candidat.id}
            egalite={isSkipping}
            desactive={isConfirming || isSkipping}
            onSelect={() => setSelectedId(candidat.id)}
          />
        ))}
      </div>

      <ActionsDuel
        peutConfirmer={selectedId !== null}
        enCours={isConfirming || isSkipping}
        onConfirm={handleConfirm}
        onSkip={handleSkip}
      />
    </div>
  );
}

export default PageVote;
