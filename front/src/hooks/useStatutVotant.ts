import { useEffect, useState } from "react";
import { getStatutVotant, type StatutVotant } from "../api/checkin";

/**
 * Statut de vote de l'électeur connecté (pas voté / en ligne / isoloir / pas inscrit).
 * `erreur` passe à true si le serveur est injoignable (un token refusé renvoie déjà sur /login).
 * `setStatut` permet de refléter tout de suite une action qui vient de réussir.
 */
export function useStatutVotant() {
  const [statut, setStatut] = useState<StatutVotant | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let annule = false;
    getStatutVotant()
      .then((s) => {
        if (!annule) setStatut(s);
      })
      .catch(() => {
        if (!annule) setErreur(true);
      });
    return () => {
      annule = true;
    };
  }, []);

  return { statut, erreur, setStatut };
}
