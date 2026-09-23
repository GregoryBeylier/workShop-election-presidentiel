import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import { ApiError } from "../../api/client";
import { getResultats, type Resultats } from "../../api/election";

type Candidate = {
  id: number;
  firstName: string;
  lastName: string;
  party: string;
  points: number;
};

// Pas de photo en base : on affiche les initiales
function Initiales({ candidate, className }: { candidate: Candidate; className: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center font-black text-[#3C3C3B] ${className}`}>
      {candidate.firstName[0]}
      {candidate.lastName[0]}
    </div>
  );
}

// Nombre de points au format français (0,5 pour une égalité)
const formatPoints = (points: number) =>
  points.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

function Result() {
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

  if (erreur || !resultats || resultats.classement.length === 0) {
    return (
      <p className={`mx-auto max-w-6xl px-4 py-10 text-center ${erreur ? "text-red-600" : "text-gray-500"}`}>
        {erreur ?? (resultats ? "Aucun candidat pour ce scrutin." : "Chargement des résultats…")}
      </p>
    );
  }

  // =================================================
  // ================= CALCULS =======================
  // =================================================

  // Déjà trié par points décroissants par le back
  const sortedCandidates: Candidate[] = resultats.classement.map((r) => ({
    id: r.candidat.id,
    firstName: r.candidat.prenom,
    lastName: r.candidat.nom,
    party: r.candidat.parti,
    points: r.points,
  }));

  // Candidat élu
  const winner = sortedCandidates[0];

  // Les autres candidats
  const otherCandidates = sortedCandidates.slice(1);

  // Total des points distribués (1 point par duel voté)
  const totalPoints = sortedCandidates.reduce(
    (total, candidate) => total + candidate.points,
    0
  );

  const totalVotants = resultats.periode.nbVotants;
  const totalInscrits = resultats.periode.nbInscrits;

  // Part des points du candidat élu
  const winnerPercentage =
    totalPoints > 0
      ? Math.round((winner.points / totalPoints) * 100)
      : 0;

  // Taux de participation
  const participation =
    totalInscrits > 0
      ? Math.round((totalVotants / totalInscrits) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ================================================= */}
        {/* ===================== HEADER ==================== */}
        {/* ================================================= */}

        <section className="mb-8 text-center sm:mb-10">


          <h1 className="text-3xl font-black text-[#3C3C3B] sm:text-5xl">
            Résultats du scrutin
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-500 sm:text-base">
            Découvrez les résultats de l'élection et la participation au
            scrutin.
          </p>

        </section>

        {/* ================================================= */}
        {/* ================= CARD GAGNANT ================== */}
        {/* ================================================= */}

        <section className="mb-6 overflow-hidden rounded-3xl bg-[#D4AF37] shadow-xl sm:mb-8">

          {/* ================= BANDEAU ================= */}

          <div className="border-b border-white/20 bg-[#B8860B] px-4 py-4 text-center sm:px-6">

            <div className="flex items-center justify-center gap-2">

              {/* Icône Trophy */}
              <Trophy className="h-5 w-5 text-[#3C3C3B]" />

              <p className="text-sm font-black uppercase tracking-[0.15em] text-[#3C3C3B] sm:tracking-[0.2em]">
                Candidat élu
              </p>

            </div>

          </div>

          {/* ================= CONTENU ================= */}

          <div className="flex flex-col items-center gap-6 p-5 sm:gap-8 sm:p-10 md:flex-row">

            {/* ================= PHOTO ================= */}

            <div className="relative shrink-0">

              <div className="h-32 w-32 overflow-hidden rounded-full border-8 border-white bg-gray-100 shadow-lg sm:h-48 sm:w-48">

                <Initiales candidate={winner} className="text-4xl sm:text-6xl" />

              </div>

              {/* ================= MÉDAILLE 1ER ================= */}

              <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#3C3C3B] text-xl shadow-lg sm:h-14 sm:w-14 sm:text-2xl">
                🥇
              </div>

            </div>

            {/* ================= INFORMATIONS ================= */}

            <div className="w-full flex-1 text-center md:text-left">

              <p className="text-sm font-bold uppercase tracking-widest text-white/80">
                Félicitations
              </p>

              {/* Nom */}
              <h2 className="mt-2 text-3xl font-black text-[#3C3C3B] sm:text-5xl">
                {winner.firstName} {winner.lastName}
              </h2>

              {/* Parti */}
              <p className="mt-2 text-base font-bold text-[#3C3C3B] sm:text-lg">
                {winner.party}
              </p>

              {/* Votes */}
              <p className="mt-4 text-base font-medium text-[#3C3C3B]/70">
                Nombre de points obtenus
              </p>

              <p className="mt-1 text-4xl font-black text-[#3C3C3B] sm:text-5xl">
                {formatPoints(winner.points)}
              </p>

              <p className="mt-1 font-semibold text-[#3C3C3B]/70">
                points
              </p>

              {/* ================= PROGRESSION ================= */}

              <div className="mt-6">

                <div className="mb-2 flex items-center justify-between">

                  <span className="text-sm font-bold text-[#3C3C3B]">
                    Score obtenu
                  </span>

                  <span className="text-lg font-black text-[#3C3C3B]">
                    {winnerPercentage}%
                  </span>

                </div>

                <div className="h-4 overflow-hidden rounded-full bg-white/50 sm:h-5">

                  <div
                    className="h-full rounded-full bg-[#3C3C3B] transition-all duration-700"
                    style={{
                      width: `${winnerPercentage}%`,
                    }}
                  />

                </div>

                <p className="mt-2 text-right text-xs font-semibold text-[#3C3C3B]/70 sm:text-sm">
                  {formatPoints(winner.points)} points sur {formatPoints(totalPoints)}
                </p>

              </div>

            </div>

          </div>
        </section>

        {/* ================================================= */}
        {/* ============= CARD AUTRES CANDIDATS ============= */}
        {/* ================================================= */}

        <section className="mb-6 rounded-3xl bg-white p-4 shadow-lg sm:mb-8 sm:p-8">

          {/* ================= TITRE ================= */}

          <div className="mb-5 sm:mb-6">

            <p className="text-sm font-bold uppercase tracking-widest text-[#2EC7D3]">
              Classement
            </p>

            <h2 className="mt-1 text-xl font-black text-[#3C3C3B] sm:text-2xl">
              Les autres candidats
            </h2>

          </div>

          {/* ================= LISTE ================= */}

          <div className="space-y-4">

            {otherCandidates.map((candidate, index) => {

              const percentage =
                totalPoints > 0
                  ? Math.round((candidate.points / totalPoints) * 100)
                  : 0;

              return (
                <article
                  key={candidate.id}
                  className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-3 sm:p-5"
                >

                  {/* ================= UNE SEULE LIGNE ================= */}

                  <div className="flex items-center gap-2 sm:gap-5">

                    {/* ================= POSITION ================= */}

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3C3C3B] text-xs font-black text-white sm:h-10 sm:w-10 sm:text-sm">
                      {index + 2}
                    </div>

                    {/* ================= PHOTO ================= */}

                    <div className="relative h-14 w-14 shrink-0 sm:h-20 sm:w-20">

                      <div className="h-14 w-14 overflow-hidden rounded-full border-4 border-[#2EC7D3] bg-gray-200 sm:h-20 sm:w-20">

                        <Initiales candidate={candidate} className="text-base sm:text-2xl" />

                      </div>

                      {/* ================= MÉDAILLE 2E ================= */}

                      {index === 0 && (
                        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#C0C0C0] text-sm shadow-md sm:-bottom-2 sm:-right-2 sm:h-9 sm:w-9 sm:text-lg">
                          🥈
                        </div>
                      )}

                      {/* ================= MÉDAILLE 3E ================= */}

                      {index === 1 && (
                        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#CD7F32] text-sm shadow-md sm:-bottom-2 sm:-right-2 sm:h-9 sm:w-9 sm:text-lg">
                          🥉
                        </div>
                      )}

                    </div>

                    {/* ================= INFORMATIONS ================= */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center justify-between gap-2">

                        <div className="min-w-0">

                          <h3 className="truncate text-sm font-bold text-[#3C3C3B] sm:text-xl">
                            {candidate.firstName} {candidate.lastName}
                          </h3>

                          <p className="truncate text-[11px] font-semibold text-gray-500 sm:text-sm">
                            {candidate.party}
                          </p>

                        </div>

                        <span className="shrink-0 text-[11px] font-black text-[#3C3C3B] sm:text-base">
                          {formatPoints(candidate.points)} pts
                        </span>

                      </div>

                      {/* ================= BARRE ================= */}

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 sm:h-3">

                        <div
                          className="h-full rounded-full bg-[#2EC7D3] transition-all duration-700"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                      <p className="mt-1 text-[11px] text-gray-500 sm:text-sm">
                        {percentage}% des points
                      </p>

                    </div>

                  </div>

                </article>
              );
            })}

          </div>

        </section>

        {/* ================================================= */}
        {/* ================ CARD PARTICIPATION ============== */}
        {/* ================================================= */}

        <section className="mb-8 rounded-3xl bg-white p-5 shadow-lg sm:mb-10 sm:p-8">

          {/* ================= TITRE ================= */}

          <div className="mb-6 sm:mb-8">

            <p className="text-sm font-bold uppercase tracking-widest text-[#2EC7D3]">
              Participation
            </p>

            <h2 className="mt-1 text-xl font-black text-[#3C3C3B] sm:text-2xl">
              Participation au scrutin
            </h2>

          </div>

          {/* ================= STATISTIQUES ================= */}

          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">

            {/* Votants */}

            <div className="rounded-2xl bg-[#3C3C3B] p-5 text-center">

              <p className="text-sm font-bold uppercase tracking-wide text-white/60">
                Votants
              </p>

              <p className="mt-2 text-3xl font-black text-[#2EC7D3] sm:text-4xl">
                {totalVotants}
              </p>

              <p className="mt-1 text-sm text-white/60">
                personnes ont voté
              </p>

            </div>

            {/* Inscrits */}

            <div className="rounded-2xl bg-[#3C3C3B] p-5 text-center">

              <p className="text-sm font-bold uppercase tracking-wide text-white/60">
                Inscrits
              </p>

              <p className="mt-2 text-3xl font-black text-white sm:text-4xl">
                {totalInscrits}
              </p>

              <p className="mt-1 text-sm text-white/60">
                personnes inscrites
              </p>

            </div>

            {/* Participation */}

            <div className="rounded-2xl bg-[#2EC7D3] p-5 text-center">

              <p className="text-sm font-bold uppercase tracking-wide text-[#3C3C3B]/60">
                Participation
              </p>

              <p className="mt-2 text-3xl font-black text-[#3C3C3B] sm:text-4xl">
                {participation}%
              </p>

              <p className="mt-1 text-sm text-[#3C3C3B]/60">
                des inscrits ont voté
              </p>

            </div>

          </div>

          {/* ================= BARRE PARTICIPATION ================= */}

          <div className="mt-7 sm:mt-8">

            <div className="mb-2 flex items-center justify-between">

              <span className="text-sm font-bold text-[#3C3C3B]">
                Taux de participation
              </span>

              <span className="text-sm font-black text-[#3C3C3B]">
                {totalVotants} / {totalInscrits}
              </span>

            </div>

            <div className="h-4 overflow-hidden rounded-full bg-gray-200 sm:h-5">

              <div
                className="h-full rounded-full bg-[#2EC7D3] transition-all duration-700"
                style={{
                  width: `${Math.min(participation, 100)}%`,
                }}
              />

            </div>

            <p className="mt-2 text-right text-sm font-semibold text-gray-500">
              {participation}% de participation
            </p>

          </div>

        </section>

        {/* ================================================= */}
        {/* ================= FOOTER GLOBAL ================= */}
        {/* ================================================= */}

    

      </div>
    </main>
  );
}

export default Result;

