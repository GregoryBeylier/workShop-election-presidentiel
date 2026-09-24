import type { MouseEvent } from "react";
import { CalendarDays, Clock } from "lucide-react";

// Champ "verre" sur fond dégradé : le sélecteur natif est masqué, un clic
// n'importe où sur le champ l'ouvre (showPicker), l'icône de la charte le remplace
const styleChamp =
  "w-full min-w-0 appearance-none rounded-lg border border-white/25 bg-white/10 py-2.5 pl-9 pr-2.5 text-sm font-semibold text-white [color-scheme:dark] transition-colors duration-300 hover:border-white/40 hover:bg-white/15 focus:border-brand-teal focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 [&::-webkit-calendar-picker-indicator]:hidden";

function ouvrirSelecteur(e: MouseEvent<HTMLInputElement>) {
  try {
    e.currentTarget.showPicker();
  } catch {
    // Navigateur sans showPicker : la saisie au clavier reste possible
  }
}

/**
 * Date + heure sur deux champs côte à côte, pour les fonds sombres (bandeau).
 * `value` / `onChange` : "YYYY-MM-DDTHH:mm", comme un input datetime-local.
 */
function ChampDateHeure({
  id,
  label,
  value,
  min,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  onChange: (valeur: string) => void;
}) {
  const [date = "", heure = ""] = value.split("T");
  const [dateMin, heureMin] = min?.split("T") ?? [];

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="flex flex-col gap-1.5"
    >
      <span id={`${id}-label`} className="text-xs font-medium text-white/70">
        {label}
      </span>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <CalendarDays
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-teal-light"
          />
          <input
            id={id}
            type="date"
            aria-label="Date"
            value={date}
            min={dateMin}
            required
            onClick={ouvrirSelecteur}
            onChange={(e) => onChange(`${e.target.value}T${heure}`)}
            className={styleChamp}
          />
        </div>
        <div className="relative">
          <Clock
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-teal-light"
          />
          <input
            id={`${id}-heure`}
            type="time"
            aria-label="Heure"
            value={heure}
            // L'heure minimale ne s'applique que si la date choisie est aujourd'hui
            min={date === dateMin ? heureMin : undefined}
            required
            onClick={ouvrirSelecteur}
            onChange={(e) => onChange(`${date}T${e.target.value}`)}
            className={styleChamp}
          />
        </div>
      </div>
    </div>
  );
}

export default ChampDateHeure;
