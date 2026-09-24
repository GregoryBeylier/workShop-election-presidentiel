import { useEffect, useRef, useState } from "react";
import { Eye, Lock } from "lucide-react";
import type { ResultatCandidat } from "../../../api/election";
import BarreProgression from "../../../components/ui/BarreProgression";
import { formatPoints } from "../../../utils/format";

// Code de déblocage du classement (protection anti-coup d'œil, pas une vraie
// sécurité : les données sont déjà dans la réponse de l'API).
const CODE_ACCES = "2026";
const DUREE_AFFICHAGE = 10; // secondes

/** Classement en points, mis à jour en direct (visible uniquement par l'admin pendant le vote). */
function ClassementDirect({ classement }: { classement: ResultatCandidat[] }) {
  const max = Math.max(...classement.map((r) => r.points), 1);

  const [devoile, setDevoile] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState(false);
  const [secondesRestantes, setSecondesRestantes] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const valider = () => {
    if (saisie === CODE_ACCES) {
      setDevoile(true);
      setErreur(false);
      setSaisie("");
      setSecondesRestantes(DUREE_AFFICHAGE);

      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        setSecondesRestantes((s) => {
          if (s <= 1) {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            setDevoile(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      setErreur(true);
      setSaisie("");
    }
  };

  if (classement.length === 0) {
    return (
      <p className="text-sm text-gray-500">Aucun candidat pour ce scrutin.</p>
    );
  }

  return (
    <div className="relative">
      <ol
        className={`space-y-3 transition-all duration-300 ${
          devoile ? "" : "pointer-events-none select-none blur-md"
        }`}
      >
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

      {!devoile && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/70">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
            <Lock size={18} className="text-gray-400" />
            <p className="text-sm font-medium text-brand-dark">
              Classement masqué
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={saisie}
                onChange={(e) => {
                  setErreur(false);
                  setSaisie(e.target.value.replace(/\D/g, "").slice(0, 4));
                }}
                onKeyDown={(e) => e.key === "Enter" && valider()}
                placeholder="Code"
                aria-label="Code à 4 chiffres pour afficher le classement"
                className={`w-20 rounded-md border py-1.5 px-3 text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-teal ${
                  erreur ? "border-red-400" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={valider}
                disabled={saisie.length !== 4}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-teal px-3 py-1.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-brand-teal-dark disabled:opacity-40"
              >
                <Eye size={14} />
                Afficher
              </button>
            </div>
            {erreur && (
              <p className="text-xs text-red-500">Code incorrect</p>
            )}
          </div>
        </div>
      )}

      {devoile && (
        <p className="absolute top-0 right-0 text-xs font-medium text-gray-400">
          Masqué dans {secondesRestantes}s
        </p>
      )}
    </div>
  );
}

export default ClassementDirect;
