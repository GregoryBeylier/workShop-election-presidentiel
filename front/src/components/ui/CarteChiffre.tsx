import type { LucideIcon } from "lucide-react";

/**
 * Chiffre clé du tableau de bord (mêmes blocs que la participation de la page Résultats).
 */
function CarteChiffre({
  label,
  valeur,
  detail,
  icon: Icon,
  accent = false,
}: {
  label: string;
  valeur: string | number;
  detail: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${
        accent ? "bg-brand-teal text-brand-dark" : "bg-brand-dark text-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-xs font-bold uppercase tracking-wide ${
            accent ? "text-brand-dark/60" : "text-white/60"
          }`}
        >
          {label}
        </p>
        <Icon
          size={18}
          className={accent ? "text-brand-dark/60" : "text-brand-teal"}
        />
      </div>
      <p
        className={`mt-2 font-heading text-3xl font-extrabold sm:text-4xl ${
          accent ? "" : "text-brand-teal"
        }`}
      >
        {valeur}
      </p>
      <p
        className={`mt-1 text-sm ${accent ? "text-brand-dark/60" : "text-white/60"}`}
      >
        {detail}
      </p>
    </div>
  );
}

export default CarteChiffre;
