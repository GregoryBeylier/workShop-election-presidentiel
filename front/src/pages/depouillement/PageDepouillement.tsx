import { useEffect, useState } from "react";
import { getPeriode, type Periode } from "../../api/election";
import Bandeau from "../../components/ui/Bandeau";
import ExempleDepouillement from "./ExempleDepouillement";
import ParcoursVote from "./ParcoursVote";
import ReglesDepouillement from "./ReglesDepouillement";

const ETIQUETTES = {
  PREPARATION: "SCRUTIN EN PRÉPARATION",
  OUVERT: "SCRUTIN OUVERT : SCORES MASQUÉS",
  CLOS: "SCRUTIN CLOS : RÉSULTATS PUBLIÉS",
};

/**
 * Page explicative : parcours de l'électeur et règles du dépouillement.
 * Le bandeau occupe tout l'écran sous la navbar (h-16), et au-dessus de la
 * barre du bas sur mobile (h-16 + zone du geste).
 */
function PageDepouillement() {
  const [periode, setPeriode] = useState<Periode | null>(null);

  useEffect(() => {
    getPeriode()
      .then(setPeriode)
      .catch(() => {});
  }, []);

  return (
    <>
      <Bandeau
        className="flex items-center min-h-[calc(100svh_-_8rem_-_env(safe-area-inset-bottom))] md:min-h-[calc(100svh_-_4rem)]"
        etiquette={periode ? ETIQUETTES[periode.etat] : "LE DÉPOUILLEMENT"}
        titre={
          <>
            Du duel au classement,
            <br />
            chaque voix compte.
          </>
        }
        aside={<ExempleDepouillement />}
      >
        <p className="text-gray-300 mb-6">
          Ici, pas de bulletin à un seul nom : chaque électeur départage les
          candidats deux par deux. À la clôture, tous les duels sont additionnés
          pour établir le classement. Voici comment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <a
            href="#parcours"
            className="bg-white text-brand-dark rounded-md px-5 py-3 font-medium hover:bg-gray-100 transition-colors duration-300 inline-flex items-center justify-center gap-2"
          >
            Le parcours de vote ↓
          </a>
          <a
            href="#regles"
            className="border border-white text-white rounded-md px-5 py-3 font-medium hover:bg-white/10 transition-colors duration-300 text-center"
          >
            Les règles du dépouillement
          </a>
        </div>
      </Bandeau>

      <ParcoursVote nbDuels={periode?.nbDuels ?? 0} />
      <ReglesDepouillement />
    </>
  );
}

export default PageDepouillement;
