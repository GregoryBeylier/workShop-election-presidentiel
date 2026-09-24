import { useEffect, useState } from "react";
import { formatJour } from "../../utils/format";

// Heure courante, rafraîchie chaque seconde
function useMaintenant(): number {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return maintenant;
}

/** Heures (totales, le scrutin peut durer plusieurs jours) / minutes / secondes restantes. */
function tempsRestant(cloture: Date | null, maintenant: number) {
  const ecart = cloture ? cloture.getTime() - maintenant : 0;
  if (ecart <= 0) return { heures: 0, minutes: 0, secondes: 0 };
  return {
    heures: Math.floor(ecart / (1000 * 60 * 60)),
    minutes: Math.floor((ecart / (1000 * 60)) % 60),
    secondes: Math.floor((ecart / 1000) % 60),
  };
}

/** Compte à rebours jusqu'à la clôture du scrutin. */
function CompteARebours({ cloture }: { cloture: Date | null }) {
  const { heures, minutes, secondes } = tempsRestant(cloture, useMaintenant());

  const blocs = [
    { valeur: heures, label: "Heures" },
    { valeur: minutes, label: "Minutes" },
    { valeur: secondes, label: "Secondes" },
  ];

  return (
    <div className="mt-8">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
        Avant la clôture du scrutin
      </p>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {blocs.map(({ valeur, label }) => (
          <div key={label} className="rounded-2xl bg-[#3C3C3B] p-3 sm:p-5">
            <p className="text-2xl font-black text-[#2EC7D3] sm:text-4xl">
              {String(valeur).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase text-white/50 sm:text-xs">
              {label}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm font-bold text-[#3C3C3B]">
        Avant la clôture du scrutin
        {cloture && `, le ${formatJour(cloture)} à minuit`}
      </p>
    </div>
  );
}

export default CompteARebours;
