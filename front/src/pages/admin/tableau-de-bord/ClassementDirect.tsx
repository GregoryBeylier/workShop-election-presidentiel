import type { ResultatCandidat } from "../../../api/election";
import BarreProgression from "../../../components/ui/BarreProgression";
import { formatPoints } from "../../../utils/format";

/** Classement en points, mis à jour en direct (visible uniquement par l'admin pendant le vote). */
function ClassementDirect({ classement }: { classement: ResultatCandidat[] }) {
  const max = Math.max(...classement.map((r) => r.points), 1);

  if (classement.length === 0) {
    return (
      <p className="text-sm text-gray-500">Aucun candidat pour ce scrutin.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {classement.map((r, i) => (
        <li
          key={r.candidat.id}
          className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#FAFAFA] p-3 sm:gap-4 sm:p-4"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${
              i === 0 ? "bg-brand-teal" : "bg-brand-dark"
            }`}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-bold text-brand-dark">
                {r.candidat.prenom} {r.candidat.nom}
                <span className="ml-2 text-xs font-semibold text-gray-500">
                  {r.candidat.parti}
                </span>
              </p>
              <span className="shrink-0 font-heading font-extrabold text-brand-dark">
                {formatPoints(r.points)} pts
              </span>
            </div>
            <BarreProgression
              pourcentage={(r.points / max) * 100}
              className="mt-2 h-2 bg-gray-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              {r.victoires} victoire{r.victoires > 1 ? "s" : ""} · {r.egalites}{" "}
              égalité
              {r.egalites > 1 ? "s" : ""} · {r.defaites} défaite
              {r.defaites > 1 ? "s" : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default ClassementDirect;
