import { useState, type FormEvent } from "react";
import { Ban, Plus } from "lucide-react";
import {
  creerIsoloir,
  desactiverIsoloir,
  getIsoloirs,
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
 * Onglet "Isoloirs" : un isoloir = un écran qui affiche le code + une borne ESP32.
 * Création (avec l'IP de sa borne), suivi des bornes en direct, désactivation.
 */
function OngletIsoloirs() {
  const {
    data: isoloirs,
    erreur,
    recharger,
  } = usePolling(getIsoloirs, INTERVALLE_MS);
  const [libelle, setLibelle] = useState("");
  const [ipBorne, setIpBorne] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [cree, setCree] = useState<IsoloirCree | null>(null);
  const [aDesactiver, setADesactiver] = useState<IsoloirAdmin | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  const libelleParDefaut = `Isoloir ${(isoloirs?.length ?? 0) + 1}`;

  const creer = async (e: FormEvent) => {
    e.preventDefault();
    setEnCours(true);
    setMessage(null);
    try {
      setCree(await creerIsoloir(libelle.trim() || libelleParDefaut, ipBorne.trim()));
      setLibelle("");
      setIpBorne("");
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
          <div className="flex-1">
            <Champ
              label="IP de la borne (ESP32)"
              id="isoloir-ip-borne"
              value={ipBorne}
              onChange={(e) => setIpBorne(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="192.168.50.21"
              inputMode="decimal"
              required
              pattern="^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$"
              title="Adresse IPv4, par exemple 192.168.50.21"
            />
          </div>
          <Bouton type="submit" disabled={enCours || !ipBorne.trim()}>
            <Plus size={16} /> {enCours ? "Création…" : "Créer l'isoloir"}
          </Bouton>
        </form>
        <p className="mt-3 text-xs text-gray-500">
          La borne est reconnue par son IP fixe sur le Wi-Fi. Le serveur génère
          la clé de l'écran : elle s'affiche une seule fois, juste après la création.
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
              <li
                key={i.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-brand-dark">
                    {i.libelle}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      n° {i.id}
                      {i.ipBorne && ` · borne ${i.ipBorne}`}
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
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      {aDesactiver && (
        <Confirmation
          titre="Désactiver l'isoloir ?"
          libelle="Désactiver"
          danger
          onConfirm={desactiver}
          onCancel={() => setADesactiver(null)}
        >
          <p>
            Les codes de <strong>{aDesactiver.libelle}</strong> seront refusés tout
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
      {!isoloir.ipBorne ? (
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
