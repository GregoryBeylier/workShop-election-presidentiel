import { useCallback, useEffect, useState } from "react";

/**
 * Charge une donnée de l'API puis la recharge toutes les `intervalleMs`
 * (null = une seule fois). `charger` doit être stable (fonction de module
 * ou useCallback). Renvoie aussi `recharger` pour forcer un rafraîchissement
 * après une action.
 */
export function usePolling<T>(
  charger: () => Promise<T>,
  intervalleMs: number | null = null,
) {
  const [data, setData] = useState<T | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [misAJour, setMisAJour] = useState<Date | null>(null);

  const recharger = useCallback(
    () =>
      charger()
        .then((resultat) => {
          setData(resultat);
          setErreur(null);
          setMisAJour(new Date());
        })
        .catch((e: Error) => setErreur(e.message)),
    [charger],
  );

  useEffect(() => {
    recharger();
    if (intervalleMs === null) return;
    const timer = setInterval(recharger, intervalleMs);
    return () => clearInterval(timer);
  }, [recharger, intervalleMs]);

  return { data, erreur, misAJour, recharger };
}
