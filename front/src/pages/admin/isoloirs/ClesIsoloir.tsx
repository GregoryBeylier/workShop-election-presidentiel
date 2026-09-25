import { useState } from "react";
import { Check, Copy, ExternalLink, KeyRound } from "lucide-react";
import type { IsoloirCree } from "../../../api/admin";

/**
 * Ce qu'il faut pour installer l'isoloir qui vient d'être créé : l'adresse de son écran
 * (avec la clé écran) et les lignes de config.h de sa borne (avec la clé borne).
 * Affiché une seule fois : la base ne garde que l'empreinte des clés.
 */
function ClesIsoloir({ isoloir }: { isoloir: IsoloirCree }) {
  const urlEcran = `${window.location.origin}/isoloir/${isoloir.id}?cle=${isoloir.cleEcran}`;
  // La borne parle directement au back (port 8080), en HTTP, sur le réseau local
  const configBorne = [
    `const char* const SERVEUR   = "http://${window.location.hostname}:8080";`,
    `const char* const CLE_BORNE = "${isoloir.cleBorne}";`,
  ].join("\n");
  const surLocalhost = ["localhost", "127.0.0.1"].includes(
    window.location.hostname,
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-brand-teal/30 bg-brand-teal/5 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
        <KeyRound size={16} className="text-brand-teal-dark" />
        {isoloir.libelle} créé (n° {isoloir.id}) : à installer maintenant
      </p>

      <Bloc
        titre="1. Écran de l'isoloir"
        aide="Ouvrir cette adresse sur l'écran, en plein écran, puis effacer l'historique du navigateur."
        valeur={urlEcran}
        lien={urlEcran}
      />
      <Bloc
        titre="2. Borne ESP32 : lignes à mettre dans config.h, puis reflasher"
        aide="Garder aussi le Wi-Fi de l'événement dans config.h (WIFI_SSID, WIFI_MDP)."
        valeur={configBorne}
      />

      {surLocalhost && (
        <p className="text-xs font-medium text-brand-pink">
          Vous êtes sur « localhost » : sur l'écran et dans config.h,
          remplacez-le par l'adresse IP du serveur sur le Wi-Fi.
        </p>
      )}
      <p className="text-xs text-gray-500">
        Ces clés ne seront plus affichées. En cas de perte, désactivez l'isoloir
        et créez-en un nouveau. Ne les envoyez pas par message et ne les
        commitez pas.
      </p>
    </div>
  );
}

function Bloc({
  titre,
  aide,
  valeur,
  lien,
}: {
  titre: string;
  aide: string;
  valeur: string;
  lien?: string;
}) {
  const [copie, setCopie] = useState(false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(valeur);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible (HTTP) : la valeur reste lisible et sélectionnable
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-brand-dark">{titre}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-white p-3 font-mono text-xs text-brand-dark">
        {valeur}
      </pre>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">{aide}</p>
        <div className="flex shrink-0 gap-2">
          {lien && (
            <a
              href={lien}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-300 hover:bg-gray-50"
            >
              <ExternalLink size={14} /> Ouvrir
            </a>
          )}
          <button
            type="button"
            onClick={copier}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-dark px-3 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-brand-dark/85"
          >
            {copie ? <Check size={14} /> : <Copy size={14} />}
            {copie ? "Copié" : "Copier"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClesIsoloir;
