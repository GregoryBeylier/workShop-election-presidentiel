import { ChevronsRight, Lock } from "lucide-react";

/** Boutons sous le duel : confirmer le choix, ou passer (égalité). */
function ActionsDuel({
  peutConfirmer,
  enCours,
  onConfirm,
  onSkip,
}: {
  peutConfirmer: boolean;
  enCours: boolean;
  onConfirm: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-3">
      <button
        type="button"
        onClick={onConfirm}
        disabled={!peutConfirmer || enCours}
        className="w-full sm:w-auto sm:min-w-[280px] bg-brand-teal text-white rounded-md px-8 py-2 sm:py-3 text-sm sm:text-base font-medium hover:bg-brand-teal-dark transition-colors duration-300 disabled:opacity-40"
      >
        Je confirme mon choix
      </button>
      <button
        type="button"
        onClick={onSkip}
        disabled={enCours}
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
  );
}

export default ActionsDuel;
