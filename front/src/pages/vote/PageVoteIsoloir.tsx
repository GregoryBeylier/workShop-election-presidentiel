import { useState } from "react";
import { Link } from "react-router-dom";
import { QrCode } from "lucide-react";
import { ApiError } from "../../api/client";
import { checkin } from "../../api/checkin";
import { useStatutVotant } from "../../hooks/useStatutVotant";
import Alerte, { type Message } from "../../components/ui/Alerte";
import Bouton from "../../components/ui/Bouton";
import MessagePage from "../../components/ui/MessagePage";
import AvertissementChoix from "./AvertissementChoix";
import ScannerQr from "./ScannerQr";

const MESSAGE_RESEAU =
  "Connexion impossible. Vérifiez que vous êtes connecté au Wi-Fi de l'école, puis réessayez.";

/**
 * Check-in isoloir : l'électeur scanne le QR affiché dans l'isoloir, ce qui révoque
 * définitivement son vote en ligne. On y arrive depuis le choix du mode de vote (/vote).
 */
function PageVoteIsoloir() {
  const { statut, erreur, setStatut } = useStatutVotant();
  const [scanEnCours, setScanEnCours] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const handleScan = async (qrToken: string) => {
    setScanEnCours(false);
    setEnvoi(true);
    setMessage(null);
    try {
      const res = await checkin(qrToken);
      if (res.status === "success") {
        setStatut("checked_in_isoloir");
        setMessage({ type: "succes", texte: res.message });
      } else {
        setMessage({ type: "erreur", texte: res.message });
        if (res.status === "already_voted") setStatut("voted_app");
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

  return (
    <div className="flex justify-center px-4 py-8 sm:py-12">
      <div className="flex h-fit w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">Voter à l'isoloir</h1>

        {statut === "not_voted" && (
          <AvertissementChoix>
            En scannant le QR de l'isoloir, vous renoncez <b>définitivement</b> au vote en ligne,
            même si vous ne déposez pas de bulletin.
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
                Scannez le QR code affiché sur l'écran de l'isoloir, puis votez sur le bulletin papier.
              </p>
              <Bouton onClick={lancerScan} className="py-3 text-base">
                <QrCode size={20} /> {message ? "Relancer le scan" : "Scanner le QR de l'isoloir"}
              </Bouton>
            </>
          ))}

        {statut === "checked_in_isoloir" && message?.type !== "succes" && (
          <Alerte
            message={{ type: "succes", texte: "Vous êtes identifié dans un isoloir : votez sur le bulletin papier." }}
          />
        )}
        {statut === "voted_app" && !message && (
          <Alerte message={{ type: "succes", texte: "Vous avez déjà choisi de voter en ligne." }} />
        )}
        {statut === "not_registered" && !message && (
          <Alerte message={{ type: "erreur", texte: "Vous n'êtes pas inscrit à l'élection en cours." }} />
        )}

        <Link to="/vote" className="self-center text-sm text-gray-500 underline">
          ← Revenir au choix du mode de vote
        </Link>
      </div>
    </div>
  );
}

export default PageVoteIsoloir;
