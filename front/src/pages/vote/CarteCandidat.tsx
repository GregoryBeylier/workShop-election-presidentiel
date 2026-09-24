import { Check } from "lucide-react";
import type { Candidat } from "../../api/election";
import Avatar from "../../components/ui/Avatar";
import { initiales } from "../../utils/format";

/**
 * Carte cliquable d'un candidat dans un duel. Elle arrive par la gauche ou
 * la droite, s'entoure de vert une fois choisie, affiche "Victoire !" à la
 * confirmation et s'efface si elle perd ou en cas d'égalité.
 */
function CarteCandidat({
  candidat,
  cote,
  selectionne,
  gagnant,
  perdant,
  egalite,
  desactive,
  onSelect,
}: {
  candidat: Candidat;
  cote: "gauche" | "droite";
  selectionne: boolean;
  gagnant: boolean;
  perdant: boolean;
  egalite: boolean;
  desactive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={desactive}
      onClick={onSelect}
      className={`relative text-left bg-white rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        cote === "gauche"
          ? "animate-[slide-in-left_0.7s_ease-out]"
          : "animate-[slide-in-right_0.7s_ease-out]"
      } ${
        selectionne
          ? "border-green-500 ring-4 ring-green-100 animate-[pick-impact_0.5s_ease-out]"
          : "border-gray-200 hover:border-brand-teal/50"
      } ${perdant ? "opacity-30 scale-[0.97]" : ""} ${
        egalite ? "opacity-40 grayscale scale-[0.97]" : ""
      }`}
    >
      {selectionne && (
        <span className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 z-10 bg-green-500 text-white rounded-full p-0.5 sm:p-1 shadow">
          <Check size={11} strokeWidth={3} className="sm:hidden" />
          <Check size={14} strokeWidth={3} className="hidden sm:block" />
        </span>
      )}

      {/* Bandeau haut avec avatar */}
      <div className="h-10 sm:h-28 bg-gradient-to-br from-brand-teal/15 to-brand-dark/10 flex items-center justify-center">
        <Avatar
          texte={initiales(candidat.prenom, candidat.nom)}
          className="w-7 h-7 sm:w-16 sm:h-16 bg-white border-2 sm:border-4 border-white shadow font-heading font-bold text-brand-dark text-[10px] sm:text-lg"
        />
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
      {gagnant && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-brand-dark/10">
          <span className="font-heading text-sm sm:text-4xl font-extrabold italic text-brand-teal-dark drop-shadow-[1px_1px_0_white] sm:drop-shadow-[2px_2px_0_white] animate-[ko-zoom_0.8s_ease-out]">
            Victoire !
          </span>
        </div>
      )}
    </button>
  );
}

export default CarteCandidat;
