import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Hash, Smartphone } from "lucide-react";
import { useStatutVotant } from "../../hooks/useStatutVotant";
import Alerte from "../../components/ui/Alerte";
import MessagePage from "../../components/ui/MessagePage";
import VoteTermine from "./VoteTermine";

/**
 * Point d'entrée de l'onglet "Voter" : l'électeur choisit de voter en ligne
 * (les duels) ou à l'isoloir (code de l'isoloir puis vote sur la borne). Le choix est
 * confirmé sur la page suivante ; on ne peut pas faire les deux.
 */
function PageChoixVote() {
  const { statut, erreur } = useStatutVotant();

  if (statut === "voted_booth") {
    return <VoteTermine />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="mb-8 text-center">
        <span className="mb-3 inline-block rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-teal-dark">
          MODE DE VOTE
        </span>
        <h1 className="font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
          Comment souhaitez-vous voter ?
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
          Vous votez une seule fois : en ligne ou à l'isoloir, pas les deux. Votre choix sera
          définitif une fois confirmé à l'étape suivante.
        </p>
      </div>

      {erreur && (
        <div className="mx-auto max-w-xl">
          <Alerte
            message={{
              type: "erreur",
              texte: "Connexion impossible. Vérifiez que vous êtes connecté au Wi-Fi de l'école, puis rechargez la page.",
            }}
          />
        </div>
      )}

      {statut === null && !erreur && <MessagePage texte="Chargement…" />}

      {statut === "not_registered" && (
        <div className="mx-auto max-w-xl">
          <Alerte message={{ type: "erreur", texte: "Vous n'êtes pas inscrit à l'élection en cours." }} />
        </div>
      )}

      {(statut === "not_voted" || statut === "voted_app" || statut === "checked_in_isoloir") && (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          <CarteChoix
            icon={Smartphone}
            titre="Voter en ligne"
            description="Comparez les candidats duel après duel, depuis votre téléphone ou votre ordinateur."
            raisonIndisponible={
              statut === "checked_in_isoloir"
                ? "Vous êtes identifié dans un isoloir : votez sur la borne."
                : undefined
            }
            action={
              <Link
                to="/vote/en-ligne"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-teal px-5 py-3 font-medium text-white transition-colors duration-300 hover:bg-brand-teal-dark"
              >
                {statut === "voted_app" ? "Continuer mes duels →" : "Voter en ligne →"}
              </Link>
            }
          />

          <CarteChoix
            icon={Hash}
            titre="Voter à l'isoloir"
            description="Dans l'isoloir, tapez le code affiché à l'écran, puis votez avec les boutons de la borne."
            raisonIndisponible={
              statut === "voted_app"
                ? "Vous avez déjà commencé à voter en ligne : le vote à l'isoloir n'est plus possible."
                : undefined
            }
            action={
              <Link
                to="/vote/isoloir"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-brand-dark px-5 py-3 font-medium text-brand-dark transition-colors duration-300 hover:bg-brand-dark hover:text-white"
              >
                {statut === "checked_in_isoloir" ? "Suivre mon vote sur la borne →" : "Voter à l'isoloir →"}
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}

function CarteChoix({
  icon: Icon,
  titre,
  description,
  raisonIndisponible,
  action,
}: {
  icon: typeof Hash;
  titre: string;
  description: string;
  raisonIndisponible?: string;
  action: ReactNode;
}) {
  const indisponible = Boolean(raisonIndisponible);

  return (
    <div
      className={`flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg ${indisponible ? "opacity-60" : ""}`}
      aria-disabled={indisponible}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal-dark">
        <Icon size={24} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-bold text-brand-dark">{titre}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="mt-auto pt-2">
        {indisponible ? <p className="text-sm text-gray-600">{raisonIndisponible}</p> : action}
      </div>
    </div>
  );
}

export default PageChoixVote;
