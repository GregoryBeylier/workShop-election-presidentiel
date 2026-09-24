import { Navigate } from "react-router-dom";
import Vote from "../Vote/Vote";
import OnlineVoteStart from "./OnlineVoteStart";
import { useVoterStatus } from "./useVoterStatus";

/**
 * /vote/en-ligne : page de confirmation tant que l'électeur n'a pas commencé,
 * puis les duels. Un électeur identifié à l'isoloir (ou non inscrit) est renvoyé
 * au choix du mode de vote ; le back refuse de toute façon de démarrer le vote en ligne.
 */
function OnlineVoteGuard() {
  const { status, error, setStatus } = useVoterStatus();

  if (status === "checked_in_isoloir" || status === "not_registered") {
    return <Navigate to="/vote" replace />;
  }
  if (status === "voted_app") {
    return <Vote />;
  }
  if (status === "not_voted") {
    return <OnlineVoteStart onStarted={() => setStatus("voted_app")} />;
  }
  return (
    <p className="text-gray-500 text-center py-16">
      {error ? "Connexion impossible. Vérifiez votre Wi-Fi puis rechargez la page." : "Chargement…"}
    </p>
  );
}

export default OnlineVoteGuard;
