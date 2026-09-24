import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2, Clock3, Info, Lock } from "lucide-react";
import { getPeriode, type Periode } from "../../api/election";
import { dateCloture } from "../../utils/format";
import CompteARebours from "./CompteARebours";
import ParticipationEnCours from "./ParticipationEnCours";

/**
 * Page d'attente pendant le vote : résultats verrouillés, compte à rebours
 * jusqu'à la clôture et participation en direct. Renvoie vers les résultats
 * dès que le scrutin est clos.
 */
function PageAttente() {
  const [periode, setPeriode] = useState<Periode | null>(null);

  useEffect(() => {
    getPeriode()
      .then(setPeriode)
      .catch(() => {});
  }, []);

  // Scrutin clos : les résultats sont publiés
  if (periode?.etat === "CLOS") {
    return <Navigate to="/resultats" replace />;
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <section className="mb-8 text-center sm:mb-10">
          <h1 className="text-3xl font-black text-[#3C3C3B] sm:text-5xl">
            Scrutin en cours
          </h1>
          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            Les urnes sont encore ouvertes.
          </p>
        </section>

        {/* Carte principale : résultats verrouillés + compte à rebours */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="bg-[#3C3C3B] px-5 py-4 sm:px-8">
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-[#2EC7D3]" />
              <p className="text-sm font-black uppercase tracking-[0.15em] text-white">
                Résultats verrouillés
              </p>
            </div>
          </div>

          <div className="px-5 py-8 text-center sm:px-10 sm:py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#2EC7D3]/10">
              <Clock3 className="h-8 w-8 text-[#2EC7D3]" />
            </div>
            <h2 className="mt-5 text-3xl font-black text-[#3C3C3B] sm:text-4xl">
              Patience, ça compte !
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Les résultats restent sous clé jusqu'à la fermeture des urnes. En
              attendant, on compte sur votre patience — et sur vos voix.
            </p>
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-[#F5F5F5] px-5 py-4">
              <p className="text-sm italic font-semibold text-[#3C3C3B] sm:text-base">
                « Patience et longueur de temps font plus que force ni que
                sondage. »
              </p>
            </div>

            <CompteARebours cloture={periode ? dateCloture(periode) : null} />
          </div>
        </section>

        {/* Vote enregistré */}
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-lg sm:mt-8 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2EC7D3]/15">
              <CheckCircle2 className="h-6 w-6 text-[#2EC7D3]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#3C3C3B]">
                Votre vote est enregistré
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {periode
                  ? `Vos ${periode.nbDuels} duels ont bien été comptabilisés.`
                  : "Vos duels ont bien été comptabilisés."}
              </p>
            </div>
          </div>
        </section>

        <ParticipationEnCours
          votants={periode?.nbVotants ?? 0}
          inscrits={periode?.nbInscrits ?? 0}
        />

        <div className="mt-8 flex items-start justify-center gap-3 px-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#2EC7D3]" />
          <p className="text-left text-sm leading-6 text-gray-500 sm:text-base">
            Aucun score n’est visible avant la clôture : cela évite d’influencer
            les derniers votants.
          </p>
        </div>
      </div>
    </main>
  );
}

export default PageAttente;
