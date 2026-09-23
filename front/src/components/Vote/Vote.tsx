import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsRight, Lock } from "lucide-react";
import { mockCandidats, type Candidat } from "../../data/mockData";

/**
 * Génère tous les duels possibles (chaque candidat affronte chaque autre
 * une seule fois) — méthode "tout le monde contre tout le monde".
 */
function generateDuels(candidats: Candidat[]): [Candidat, Candidat][] {
  const duels: [Candidat, Candidat][] = [];
  for (let i = 0; i < candidats.length; i++) {
    for (let j = i + 1; j < candidats.length; j++) {
      duels.push([candidats[i], candidats[j]]);
    }
  }
  return duels;
}

/**
 * Page de vote : présente les candidats deux par deux, "écran vs" façon
 * jeu de combat. L'électeur sélectionne un candidat (entouré en vert),
 * confirme son choix, ou passe le duel sans se prononcer.
 */
function Vote() {
  const navigate = useNavigate();
  const [duels] = useState(() => generateDuels(mockCandidats));

  const [duelIndex, setDuelIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Petit effet "impact" joué au moment de la confirmation, avant de
  // passer au duel suivant (façon écran de victoire des jeux de combat).
  const [isConfirming, setIsConfirming] = useState(false);
  // Même principe côté "Passer ce duel", mais en neutre (égalité, personne
  // n'est favorisé) plutôt qu'une victoire.
  const [isSkipping, setIsSkipping] = useState(false);

  const currentDuel = duels[duelIndex];
  const isLastDuel = duelIndex === duels.length - 1;

  const goToNextDuel = () => {
    setSelectedId(null);
    setIsConfirming(false);
    setIsSkipping(false);
    if (isLastDuel) {
      // TODO: rediriger vers un écran de fin de scrutin une fois qu'il existera
      navigate("/");
    } else {
      setDuelIndex((i) => i + 1);
    }
  };

  const handleConfirm = () => {
    if (!selectedId || isConfirming) return;
    // TODO: envoyer le vote à l'API (numéro du duel + candidat choisi)
    console.log("Vote confirmé :", {
      duel: duelIndex + 1,
      candidatId: selectedId,
    });
    setIsConfirming(true);
    window.setTimeout(goToNextDuel, 1100);
  };

  const handleSkip = () => {
    if (isConfirming || isSkipping) return;
    // TODO: définir avec le back ce qu'il advient d'un duel passé
    // (redemandé plus tard ? comptabilisé comme neutre ?)
    console.log("Duel passé :", duelIndex + 1);
    setIsSkipping(true);
    window.setTimeout(goToNextDuel, 1100);
  };

  if (!currentDuel) {
    return null;
  }

  const [candidatA, candidatB] = currentDuel;
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
                <p className="text-[11px] sm:text-sm text-brand-teal-dark font-medium mb-1 sm:mb-3 leading-tight">
                  {candidat.parti}
                </p>

                <ul className="flex flex-col gap-0.5 sm:gap-1.5 text-left max-w-[220px] mx-auto">
                  {candidat.priorites.map((priorite) => (
                    <li
                      key={priorite}
                      className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1 sm:gap-1.5 leading-tight"
                    >
                      <Check
                        size={10}
                        strokeWidth={3}
                        className="text-brand-teal shrink-0 sm:hidden"
                      />
                      <Check
                        size={12}
                        strokeWidth={3}
                        className="text-brand-teal shrink-0 hidden sm:block"
                      />
                      {priorite}
                    </li>
                  ))}
                </ul>
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
          Vote anonyme · une voix pour le candidat choisi
        </p>
      </div>
    </div>
  );
}

export default Vote;
