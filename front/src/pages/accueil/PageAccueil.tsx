import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMonVote,
  getPeriode,
  type MonVote,
  type Periode,
} from "../../api/election";
import Bandeau from "../../components/ui/Bandeau";
import { dateCloture, formatJour } from "../../utils/format";
import CarteProgression from "./CarteProgression";
import CommentCaMarche from "./CommentCaMarche";
import UniversMDS from "./UniversMDS";

/**
 * Page d'accueil de l'espace électeur.
 * Affiche la progression du vote et explique le fonctionnement.
 */
function PageAccueil() {
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [monVote, setMonVote] = useState<MonVote | null>(null);

  useEffect(() => {
    getPeriode()
      .then(setPeriode)
      .catch(() => {});
    getMonVote()
      .then(setMonVote)
      .catch(() => {});
  }, []);

  const duelsFaits = monVote?.duels.filter((d) => d.fait).length ?? 0;
  const duelsTotal = monVote?.duels.length ?? periode?.nbDuels ?? 0;
  const cloture = periode && dateCloture(periode);
  const dateClotureTexte = cloture ? formatJour(cloture) : "à définir";
  const etat = periode?.etat ?? "OUVERT";

  const etiquette =
    etat === "OUVERT"
      ? `SCRUTIN OUVERT JUSQU'AU ${dateClotureTexte.toUpperCase()}`
      : etat === "PREPARATION"
        ? "SCRUTIN EN PRÉPARATION"
        : "SCRUTIN CLOS";

  return (
    <>
      <Bandeau
        etiquette={etiquette}
        titre={
          <>
            Votre voix,
            <br />
            duel après duel.
          </>
        }
        aside={
          <CarteProgression
            faits={duelsFaits}
            total={duelsTotal}
            dateCloture={dateClotureTexte}
          />
        }
      >
        <p className="text-gray-300 mb-6">
          Comparez les candidats deux par deux plutôt que d'en cocher un seul.{" "}
          {duelsTotal} duels suffisent pour exprimer votre préférence.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            to="/vote"
            className="bg-white text-brand-dark rounded-md px-5 py-3 font-medium hover:bg-gray-100 transition-colors duration-300 inline-flex items-center justify-center gap-2"
          >
            Continuer à voter →
          </Link>
          <Link
            to="/resultats"
            className="border border-white text-white rounded-md px-5 py-3 font-medium hover:bg-white/10 transition-colors duration-300 text-center"
          >
            Voir les résultats
          </Link>
        </div>
      </Bandeau>

      <CommentCaMarche nbDuels={duelsTotal} />
      <UniversMDS />
    </>
  );
}

export default PageAccueil;
