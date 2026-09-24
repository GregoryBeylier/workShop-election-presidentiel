import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

export interface IdentifiantsProvisoires {
  email: string;
  motDePasse: string;
}

/**
 * Identifiants à transmettre à la personne (email + mot de passe provisoire),
 * avec un bouton qui copie un message prêt à envoyer. Affichés une seule fois.
 */
function Identifiants({
  identifiants,
}: {
  identifiants: IdentifiantsProvisoires;
}) {
  const [copie, setCopie] = useState(false);
  const message = [
    "Vos identifiants pour l'élection MyDigitalSchool :",
    `Adresse : ${window.location.origin}/login`,
    `Email : ${identifiants.email}`,
    `Mot de passe provisoire : ${identifiants.motDePasse}`,
    "Vous choisirez votre propre mot de passe à la première connexion.",
  ].join("\n");

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible : les identifiants restent lisibles à l'écran
    }
  };

  return (
    <div className="rounded-xl border border-brand-teal/30 bg-brand-teal/5 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
        <KeyRound size={16} className="text-brand-teal-dark" />
        Identifiants à transmettre
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-gray-500">Email</dt>
          <dd className="break-all font-medium text-brand-dark">
            {identifiants.email}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Mot de passe provisoire</dt>
          <dd className="break-all font-mono font-medium text-brand-dark">
            {identifiants.motDePasse}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          Il ne sera plus affiché ensuite. La personne le changera à sa première
          connexion.
        </p>
        <button
          type="button"
          onClick={copier}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand-dark px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-brand-dark/85"
        >
          {copie ? <Check size={14} /> : <Copy size={14} />}
          {copie ? "Copié" : "Copier le message"}
        </button>
      </div>
    </div>
  );
}

export default Identifiants;
