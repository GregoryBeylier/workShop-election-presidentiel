import { useState } from "react";
import { Info } from "lucide-react";
import { retirerCandidat, type CandidatAdmin } from "../../../api/admin";
import type { EtatScrutin } from "../../../api/election";
import Panneau from "../../../components/ui/Panneau";
import ListeCandidats from "./ListeCandidats";
import Alerte, { type Message } from "../../../components/ui/Alerte";

/**
 * Onglet "Candidats" : liste des candidats du scrutin, retrait possible pendant
 * la préparation. L'inscription se fait dans l'onglet "Inscriptions".
 */
function OngletCandidats({
  candidats,
  etat,
  onChange,
}: {
  candidats: CandidatAdmin[];
  etat: EtatScrutin | null;
  onChange: () => void;
}) {
  const [message, setMessage] = useState<Message | null>(null);
  const modifiable = etat === "PREPARATION";

  const retirer = async ({ candidat }: CandidatAdmin) => {
    try {
      await retirerCandidat(candidat.id);
      setMessage({
        type: "succes",
        texte: `${candidat.prenom} ${candidat.nom} n'est plus candidat.`,
      });
      onChange();
    } catch (e) {
      setMessage({ type: "erreur", texte: (e as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {!modifiable && (
        <p className="flex items-start gap-2 rounded-xl bg-brand-purple/10 px-4 py-3 text-sm text-brand-purple">
          <Info size={18} className="mt-0.5 shrink-0" />
          {etat === null
            ? "Créez d'abord un scrutin pour pouvoir inscrire des candidats."
            : "Les candidats ne sont modifiables que pendant la préparation. Créez un nouveau scrutin pour en changer."}
        </p>
      )}

      <Panneau surTitre="Scrutin" titre={`Candidats (${candidats.length})`}>
        <ListeCandidats
          candidats={candidats}
          modifiable={modifiable}
          onRetirer={retirer}
        />
      </Panneau>

      {message && <Alerte message={message} onClose={() => setMessage(null)} />}
    </div>
  );
}

export default OngletCandidats;
