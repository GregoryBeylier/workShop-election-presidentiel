import { useState, type FormEvent } from "react";
import { Ban, Plus, RotateCcw, XCircle } from "lucide-react";
import {
  annulerVoteIsoloir,
  creerIsoloir,
  desactiverIsoloir,
  getIsoloirs,
  recommencerVoteIsoloir,
  type IsoloirAdmin,
  type IsoloirCree,
} from "../../../api/admin";
import { usePolling } from "../../../hooks/usePolling";
import Alerte, { type Message } from "../../../components/ui/Alerte";
import Badge from "../../../components/ui/Badge";
import Bouton from "../../../components/ui/Bouton";
import Champ from "../../../components/ui/Champ";
import Confirmation from "../../../components/ui/Confirmation";
import Panneau from "../../../components/ui/Panneau";
import ClesIsoloir from "./ClesIsoloir";

// État des bornes en direct (elles appellent le serveur toutes les 2 s)
const INTERVALLE_MS = 3000;

/**
 * Onglet "Isoloirs" : un isoloir = un écran qui affiche le QR + une borne ESP32.
 * Création (avec ses clés), suivi des bornes en direct, désactivation, et reprise en main
 * d'un vote bloqué sur une borne (recommencer ou annuler).
 */

type ActionVote = { isoloir: IsoloirAdmin; action: "recommencer" | "annuler" };

