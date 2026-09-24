import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Square, Plus, BarChart3 } from "lucide-react";
import {
  cloturerScrutin,
  nouveauScrutin,
  ouvrirScrutin,
} from "../../api/admin";
import type { Periode } from "../../api/election";
import { formatJourIso as jour } from "../../utils/format";
import Bouton from "../../components/ui/Bouton";
import Confirmation from "../../components/ui/Confirmation";
import Alerte, { type Message } from "../../components/ui/Alerte";

const libelles = {
  PREPARATION: {
    texte: "En préparation",
    classe: "bg-brand-purple text-white",
  },
  OUVERT: { texte: "Vote ouvert", classe: "bg-brand-green text-white" },
  CLOS: { texte: "Scrutin clos", classe: "bg-white/20 text-white" },
};

type Action = "ouvrir" | "cloturer" | "nouveau";

// "YYYY-MM-DD" dans `jours` jours, pour le champ date
function dansJours(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() + jours);
  return date.toLocaleDateString("sv-SE");
}

/**
 * Pilotage du scrutin : un seul bouton selon l'état
 * (préparation → démarrer, ouvert → clôturer, clos → nouveau scrutin).
 */
function PilotageScrutin({
  periode,
  nbCandidats,
  onChange,
}: {
  periode: Periode | null;
  nbCandidats: number;
  onChange: () => void;
}) {
  const [closLe, setClosLe] = useState(() => dansJours(7));
  const [action, setAction] = useState<Action | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  const executer = async () => {
    try {
      if (action === "ouvrir") await ouvrirScrutin(closLe);
      if (action === "cloturer") await cloturerScrutin();
      if (action === "nouveau") await nouveauScrutin();
      setMessage({
        type: "succes",
        texte:
          action === "ouvrir"
            ? "Le vote est ouvert, les électeurs peuvent voter."
            : action === "cloturer"
              ? "Le vote est clos, les résultats sont publiés."
              : "Nouveau scrutin créé : ajoutez les candidats.",
      });
      onChange();
    } catch (e) {
      setMessage({ type: "erreur", texte: (e as Error).message });
    } finally {
      setAction(null);
    }
  };

  const etat = periode?.etat;

  return (
    <div className="rounded-2xl bg-white/10 p-5 text-white backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-white/70">
          Scrutin {periode ? `n°${periode.id}` : ""}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
            etat ? libelles[etat].classe : "bg-white/20 text-white"
          }`}
        >
          {etat === "OUVERT" && (
            <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          )}
          {etat ? libelles[etat].texte : "Aucun scrutin"}
        </span>
      </div>

      <p className="mt-3 text-sm text-white/80">
        {!periode &&
          "Créez un scrutin pour commencer à inscrire des candidats."}
        {etat === "PREPARATION" &&
          `${nbCandidats} candidat${nbCandidats > 1 ? "s" : ""} inscrit${nbCandidats > 1 ? "s" : ""}. Il en faut au moins 2 pour démarrer.`}
        {etat === "OUVERT" &&
          `Ouvert depuis le ${jour(periode!.ouvertLe)} · clôture prévue le ${jour(periode!.closLe)}.`}
        {etat === "CLOS" &&
          `Vote du ${jour(periode!.ouvertLe)} au ${jour(periode!.closLe)}. Les résultats sont publics.`}
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        {etat === "PREPARATION" && (
          <>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="clos-le"
                className="text-xs font-medium text-white/70"
              >
                Clôture prévue le
              </label>
              <input
                id="clos-le"
                type="date"
                value={closLe}
                min={dansJours(0)}
                onChange={(e) => setClosLe(e.target.value)}
                className="rounded-md border border-white/30 bg-white px-3 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <Bouton
              onClick={() => setAction("ouvrir")}
              disabled={nbCandidats < 2 || !closLe}
            >
              <Play size={16} />
              Démarrer le vote
            </Bouton>
          </>
        )}
        {etat === "OUVERT" && (
          <Bouton variante="danger" onClick={() => setAction("cloturer")}>
            <Square size={16} />
            Clôturer le vote
          </Bouton>
        )}
        {(etat === "CLOS" || !periode) && (
          <Bouton onClick={() => setAction("nouveau")}>
            <Plus size={16} />
            {periode ? "Nouveau scrutin" : "Créer un scrutin"}
          </Bouton>
        )}
        {etat === "CLOS" && (
          <Link
            to="/resultats"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-white/10"
          >
            <BarChart3 size={16} />
            Voir les résultats
          </Link>
        )}
      </div>

      {message && (
        <div className="mt-4">
          <Alerte message={message} onClose={() => setMessage(null)} />
        </div>
      )}

      {action === "ouvrir" && (
        <Confirmation
          titre="Démarrer le vote ?"
          libelle="Démarrer"
          onConfirm={executer}
          onCancel={() => setAction(null)}
        >
          Les {(nbCandidats * (nbCandidats - 1)) / 2} duels vont être générés
          entre les {nbCandidats} candidats et le vote sera ouvert jusqu'au{" "}
          {jour(closLe)}. Les candidats ne pourront plus être modifiés.
        </Confirmation>
      )}
      {action === "cloturer" && (
        <Confirmation
          titre="Clôturer le vote ?"
          libelle="Clôturer"
          danger
          onConfirm={executer}
          onCancel={() => setAction(null)}
        >
          Plus personne ne pourra voter et les résultats seront publiés
          immédiatement. Cette action est définitive.
        </Confirmation>
      )}
      {action === "nouveau" && (
        <Confirmation
          titre="Créer un nouveau scrutin ?"
          libelle="Créer"
          onConfirm={executer}
          onCancel={() => setAction(null)}
        >
          Un scrutin en préparation est créé et tous les électeurs y sont
          inscrits. Les résultats du scrutin précédent restent consultables en
          base.
        </Confirmation>
      )}
    </div>
  );
}

export default PilotageScrutin;
