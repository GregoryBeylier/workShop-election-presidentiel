import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, QrCode, Vote, WifiOff } from "lucide-react";
import {
  checkin,
  clearUserId,
  fetchVoterStatus,
  getUserId,
  HttpError,
  NetworkError,
  setUserId,
  type VoterStatus,
} from "../api";
import Scanner from "../components/Scanner";

type Feedback = { tone: "success" | "error" | "network"; message: string };

const NETWORK_MESSAGE =
  "Connexion impossible. Vérifiez que vous êtes connecté au Wi-Fi de l'école, puis réessayez.";

/**
 * Écran du votant : propose le vote en ligne ou le check-in isoloir selon son statut.
 * Dès que le check-in réussit, le vote en ligne disparaît.
 */
function Votant() {
  const [userId, setUserIdState] = useState(getUserId);
  const [status, setStatus] = useState<VoterStatus | null>(null);
  const [scanning, setScanning] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const logout = useCallback(() => {
    clearUserId();
    setUserIdState(null);
    setStatus(null);
    setFeedback(null);
    setScanning(false);
  }, []);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof HttpError && e.status === 401) {
        logout();
      } else if (e instanceof NetworkError) {
        setFeedback({ tone: "network", message: NETWORK_MESSAGE });
      } else {
        setFeedback({ tone: "error", message: "Une erreur est survenue, réessayez." });
      }
    },
    [logout],
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
    if (userId) refreshStatus();
  }, [userId, refreshStatus]);

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

  if (!userId) {
    return (
      <Page>
        <DevLogin
          onLogin={(id) => {
            setUserId(id);
            setUserIdState(id);
          }}
        />
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-brand-dark">Mon vote</h1>
        <button type="button" onClick={logout} className="text-sm text-gray-500 underline">
          Changer de votant
        </button>
      </div>

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
            {/* Le vrai parcours de vote en ligne vit dans l'appli principale */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-teal-dark text-white font-semibold py-3"
            >
              <Vote size={20} /> Voter en ligne
            </button>
            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setScanning(true);
              }}
              className="flex items-center justify-center gap-2 rounded-lg border border-brand-dark text-brand-dark font-semibold py-3"
            >
              <QrCode size={20} /> Je vote à l'isoloir
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
          feedback={{ tone: "success", message: "Vous avez déjà voté dans l'application." }}
        />
      )}

      {status === "not_registered" && !feedback && (
        <FeedbackBanner
          feedback={{ tone: "error", message: "Vous n'êtes pas inscrit à l'élection en cours." }}
        />
      )}
    </Page>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-8">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-md flex flex-col gap-4 h-fit">
        {children}
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

// TODO JWT : sélecteur temporaire en attendant le vrai login de l'appli
function DevLogin({ onLogin }: { onLogin: (id: string) => void }) {
  const users = [
    { id: "1", label: "Alice — inscrite, n'a pas voté" },
    { id: "2", label: "Bob — a déjà voté dans l'appli" },
    { id: "3", label: "Chloé — inscrite, n'a pas voté" },
    { id: "4", label: "David — pas inscrit" },
  ];
  return (
    <>
      <h1 className="text-2xl font-heading font-bold text-brand-dark">Qui êtes-vous ?</h1>
      <p className="text-sm text-gray-500">
        Connexion de démo, en attendant l'authentification de l'appli.
      </p>
      {users.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => onLogin(u.id)}
          className="text-left rounded-lg border border-gray-300 px-4 py-3 hover:border-brand-teal-dark"
        >
          {u.label}
        </button>
      ))}
    </>
  );
}

export default Votant;
