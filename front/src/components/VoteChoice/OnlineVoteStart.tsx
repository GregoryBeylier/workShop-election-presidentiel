import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleAlert, Smartphone, TriangleAlert } from "lucide-react";
import { logout } from "../../api/auth";
import { HttpError, NetworkError, startOnlineVote } from "../../api/checkin";

/**
 * Confirmation avant les duels : commencer le vote en ligne ferme définitivement
 * le vote à l'isoloir (le bulletin en ligne est créé côté back).
 */
function OnlineVoteStart({ onStarted }: { onStarted: () => void }) {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await startOnlineVote();
      if (res.status === "success") {
        onStarted();
      } else {
        setError(res.message);
      }
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setError(
        e instanceof NetworkError
          ? "Connexion impossible. Vérifiez que vous êtes connecté au Wi-Fi de l'école, puis réessayez."
          : "Une erreur est survenue, réessayez.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-8 sm:py-12">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-md flex flex-col gap-4 h-fit">
        <h1 className="text-2xl font-heading font-bold text-brand-dark">Voter en ligne</h1>

        <div className="flex gap-3 items-start rounded-lg border border-brand-pink bg-brand-pink/10 p-4 text-brand-dark" role="note">
          <TriangleAlert size={22} className="shrink-0 text-brand-pink" />
          <p>
            En commençant, vous renoncez <b>définitivement</b> au vote à l'isoloir, même si vous
            n'allez pas au bout de vos duels.
          </p>
        </div>

        <p className="text-gray-600">
          Vous allez comparer les candidats deux par deux. Pour chaque duel, choisissez celui que
          vous préférez, ou passez si vous n'avez pas de préférence.
        </p>

        {error && (
          <div className="flex gap-3 items-start rounded-lg border border-brand-pink bg-brand-pink/10 p-4 text-brand-dark" role="status">
            <CircleAlert size={22} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={sending}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-teal-dark text-white font-semibold py-3 disabled:opacity-60"
        >
          <Smartphone size={20} /> {sending ? "Un instant…" : "Commencer"}
        </button>

        <Link to="/vote" className="text-sm text-gray-500 underline self-center">
          ← Revenir au choix du mode de vote
        </Link>
      </div>
    </div>
  );
}

export default OnlineVoteStart;
