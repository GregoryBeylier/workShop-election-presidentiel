import { useState } from "react";
import {
  getUtilisateurs,
  reinitialiserMotDePasse,
  supprimerUtilisateur,
  type UtilisateurAdmin,
} from "../../../api/admin";
import { usePolling } from "../../../hooks/usePolling";
import type { EtatScrutin } from "../../../api/election";
import Panneau from "../../../components/ui/Panneau";
import FormulaireInscription from "./FormulaireInscription";
import TableauUtilisateurs from "./TableauUtilisateurs";
import Identifiants, { type IdentifiantsProvisoires } from "./Identifiants";
import ChampMotDePasse from "../../../components/ui/ChampMotDePasse";
import Confirmation from "../../../components/ui/Confirmation";
import Alerte, { type Message } from "../../../components/ui/Alerte";

/**
 * Onglet "Inscriptions" : inscription électeur / candidat, liste,
 * réinitialisation du mot de passe et suppression RGPD.
 */
function OngletInscriptions({
  etat,
  onChange,
}: {
  etat: EtatScrutin | null;
  onChange: () => void;
}) {
  const { data: utilisateurs, erreur, recharger } = usePolling(getUtilisateurs);
  const [identifiants, setIdentifiants] =
    useState<IdentifiantsProvisoires | null>(null);
  const [aReinitialiser, setAReinitialiser] = useState<UtilisateurAdmin | null>(
    null,
  );
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [aSupprimer, setASupprimer] = useState<UtilisateurAdmin | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  const apresModification = () => {
    recharger();
    onChange();
  };

  const ouvrirReinitialisation = (u: UtilisateurAdmin) => {
    setNouveauMdp("");
    setAReinitialiser(u);
  };

  const reinitialiser = async () => {
    if (!aReinitialiser) return;
    try {
      await reinitialiserMotDePasse(aReinitialiser.id, nouveauMdp);
      setIdentifiants({ email: aReinitialiser.email, motDePasse: nouveauMdp });
      setMessage({
        type: "succes",
        texte: `Mot de passe de ${aReinitialiser.email} réinitialisé.`,
      });
      recharger();
    } catch (e) {
      setIdentifiants(null);
      setMessage({ type: "erreur", texte: (e as Error).message });
    } finally {
      setAReinitialiser(null);
    }
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      const { mode } = await supprimerUtilisateur(aSupprimer.id);
      setMessage({
        type: "succes",
        texte:
          mode === "SUPPRIME"
            ? `Le compte ${aSupprimer.email} et ses données ont été supprimés.`
            : `Le compte ${aSupprimer.email} a été anonymisé : ses votes restent comptés sans lien avec la personne.`,
      });
      apresModification();
    } catch (e) {
      setMessage({ type: "erreur", texte: (e as Error).message });
    } finally {
      setASupprimer(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Panneau surTitre="Inscription" titre="Inscrire une personne">
        <FormulaireInscription
          etat={etat}
          onInscrit={(nouveaux, texte) => {
            setIdentifiants(nouveaux);
            setMessage({ type: "succes", texte });
            apresModification();
          }}
        />
      </Panneau>

      {message && <Alerte message={message} onClose={() => setMessage(null)} />}
      {identifiants && <Identifiants identifiants={identifiants} />}

      <Panneau
        surTitre="Comptes"
        titre={`Utilisateurs${utilisateurs ? ` (${utilisateurs.length})` : ""}`}
      >
        {erreur && <Alerte message={{ type: "erreur", texte: erreur }} />}
        {utilisateurs ? (
          <TableauUtilisateurs
            utilisateurs={utilisateurs}
            onReinitialiser={ouvrirReinitialisation}
            onSupprimer={setASupprimer}
          />
        ) : (
          !erreur && <p className="text-sm text-gray-500">Chargement…</p>
        )}
      </Panneau>

      {aReinitialiser && (
        <Confirmation
          titre="Réinitialiser le mot de passe ?"
          libelle="Réinitialiser"
          desactive={nouveauMdp.length === 0}
          onConfirm={reinitialiser}
          onCancel={() => setAReinitialiser(null)}
        >
          <p className="mb-4">
            Nouveau mot de passe provisoire pour{" "}
            <strong>{aReinitialiser.email}</strong>. L'ancien ne fonctionnera
            plus et la personne devra en choisir un nouveau à sa prochaine
            connexion.
          </p>
          <ChampMotDePasse
            id="reinit-mdp"
            value={nouveauMdp}
            onChange={setNouveauMdp}
          />
        </Confirmation>
      )}

      {aSupprimer && (
        <Confirmation
          titre="Supprimer les données ?"
          libelle="Supprimer définitivement"
          danger
          onConfirm={supprimer}
          onCancel={() => setASupprimer(null)}
        >
          <p>
            Droit à l'effacement (RGPD) pour <strong>{aSupprimer.email}</strong>
            .
          </p>
          <p className="mt-2">
            Si cette personne n'a jamais voté ni été candidate à un scrutin
            ouvert, son compte est supprimé. Sinon, son email est effacé
            (anonymisation) : ses votes restent comptés pour ne pas fausser les
            résultats. Cette action est irréversible.
          </p>
        </Confirmation>
      )}
    </div>
  );
}

export default OngletInscriptions;
