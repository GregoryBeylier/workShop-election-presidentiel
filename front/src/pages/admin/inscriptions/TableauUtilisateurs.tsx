import { useState } from "react";
import { KeyRound, Search, Trash2 } from "lucide-react";
import type { StatutCompte, UtilisateurAdmin } from "../../../api/admin";
import Badge, { type CouleurBadge } from "../../../components/ui/Badge";

const compte: Record<StatutCompte, [string, CouleurBadge]> = {
  ACTIF: ["Actif", "green"],
  PROVISOIRE: ["Mot de passe provisoire", "teal"],
};

/** "2026-09-24" (ISO) => "24/09/2026" */
function formaterDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

/** Liste des utilisateurs avec recherche, statuts et actions (mot de passe, suppression RGPD). */
function TableauUtilisateurs({
  utilisateurs,
  onReinitialiser,
  onSupprimer,
}: {
  utilisateurs: UtilisateurAdmin[];
  onReinitialiser: (u: UtilisateurAdmin) => void;
  onSupprimer: (u: UtilisateurAdmin) => void;
}) {
  const [recherche, setRecherche] = useState("");
  const filtre = recherche.trim().toLowerCase();
  const visibles = utilisateurs.filter((u) => u.email.includes(filtre));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par email"
          aria-label="Rechercher un utilisateur"
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-3 font-semibold">Utilisateur</th>
              <th className="py-2 pr-3 font-semibold">Compte</th>
              <th className="py-2 pr-3 font-semibold">Créé le</th>
              <th className="py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0">
                <td className="py-3 pr-3">
                  <p className="font-medium text-brand-dark">{u.email}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                    {u.admin && <Badge couleur="purple">Admin</Badge>}
                    {u.candidat && <Badge couleur="teal">Candidat</Badge>}
                  </p>
                </td>
                <td className="py-3 pr-3">
                  <Badge couleur={compte[u.statutCompte][1]}>
                    {compte[u.statutCompte][0]}
                  </Badge>
                </td>
                <td className="py-3 pr-3 text-gray-600">
                  {formaterDate(u.creeLe)}
                </td>
                <td className="py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onReinitialiser(u)}
                      title="Réinitialiser le mot de passe"
                      aria-label={`Réinitialiser le mot de passe de ${u.email}`}
                      className="rounded-md p-2 text-gray-500 transition-colors duration-300 hover:bg-brand-teal/10 hover:text-brand-teal-dark"
                    >
                      <KeyRound size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSupprimer(u)}
                      title="Supprimer les données (RGPD)"
                      aria-label={`Supprimer ${u.email}`}
                      className="rounded-md p-2 text-gray-500 transition-colors duration-300 hover:bg-brand-pink/10 hover:text-brand-pink"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-500">
            Aucun utilisateur trouvé.
          </p>
        )}
      </div>
    </div>
  );
}

export default TableauUtilisateurs;
