import { Navigate } from "react-router-dom";
import { useStatutVotant } from "../../hooks/useStatutVotant";
import MessagePage from "../../components/ui/MessagePage";
import PageVote from "./PageVote";
import ConfirmationVoteEnLigne from "./ConfirmationVoteEnLigne";

/**
 * /vote/en-ligne : confirmation tant que l'électeur n'a pas commencé, puis les duels.
 * Un électeur identifié à l'isoloir (ou non inscrit) est renvoyé au choix du mode de vote ;
 * le back refuse de toute façon de démarrer le vote en ligne dans ce cas.
 */
function PageVoteEnLigne() {
  const { statut, erreur, setStatut } = useStatutVotant();

  if (statut === "checked_in_isoloir" || statut === "voted_booth" || statut === "not_registered") {
    return <Navigate to="/vote" replace />;
  }
  if (statut === "voted_app") {
    return <PageVote />;
  }
  if (statut === "not_voted") {
    return <ConfirmationVoteEnLigne onCommence={() => setStatut("voted_app")} />;
  }
  return erreur ? (
    <MessagePage texte="Connexion impossible. Vérifiez votre Wi-Fi puis rechargez la page." erreur />
  ) : (
    <MessagePage texte="Chargement…" />
  );
}

export default PageVoteEnLigne;
