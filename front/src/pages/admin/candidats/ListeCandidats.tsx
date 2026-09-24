import { Trash2 } from "lucide-react";
import type { CandidatAdmin } from "../../../api/admin";
import DepotPhoto from "../../../components/ui/DepotPhoto";
import { initiales } from "../../../utils/format";

/**
 * Candidats du scrutin, même carte que la page Vote. La photo et le logo se
 * changent à tout moment (glisser-déposer ou clic) ; le retrait n'est possible
 * qu'en préparation.
 */
function ListeCandidats({
  candidats,
  modifiable,
  onRetirer,
  onPhoto,
  onSupprimerPhoto,
  onLogo,
  onSupprimerLogo,
  onErreur,
}: {
  candidats: CandidatAdmin[];
  modifiable: boolean;
  onRetirer: (c: CandidatAdmin) => void;
  onPhoto: (c: CandidatAdmin, photo: Blob) => Promise<void>;
  onSupprimerPhoto: (c: CandidatAdmin) => Promise<void>;
  onLogo: (c: CandidatAdmin, logo: Blob) => Promise<void>;
  onSupprimerLogo: (c: CandidatAdmin) => Promise<void>;
  onErreur: (message: string) => void;
}) {
  if (candidats.length === 0) {
    return (
      <p className="text-sm text-gray-500">Aucun candidat pour l'instant.</p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {candidats.map(({ candidat, email }) => (
        <li
          key={candidat.id}
          className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#FAFAFA] p-3"
        >
          <DepotPhoto
            texte={initiales(candidat.prenom, candidat.nom)}
            photo={candidat.photo}
            libelle={`la photo de ${candidat.prenom} ${candidat.nom}`}
            onPhoto={(photo) => onPhoto({ candidat, email }, photo)}
            onSupprimer={() => onSupprimerPhoto({ candidat, email })}
            onErreur={onErreur}
            className="h-14 w-14 bg-gradient-to-br from-brand-teal/15 to-brand-dark/10 font-heading font-bold text-brand-dark"
          />
          <DepotPhoto
            logo
            texte="Logo"
            photo={candidat.logo}
            libelle={`le logo de ${candidat.prenom} ${candidat.nom}`}
            onPhoto={(logo) => onLogo({ candidat, email }, logo)}
            onSupprimer={() => onSupprimerLogo({ candidat, email })}
            onErreur={onErreur}
            className="h-14 w-14 border border-dashed border-gray-300 bg-white text-[10px] font-medium text-gray-400"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading font-bold uppercase tracking-wide text-brand-dark">
              {candidat.prenom} {candidat.nom}
            </p>
            <p className="truncate text-sm font-medium text-brand-teal-dark">
              {candidat.parti}
            </p>
            <p className="truncate text-xs text-gray-500">{email}</p>
          </div>
          {modifiable && (
            <button
              type="button"
              onClick={() => onRetirer({ candidat, email })}
              title="Retirer ce candidat"
              aria-label={`Retirer ${candidat.prenom} ${candidat.nom}`}
              className="rounded-md p-2 text-gray-500 transition-colors duration-300 hover:bg-brand-pink/10 hover:text-brand-pink"
            >
              <Trash2 size={16} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export default ListeCandidats;
