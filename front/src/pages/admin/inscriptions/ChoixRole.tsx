import { UserRound, UserRoundCheck } from "lucide-react";
import type { EtatScrutin } from "../../../api/election";

export type Role = "electeur" | "candidat";

const options: {
  id: Role;
  titre: string;
  detail: string;
  icon: typeof UserRound;
}[] = [
  {
    id: "electeur",
    titre: "Électeur",
    detail: "Vote pendant le scrutin",
    icon: UserRound,
  },
  {
    id: "candidat",
    titre: "Candidat",
    detail: "Se présente au scrutin (et vote aussi)",
    icon: UserRoundCheck,
  },
];

/**
 * Choix du rôle à l'inscription : simple électeur ou candidat (qui vote aussi).
 * "Candidat" n'est possible que pendant la préparation du scrutin.
 */
function ChoixRole({
  role,
  candidatPossible,
  etat,
  onChange,
}: {
  role: Role;
  candidatPossible: boolean;
  etat: EtatScrutin | null;
  onChange: (role: Role) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-gray-500">
        Inscrire en tant que
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map(({ id, titre, detail, icon: Icon }) => {
          const desactive = id === "candidat" && !candidatPossible;
          const actif = id === role;
          return (
            <label
              key={id}
              className={`flex items-start gap-3 rounded-xl border-2 p-3 transition-colors duration-300 ${
                desactive
                  ? "cursor-not-allowed border-gray-200 opacity-50"
                  : actif
                    ? "cursor-pointer border-brand-teal bg-brand-teal/5"
                    : "cursor-pointer border-gray-200 hover:border-brand-teal/50"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={id}
                checked={actif}
                disabled={desactive}
                onChange={() => onChange(id)}
                className="sr-only"
              />
              <Icon
                size={20}
                className={`mt-0.5 shrink-0 ${actif ? "text-brand-teal-dark" : "text-gray-400"}`}
              />
              <span>
                <span className="block font-heading font-bold text-brand-dark">
                  {titre}
                </span>
                <span className="block text-xs text-gray-500">{detail}</span>
              </span>
            </label>
          );
        })}
      </div>
      {!candidatPossible && (
        <p className="mt-2 text-xs text-brand-purple">
          {etat === null
            ? "Créez un scrutin pour pouvoir inscrire des candidats."
            : "Les candidats ne peuvent être inscrits que pendant la préparation du scrutin, avant le démarrage du vote."}
        </p>
      )}
    </fieldset>
  );
}

export default ChoixRole;
