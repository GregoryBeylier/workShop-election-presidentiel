import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Check, ChevronsRight, Lock } from "lucide-react";
import { ApiError } from "../../api/client";
import { getMonVote, getPeriode, voter, type Duel } from "../../api/election";

/**
 * Page de vote : présente les candidats deux par deux, "écran vs" façon
 * jeu de combat. L'électeur sélectionne un candidat (entouré en vert),
 * confirme son choix, ou passe le duel sans se prononcer (égalité).
 * Chaque duel est enregistré immédiatement : on reprend au premier duel
 * non voté en revenant sur la page.
 */
function Vote() {
  const navigate = useNavigate();
  const [duels, setDuels] = useState<Duel[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [scrutinClos, setScrutinClos] = useState(false);

  const [duelIndex, setDuelIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Petit effet "impact" joué au moment de la confirmation, avant de
  // passer au duel suivant (façon écran de victoire des jeux de combat).
  const [isConfirming, setIsConfirming] = useState(false);
  // Même principe côté "Passer ce duel", mais en neutre (égalité, personne
  // n'est favorisé) plutôt qu'une victoire.
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    Promise.all([getPeriode(), getMonVote()])
      .then(([periode, monVote]) => {
        if (!periode.ouverte) {
          setScrutinClos(true);
          return;
        }
        if (!monVote.inscrit) {
          setErreur("Vous n'êtes pas inscrit à ce scrutin.");
          return;
        }
        setDuels(monVote.duels);
        // Reprise au premier duel pas encore voté
        const premierRestant = monVote.duels.findIndex((d) => !d.fait);
        setDuelIndex(premierRestant === -1 ? monVote.duels.length : premierRestant);
      })
      .catch((e: Error) => setErreur(e.message));
  }, []);

  if (scrutinClos) {
    return <Navigate to="/resultats" replace />;
  }

  if (erreur) {
    return (
      <p className="max-w-4xl mx-auto px-4 sm:px-8 py-10 text-center text-red-600">
        {erreur}
      </p>
    );
  }

  if (!duels) {
    return (
      <p className="max-w-4xl mx-auto px-4 sm:px-8 py-10 text-center text-gray-500">
        Chargement des duels…
      </p>
    );
  }

  const currentDuel = duels[duelIndex];
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
    window.setTimeout(goToNextDuel, 1100);
  };

  const handleConfirm = () => {
    if (!selectedId || isConfirming) return;
    setIsConfirming(true);
    envoyer(selectedId);
  };

  const handleSkip = () => {
    if (isConfirming || isSkipping) return;
    setIsSkipping(true);
    envoyer(null);
  };

  // Tous les duels sont déjà votés
  if (!currentDuel) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-dark mb-2">
          Votre vote est enregistré
        </h1>
        <p className="text-gray-500 mb-6">
          Vous avez voté les {duels.length} duels. Merci pour votre participation !
        </p>
        <Link
          to="/waiting"
          className="inline-block bg-brand-teal text-white rounded-md px-6 py-2 font-medium hover:bg-brand-teal-dark transition-colors duration-300"
        >
          Suivre le scrutin
        </Link>
      </div>
    );
  }

  const { candidat1: candidatA, candidat2: candidatB } = currentDuel;
  const winner =
    candidatA.id === selectedId
      ? candidatA
      : candidatB.id === selectedId
        ? candidatB
        : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-2 sm:py-10">
      {/* Progression */}
      <div className="text-center mb-2 sm:mb-8">
        <span className="inline-block bg-brand-teal/10 text-brand-teal-dark text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full mb-1.5 sm:mb-3">
          DUEL {duelIndex + 1} SUR {duels.length}
        </span>
        <div className="flex gap-1.5 max-w-xs mx-auto mb-1.5 sm:mb-5">
          {duels.map((_, i) => (
            <div
              key={i}
              className={`h-1 sm:h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= duelIndex ? "bg-brand-teal" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <h1 className="font-heading text-lg sm:text-3xl font-bold text-brand-dark">
          Qui préférez-vous ?
        </h1>
        <p className="hidden sm:block text-sm text-gray-500 mt-1">
          Cliquez sur la carte du candidat de votre choix.
        </p>
      </div>

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

        {[candidatA, candidatB].map((candidat, i) => {
          const isSelected = selectedId === candidat.id;
          const isLoser = isConfirming && winner && candidat.id !== winner.id;
          return (
            <button
              key={candidat.id}
              type="button"
              disabled={isConfirming || isSkipping}
              onClick={() => setSelectedId(candidat.id)}
              className={`relative text-left bg-white rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                i === 0
                  ? "animate-[slide-in-left_0.7s_ease-out]"
                  : "animate-[slide-in-right_0.7s_ease-out]"
              } ${
                isSelected
                  ? "border-green-500 ring-4 ring-green-100 animate-[pick-impact_0.5s_ease-out]"
                  : "border-gray-200 hover:border-brand-teal/50"
              } ${isLoser ? "opacity-30 scale-[0.97]" : ""} ${
                isSkipping ? "opacity-40 grayscale scale-[0.97]" : ""
              }`}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 z-10 bg-green-500 text-white rounded-full p-0.5 sm:p-1 shadow">
                  <Check size={11} strokeWidth={3} className="sm:hidden" />
                  <Check size={14} strokeWidth={3} className="hidden sm:block" />
                </span>
              )}

              {/* Bandeau haut avec avatar */}
              <div className="h-10 sm:h-28 bg-gradient-to-br from-brand-teal/15 to-brand-dark/10 flex items-center justify-center">
                <div className="w-7 h-7 sm:w-16 sm:h-16 rounded-full bg-white border-2 sm:border-4 border-white shadow flex items-center justify-center font-heading font-bold text-brand-dark text-[10px] sm:text-lg">
                  {candidat.prenom[0]}
                  {candidat.nom[0]}
                </div>
              </div>

              <div className="p-2 sm:p-5 text-center">
                <h2 className="font-heading font-bold text-brand-dark uppercase tracking-wide text-xs sm:text-base leading-tight">
                  {candidat.prenom} {candidat.nom}
                </h2>
                <p className="text-[11px] sm:text-sm text-brand-teal-dark font-medium leading-tight">
                  {candidat.parti}
                </p>
              </div>

              {/* "Victoire !" façon jeu de combat sur le candidat choisi */}
              {isConfirming && winner && candidat.id === winner.id && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-brand-dark/10">
                  <span className="font-heading text-sm sm:text-4xl font-extrabold italic text-brand-teal-dark drop-shadow-[1px_1px_0_white] sm:drop-shadow-[2px_2px_0_white] animate-[ko-zoom_0.8s_ease-out]">
                    Victoire !
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions : confirmer au-dessus, passer le duel en dessous */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedId || isConfirming || isSkipping}
          className="w-full sm:w-auto sm:min-w-[280px] bg-brand-teal text-white rounded-md px-8 py-2 sm:py-3 text-sm sm:text-base font-medium hover:bg-brand-teal-dark transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Je confirme mon choix
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={isConfirming || isSkipping}
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-brand-dark transition-colors duration-300 disabled:opacity-40"
        >
          <ChevronsRight size={14} />
          Passer ce duel
        </button>

        <p className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 mt-2">
          <Lock size={12} />
          Vote anonyme · 1 point au candidat choisi, 0,5 chacun en cas d'égalité
        </p>
      </div>
    </div>
  );
}

export default Vote;
