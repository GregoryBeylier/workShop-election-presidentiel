import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { getResultats, type Resultats } from "../../api/election";
import MessagePage from "../../components/ui/MessagePage";
import CarteElu from "./CarteElu";
import ClassementAutres from "./ClassementAutres";
import CarteParticipation from "./CarteParticipation";

/**
 * Résultats du scrutin, visibles une fois le vote clos
 * (tant qu'il est ouvert, le back répond 409 et on renvoie vers /waiting).
 */
function PageResultats() {
  const [resultats, setResultats] = useState<Resultats | null>(null);
  const [scrutinOuvert, setScrutinOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    getResultats()
      .then(setResultats)
      .catch((e: Error) => {
        // 409 : scrutin encore ouvert, les résultats sont sous clé
        if (e instanceof ApiError && e.status === 409) setScrutinOuvert(true);
        else setErreur(e.message);
      });
  }, []);

  if (scrutinOuvert) {
    return <Navigate to="/waiting" replace />;
  }
  if (erreur) {
    return <MessagePage texte={erreur} erreur />;
  }
  if (!resultats) {
    return <MessagePage texte="Chargement des résultats…" />;
  }
  if (resultats.classement.length === 0) {
    return <MessagePage texte="Aucun candidat pour ce scrutin." />;
  }

  // Déjà trié par le back : points décroissants, égalités départagées par les duels directs
  const [elu, ...autres] = resultats.classement;
  // Total des points distribués (1 point par duel voté)
  const totalPoints = resultats.classement.reduce((t, r) => t + r.points, 0);

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 text-center sm:mb-10">
          <h1 className="text-3xl font-black text-[#3C3C3B] sm:text-5xl">
            Résultats du scrutin
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-500 sm:text-base">
            Découvrez les résultats de l'élection et la participation au
            scrutin.
          </p>
        </section>

        <CarteElu elu={elu} totalPoints={totalPoints} />
        {autres.length > 0 && (
          <ClassementAutres autres={autres} totalPoints={totalPoints} />
        )}
        <CarteParticipation
          votants={resultats.periode.nbVotants}
          inscrits={resultats.periode.nbInscrits}
        />
      </div>
    </main>
  );
}

export default PageResultats;
