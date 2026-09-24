import { Navigate } from "react-router-dom";
import Vote from "../Vote/Vote";
import { useVoterStatus } from "./useVoterStatus";

/**
 * Page des duels, sauf pour un électeur déjà identifié dans un isoloir
 * (renvoyé au choix du mode de vote). Simple confort d'affichage :
 * c'est le back qui doit refuser le vote en ligne après un check-in.
 */
function OnlineVoteGuard() {
  const { status, error } = useVoterStatus();

  if (status === "checked_in_isoloir") {
    return <Navigate to="/vote" replace />;
  }
  if (status === null && !error) {
    return <p className="text-gray-500 text-center py-16">Chargement…</p>;
  }
  return <Vote />;
}

export default OnlineVoteGuard;
