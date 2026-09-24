import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, CircleAlert, QrCode, WifiOff } from "lucide-react";
import { logout } from "../../api/auth";
import {
  checkin,
  fetchVoterStatus,
  HttpError,
  NetworkError,
  type VoterStatus,
} from "../../api/checkin";
import Scanner from "./Scanner";

type Feedback = { tone: "success" | "error" | "network"; message: string };

const NETWORK_MESSAGE =
  "Connexion impossible. Vérifiez que vous êtes connecté au Wi-Fi de l'école, puis réessayez.";

/**
 * Check-in isoloir de l'électeur connecté : il scanne le QR affiché dans l'isoloir,
 * ce qui révoque définitivement son vote en ligne. On y arrive depuis le choix du mode de vote (/vote).
 */
function Checkin() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VoterStatus | null>(null);
  const [scanning, setScanning] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof HttpError && e.status === 401) {
        // Token expiré ou invalide : retour à la connexion
        logout();
        navigate("/login", { replace: true });
      } else if (e instanceof NetworkError) {
        setFeedback({ tone: "network", message: NETWORK_MESSAGE });
      } else {
        setFeedback({ tone: "error", message: "Une erreur est survenue, réessayez." });
      }
    },
    [navigate],
  );

  const refreshStatus = useCallback(() => {
    fetchVoterStatus()
      .then((s) => {
        setStatus(s);
        setFeedback((f) => (f?.tone === "network" ? null : f));
      })
      .catch(handleError);
  }, [handleError]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleScan = async (qrToken: string) => {
    setScanning(false);
    setSending(true);
    setFeedback(null);
    try {
      const res = await checkin(qrToken);
      if (res.status === "success") {
        setStatus("checked_in_isoloir");
        setFeedback({ tone: "success", message: res.message });
      } else {
        setFeedback({ tone: "error", message: res.message });
        if (res.status === "already_voted" || res.status === "not_registered") refreshStatus();
      }
    } catch (e) {
      handleError(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-8 sm:py-12">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-md flex flex-col gap-4 h-fit">
        <h1 className="text-2xl font-heading font-bold text-brand-dark">Voter à l'isoloir</h1>

        {feedback && <FeedbackBanner feedback={feedback} />}

        {feedback?.tone === "network" && !scanning && (
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              if (status === null) refreshStatus();
              else if (status === "not_voted") setScanning(true);
            }}
            className="rounded-lg border border-brand-dark text-brand-dark font-semibold py-3"
          >
            Réessayer
          </button>
        )}

        {status === null && feedback?.tone !== "network" && (
          <p className="text-gray-500">Chargement…</p>
        )}

        {status === "not_voted" &&
          (scanning ? (
            <Scanner onScan={handleScan} onCancel={() => setScanning(false)} />
          ) : sending ? (
            <p className="text-gray-500 text-center">Vérification…</p>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setScanning(true);
                }}
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-teal-dark text-white font-semibold py-3"
              >
                <QrCode size={20} /> Scanner le QR de l'isoloir
              </button>
              <p className="text-xs text-gray-500">
                En scannant le QR de l'isoloir, vous renoncez définitivement au vote en ligne,
                même si vous ne déposez pas de bulletin.
              </p>
            </div>
          ))}

        {status === "checked_in_isoloir" && feedback?.tone !== "success" && (
          <FeedbackBanner
            feedback={{
              tone: "success",
              message: "Vous êtes identifié dans un isoloir : votez sur le bulletin papier.",
            }}
          />
        )}

        {status === "voted_app" && !feedback && (
          <FeedbackBanner
            feedback={{ tone: "success", message: "Vous avez déjà voté en ligne." }}
          />
        )}

        {status === "not_registered" && !feedback && (
          <FeedbackBanner
            feedback={{ tone: "error", message: "Vous n'êtes pas inscrit à l'élection en cours." }}
          />
        )}

        <Link to="/vote" className="text-sm text-gray-500 underline self-center">
          ← Revenir au choix du mode de vote
        </Link>
      </div>
    </div>
  );
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  const styles = {
    success: "bg-brand-green/10 text-brand-dark border-brand-green",
    error: "bg-brand-pink/10 text-brand-dark border-brand-pink",
    network: "bg-gray-100 text-brand-dark border-gray-400",
  }[feedback.tone];
  const Icon = { success: CheckCircle2, error: CircleAlert, network: WifiOff }[feedback.tone];

  return (
    <div className={`flex gap-3 items-start rounded-lg border p-4 ${styles}`} role="status">
      <Icon size={22} className="shrink-0" />
      <p>{feedback.message}</p>
    </div>
  );
}

export default Checkin;