/** "2026-09-25T12:02:10" (UTC, sans fuseau) => "14:02" en heure locale */
function heureLocale(isoUtc: string): string {
  return new Date(`${isoUtc}Z`).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function OngletIsoloirs() {
  const {
    data: isoloirs,
    erreur,
    recharger,
  } = usePolling(getIsoloirs, INTERVALLE_MS);
  const [libelle, setLibelle] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [cree, setCree] = useState<IsoloirCree | null>(null);
  const [aDesactiver, setADesactiver] = useState<IsoloirAdmin | null>(null);
  const [actionVote, setActionVote] = useState<ActionVote | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  const libelleParDefaut = `Isoloir ${(isoloirs?.length ?? 0) + 1}`;

  const creer = async (e: FormEvent) => {
    e.preventDefault();
    setEnCours(true);
    setMessage(null);
    try {
      setCree(await creerIsoloir(libelle.trim() || libelleParDefaut));
      setLibelle("");
      recharger();
    } catch (err) {
      setMessage({ type: "erreur", texte: (err as Error).message });
    } finally {
      setEnCours(false);
    }
  };

  const desactiver = async () => {
    if (!aDesactiver) return;
    try {
      await desactiverIsoloir(aDesactiver.id);
      setMessage({
        type: "succes",
        texte: `${aDesactiver.libelle} est désactivé.`,
      });
      recharger();
    } catch (err) {
      setMessage({ type: "erreur", texte: (err as Error).message });
    } finally {
      setADesactiver(null);
    }
  };

  const confirmerActionVote = async () => {
    if (!actionVote) return;
    const { isoloir, action } = actionVote;
    try {
      if (action === "recommencer") {
        await recommencerVoteIsoloir(isoloir.id);
      } else {
        await annulerVoteIsoloir(isoloir.id);
      }
      setMessage({
        type: "succes",
        texte:
          action === "recommencer"
            ? `${isoloir.libelle} : le vote repart du premier duel.`
            : `${isoloir.libelle} : le vote est annulé, la borne est libre.`,
      });
      recharger();
    } catch (err) {
      setMessage({ type: "erreur", texte: (err as Error).message });
      recharger();
    } finally {
      setActionVote(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Panneau surTitre="Installation" titre="Créer un isoloir">
        <form
          onSubmit={creer}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Champ
              label="Nom de l'isoloir"
              id="isoloir-libelle"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder={libelleParDefaut}
              maxLength={50}
            />
          </div>
          <Bouton type="submit" disabled={enCours}>
            <Plus size={16} /> {enCours ? "Création…" : "Créer l'isoloir"}
          </Bouton>
        </form>
        <p className="mt-3 text-xs text-gray-500">
          Le serveur génère les clés de l'écran et de la borne. Elles
          s'affichent une seule fois, juste après la création.
        </p>
      </Panneau>

      {message && <Alerte message={message} onClose={() => setMessage(null)} />}
      {cree && <ClesIsoloir isoloir={cree} />}

      <Panneau
        surTitre="Jour J"
        titre={`Isoloirs${isoloirs ? ` (${isoloirs.length})` : ""}`}
      >
        {erreur && <Alerte message={{ type: "erreur", texte: erreur }} />}
        {isoloirs === null ? (
          !erreur && <p className="text-sm text-gray-500">Chargement…</p>
        ) : isoloirs.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun isoloir pour l'instant.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100">
            {isoloirs.map((i) => (
              <li key={i.id} className="flex flex-col gap-3 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-brand-dark">
                      {i.libelle}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        n° {i.id}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <EtatIsoloir isoloir={i} />
                    {i.actif && (
                      <button
                        type="button"
                        onClick={() => setADesactiver(i)}
                        title="Désactiver cet isoloir"
                        aria-label={`Désactiver ${i.libelle}`}
                        className="rounded-md p-2 text-gray-500 transition-colors duration-300 hover:bg-brand-pink/10 hover:text-brand-pink"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {i.actif && i.vote && (
                  <div className="flex flex-col gap-3 rounded-xl bg-brand-purple/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-brand-dark">
                        {i.vote.votant}
                      </span>{" "}
                      vote : duel {i.vote.duel} sur {i.vote.total}, depuis{" "}
                      {heureLocale(i.vote.depuis)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Bouton
                        variante="secondaire"
                        onClick={() =>
                          setActionVote({ isoloir: i, action: "recommencer" })
                        }
                      >
                        <RotateCcw size={14} /> Recommencer
                      </Bouton>
                      <Bouton
                        variante="danger"
                        onClick={() =>
                          setActionVote({ isoloir: i, action: "annuler" })
                        }
                      >
                        <XCircle size={14} /> Annuler le vote
                      </Bouton>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      {actionVote && (
        <Confirmation
          titre={
            actionVote.action === "recommencer"
              ? "Recommencer le vote ?"
              : "Annuler le vote ?"
          }
          libelle={
            actionVote.action === "recommencer"
              ? "Recommencer"
              : "Annuler le vote"
          }
          danger={actionVote.action === "annuler"}
          onConfirm={confirmerActionVote}
          onCancel={() => setActionVote(null)}
        >
          {actionVote.action === "recommencer" ? (
            <p>
              Les choix déjà faits par{" "}
              <strong>{actionVote.isoloir.vote?.votant}</strong> sont effacés.
              Le votant reste dans l'isoloir et reprend au premier duel : la
              borne émet un signal d'erreur au prochain bouton, puis rallume le
              duel 1.
            </p>
          ) : (
            <>
              <p>
                Le vote de <strong>{actionVote.isoloir.vote?.votant}</strong>{" "}
                est annulé : ses choix sont effacés et il redevient « n'a pas
                voté ». Il pourra rescanner un isoloir, ou voter en ligne.
              </p>
              <p className="mt-2">
                La borne se libère : elle se reverrouille au prochain appui sur
                un bouton, ou en la redémarrant. Rien n'est compté dans les
                résultats.
              </p>
            </>
          )}
        </Confirmation>
      )}

      {aDesactiver && (
        <Confirmation
          titre="Désactiver l'isoloir ?"
          libelle="Désactiver"
          danger
          onConfirm={desactiver}
          onCancel={() => setADesactiver(null)}
        >
          <p>
            Les QR de <strong>{aDesactiver.libelle}</strong> seront refusés tout
            de suite, et sa borne aussi. À utiliser si l'écran ou la borne a été
            perdu ou manipulé : créez ensuite un nouvel isoloir, avec de
            nouvelles clés. Cette action est irréversible.
          </p>
        </Confirmation>
      )}
    </div>
  );
}

function EtatIsoloir({ isoloir }: { isoloir: IsoloirAdmin }) {
  if (!isoloir.actif) {
    return <Badge couleur="gray">Désactivé</Badge>;
  }
  return (
    <>
      {!isoloir.aUneBorne ? (
        <Badge couleur="gray">Sans borne</Badge>
      ) : isoloir.borneEnLigne ? (
        <Badge couleur="green">Borne en ligne</Badge>
      ) : (
        <Badge couleur="pink">Borne hors ligne</Badge>
      )}
      {isoloir.voteEnCours ? (
        <Badge couleur="purple">Vote en cours</Badge>
      ) : (
        <Badge couleur="teal">Libre</Badge>
      )}
    </>
  );
}

export default OngletIsoloirs;
