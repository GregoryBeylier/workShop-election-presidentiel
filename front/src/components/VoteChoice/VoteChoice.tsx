import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, CircleAlert, QrCode, Smartphone, WifiOff } from "lucide-react";
import { useVoterStatus } from "./useVoterStatus";

/**
 * Point d'entrée de l'onglet "Voter" : l'électeur choisit de voter en ligne
 * (les duels) ou à l'isoloir (scan du QR puis bulletin papier).
 * Les choix proposés dépendent de son statut : on ne peut pas faire les deux.
 */
function VoteChoice() {
  const { status, error } = useVoterStatus();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="text-center mb-8">
        <span className="inline-block bg-brand-teal/10 text-brand-teal-dark text-xs font-semibold px-3 py-1 rounded-full mb-3">
          MODE DE VOTE
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-brand-dark">
          Comment souhaitez-vous voter ?
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
          Vous votez une seule fois : en ligne ou à l'isoloir, pas les deux. Votre choix sera
          définitif une fois confirmé à l'étape suivante.
        </p>
      </div>

      {error && (
        <Notice tone="error" icon={WifiOff}>
          Connexion impossible. Vérifiez que vous êtes connecté au Wi-Fi de l'école, puis{" "}
          <button type="button" onClick={() => window.location.reload()} className="underline font-semibold">
            réessayez
          </button>
          .
        </Notice>
      )}

      {status === null && !error && <p className="text-gray-500 text-center">Chargement…</p>}

      {status === "not_registered" && (
        <Notice tone="error" icon={CircleAlert}>
          Vous n'êtes pas inscrit à l'élection en cours.
        </Notice>
      )}

      {(status === "not_voted" || status === "voted_app" || status === "checked_in_isoloir") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <ChoiceCard
            icon={Smartphone}
            title="Voter en ligne"
            description="Comparez les candidats duel après duel, depuis votre téléphone ou votre ordinateur."
            disabledReason={
              status === "checked_in_isoloir"
                ? "Vous êtes identifié dans un isoloir : votez sur le bulletin papier."
                : undefined
            }
            action={
              <Link
                to="/vote/en-ligne"
                className="bg-brand-teal-dark text-white rounded-md px-5 py-3 font-medium hover:bg-brand-teal transition-colors duration-300 inline-flex items-center justify-center gap-2"
              >
                {status === "voted_app" ? "Continuer mes duels →" : "Voter en ligne →"}
              </Link>
            }
          />

          <ChoiceCard
            icon={QrCode}
            title="Voter à l'isoloir"
            description="Dans l'isoloir, scannez le QR code affiché à l'écran, puis votez sur le bulletin papier."
            disabledReason={
              status === "voted_app"
                ? "Vous avez déjà commencé à voter en ligne : le vote à l'isoloir n'est plus possible."
                : undefined
            }
            action={
              status === "checked_in_isoloir" ? (
                <p className="flex items-center gap-2 text-brand-green font-semibold">
                  <CheckCircle2 size={20} /> Identification réussie
                </p>
              ) : (
                <Link
                  to="/vote/isoloir"
                  className="border border-brand-dark text-brand-dark rounded-md px-5 py-3 font-medium hover:bg-brand-dark hover:text-white transition-colors duration-300 inline-flex items-center justify-center gap-2"
                >
                  Voter à l'isoloir →
                </Link>
              )
            }
          />
        </div>
      )}
    </div>
  );
}

type Icon = typeof QrCode;

function ChoiceCard({
  icon: Icon,
  title,
  description,
  disabledReason,
  action,
}: {
  icon: Icon;
  title: string;
  description: string;
  disabledReason?: string;
  action: ReactNode;
}) {
  const disabled = Boolean(disabledReason);

  return (
    <div
      className={`bg-white rounded-xl shadow p-6 flex flex-col gap-4 ${disabled ? "opacity-60" : ""}`}
      aria-disabled={disabled}
    >
      <div className="w-12 h-12 rounded-full bg-brand-teal/10 text-brand-teal-dark flex items-center justify-center">
        <Icon size={24} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-bold text-brand-dark">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="mt-auto pt-2">
        {disabled ? <p className="text-sm text-gray-600">{disabledReason}</p> : action}
      </div>
    </div>
  );
}

function Notice({ tone, icon: Icon, children }: { tone: "error"; icon: Icon; children: ReactNode }) {
  const styles = { error: "bg-brand-pink/10 border-brand-pink" }[tone];
  return (
    <div className={`flex gap-3 items-start rounded-lg border p-4 text-brand-dark max-w-xl mx-auto ${styles}`} role="status">
      <Icon size={22} className="shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export default VoteChoice;
