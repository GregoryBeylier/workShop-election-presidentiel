import { useState, type ReactNode } from "react";
import Bouton from "./Bouton";

/**
 * Fenêtre de confirmation pour les actions importantes (démarrer / clôturer
 * le vote, supprimer un utilisateur). Le bouton reste bloqué pendant l'appel.
 */
function Confirmation({
  titre,
  children,
  libelle,
  danger = false,
  desactive = false,
  onConfirm,
  onCancel,
}: {
  titre: string;
  children: ReactNode;
  libelle: string;
  danger?: boolean;
  desactive?: boolean; // ex : champ obligatoire pas encore rempli
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [enCours, setEnCours] = useState(false);

  const confirmer = async () => {
    setEnCours(true);
    try {
      await onConfirm();
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-titre"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2
          id="confirm-titre"
          className="font-heading text-xl font-bold text-brand-dark"
        >
          {titre}
        </h2>
        <div className="mt-3 text-sm leading-6 text-gray-600">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Bouton variante="secondaire" onClick={onCancel} disabled={enCours}>
            Annuler
          </Bouton>
          <Bouton
            variante={danger ? "danger" : "primaire"}
            onClick={confirmer}
            disabled={enCours || desactive}
          >
            {enCours ? "Patientez…" : libelle}
          </Bouton>
        </div>
      </div>
    </div>
  );
}

export default Confirmation;
