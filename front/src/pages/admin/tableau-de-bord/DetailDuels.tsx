import type { DetailDuels as Duel } from "../../../api/admin";

/** Répartition des votes dans chaque duel : gagnant gauche / égalité / gagnant droite. */
function DetailDuels({ duels }: { duels: Duel[] }) {
  if (duels.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Les duels seront générés au démarrage du vote.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {duels.map((d) => {
        const total = d.victoires1 + d.victoires2 + d.egalites;
        const part = (n: number) => (total > 0 ? (n / total) * 100 : 0);
        return (
          <li key={d.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-semibold text-brand-dark">
                {d.candidat1.prenom} {d.candidat1.nom}
                <span className="ml-1.5 font-heading font-extrabold text-brand-teal-dark">
                  {d.victoires1}
                </span>
              </span>
              <span className="shrink-0 text-xs text-gray-400">
                {total} vote{total > 1 ? "s" : ""} · {d.egalites} égalité
                {d.egalites > 1 ? "s" : ""}
              </span>
              <span className="truncate text-right font-semibold text-brand-dark">
                <span className="mr-1.5 font-heading font-extrabold text-brand-purple">
                  {d.victoires2}
                </span>
                {d.candidat2.prenom} {d.candidat2.nom}
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="bg-brand-teal transition-all duration-700"
                style={{ width: `${part(d.victoires1)}%` }}
              />
              <div
                className="bg-gray-300 transition-all duration-700"
                style={{ width: `${part(d.egalites)}%` }}
              />
              <div
                className="bg-brand-purple transition-all duration-700"
                style={{ width: `${part(d.victoires2)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default DetailDuels;
