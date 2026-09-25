import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QrCode } from "lucide-react";
import { ApiError } from "../../api/client";
import { checkin, getStatutVotant } from "../../api/checkin";
import { useStatutVotant } from "../../hooks/useStatutVotant";
import Alerte, { type Message } from "../../components/ui/Alerte";
import Bouton from "../../components/ui/Bouton";
import MessagePage from "../../components/ui/MessagePage";
import AvertissementChoix from "./AvertissementChoix";
import ScannerQr from "./ScannerQr";
import VoteTermine from "./VoteTermine";

const MESSAGE_RESEAU =
  "Connexion impossible. Vérifiez que vous êtes connecté au Wi-Fi de l'école, puis réessayez.";

// Pendant le vote sur la borne, on demande au serveur où en est le votant
const INTERVALLE_SUIVI_MS = 2000;

/**
 * Check-in isoloir : l'électeur scanne le QR affiché dans l'isoloir, ce qui ouvre son vote
 * sur la borne et révoque définitivement son vote en ligne. La page suit ensuite le vote
 * jusqu'à ce que la borne ait enregistré le bulletin. On y arrive depuis /vote.
 */
function PageVoteIsoloir() {
  const { statut, erreur, setStatut } = useStatutVotant();
  const [scanEnCours, setScanEnCours] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  // Vote en cours sur la borne : on attend que le serveur annonce le bulletin enregistré.
  // Une erreur réseau passagère est ignorée, l'appel suivant réessaie.
  useEffect(() => {
    if (statut !== "checked_in_isoloir") return;
    const id = setInterval(() => {
      getStatutVotant()
        .then((s) => {
          if (s !== "checked_in_isoloir") setStatut(s);
        })
        .catch(() => {});
    }, INTERVALLE_SUIVI_MS);
    return () => clearInterval(id);
  }, [statut, setStatut]);

  const handleScan = async (qrToken: string) => {
    setScanEnCours(false);
    setEnvoi(true);
    setMessage(null);
    try {
      const res = await checkin(qrToken);
      if (res.status === "success") {
        setStatut("checked_in_isoloir");
      } else {
        setMessage({ type: "erreur", texte: res.message });
        // Déjà voté (en ligne ou sur une borne) : le serveur dit lequel
        if (res.status === "already_voted") setStatut(await getStatutVotant());
        if (res.status === "not_registered") setStatut("not_registered");
      }
    } catch (e) {
      // Aucun état n'a changé côté serveur : on peut simplement relancer le scan
      setMessage({
        type: "erreur",
        texte: e instanceof ApiError && e.status === 0 ? MESSAGE_RESEAU : "Une erreur est survenue, réessayez.",
      });
    } finally {
      setEnvoi(false);
    }
  };

  const lancerScan = () => {
    setMessage(null);
    setScanEnCours(true);
  };

  if (statut === "voted_booth") {
    return <VoteTermine />;
  }

  return (
    <div className="flex justify-center px-4 py-8 sm:py-12">
      <div className="flex h-fit w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">Voter à l'isoloir</h1>

        {statut === "not_voted" && (
          <AvertissementChoix>
            En scannant le QR de l'isoloir, vous renoncez <b>définitivement</b> au vote en ligne.
          </AvertissementChoix>
        )}

        {message && <Alerte message={message} />}

        {statut === null && !erreur && <MessagePage texte="Chargement…" />}
        {erreur && <Alerte message={{ type: "erreur", texte: MESSAGE_RESEAU }} />}

        {statut === "not_voted" &&
          (scanEnCours ? (
            <ScannerQr onScan={handleScan} onCancel={() => setScanEnCours(false)} />
          ) : envoi ? (
            <p className="text-center text-gray-500">Vérification…</p>
          ) : (
            <>
              <p className="text-gray-600">
                Scannez le QR code affiché sur l'écran de l'isoloir, puis votez sur la borne.
              </p>
              <Bouton onClick={lancerScan} className="py-3 text-base">
                <QrCode size={20} /> {message ? "Relancer le scan" : "Scanner le QR de l'isoloir"}
              </Bouton>
            </>
          ))}

        {statut === "checked_in_isoloir" && <InstructionsBorne />}

        {statut === "voted_app" && !message && (
          <Alerte message={{ type: "succes", texte: "Vous avez déjà choisi de voter en ligne." }} />
        )}
        {statut === "not_registered" && !message && (
          <Alerte message={{ type: "erreur", texte: "Vous n'êtes pas inscrit à l'élection en cours." }} />
        )}

        {statut !== "checked_in_isoloir" && (
          <Link to="/vote" className="self-center text-sm text-gray-500 underline">
            ← Revenir au choix du mode de vote
          </Link>
        )}
      </div>
    </div>
  );
}

/** Affiché pendant que le votant vote sur la borne (le mode d'emploi est sur la borne elle-même). */
function InstructionsBorne() {
  return (
    <>
      <Alerte message={{ type: "succes", texte: "Identification réussie : votez maintenant sur la borne." }} />
      <p className="flex items-center justify-center gap-2 text-sm text-gray-500" role="status">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-teal" />
        En attente de la fin de votre vote…
      </p>
    </>
  );
}

export default PageVoteIsoloir;
