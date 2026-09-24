import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/auth";
import { fetchVoterStatus, HttpError, type VoterStatus } from "../../api/checkin";

/**
 * Statut de vote de l'électeur connecté (en ligne / isoloir).
 * `error` passe à true si le serveur est injoignable ; token expiré => retour à la connexion.
 */
export function useVoterStatus() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VoterStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchVoterStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof HttpError && e.status === 401) {
          logout();
          navigate("/login", { replace: true });
        } else {
          setError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return { status, error };
}
