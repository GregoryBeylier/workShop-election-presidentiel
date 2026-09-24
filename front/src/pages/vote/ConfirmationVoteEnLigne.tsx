import { useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { ApiError } from "../../api/client";
import { commencerVoteEnLigne } from "../../api/checkin";
import Alerte from "../../components/ui/Alerte";
import Bouton from "../../components/ui/Bouton";
import AvertissementChoix from "./AvertissementChoix";

/**
 * Confirmation avant les duels : commencer le vote en ligne ferme définitivement
 * le vote à l'isoloir (le bulletin en ligne est créé côté back).
 */
function ConfirmationVoteEnLigne({ onCommence }: { onCommence: () => void }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const commencer = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      const res = await commencerVoteEnLigne();
      if (res.status === "success") {
        onCommence();
      } else {
        setErreur(res.message);
      }
    } catch (e) {
      setErreur(
        e instanceof ApiError && e.status === 0
          ? "Connexion impossible. Vérifiez que vous êtes connecté au Wi-Fi de l'école, puis réessayez."
          : "Une erreur est survenue, réessayez.",
      );
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-8 sm:py-12">
      <div className="flex h-fit w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">Voter en ligne</h1>

        <AvertissementChoix>
          En commençant, vous renoncez <b>définitivement</b> au vote à l'isoloir, même si vous
          n'allez pas au bout de vos duels.
        </AvertissementChoix>

        <p className="text-gray-600">
          Vous allez comparer les candidats deux par deux. Pour chaque duel, choisissez celui que
          vous préférez, ou passez si vous n'avez pas de préférence.
        </p>

        {erreur && <Alerte message={{ type: "erreur", texte: erreur }} />}

        <Bouton onClick={commencer} disabled={enCours} className="py-3 text-base">
          <Smartphone size={20} /> {enCours ? "Un instant…" : "Commencer"}
        </Bouton>

        <Link to="/vote" className="self-center text-sm text-gray-500 underline">
          ← Revenir au choix du mode de vote
        </Link>
      </div>
    </div>
  );
}

export default ConfirmationVoteEnLigne;
