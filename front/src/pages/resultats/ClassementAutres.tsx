import type { ResultatCandidat } from "../../api/election";
import Avatar from "../../components/ui/Avatar";
import BarreProgression from "../../components/ui/BarreProgression";
import { formatPoints, initiales, pourcentage } from "../../utils/format";

// Médailles des 2e et 3e places
const medailles = [
  { emoji: "🥈", fond: "bg-[#C0C0C0]" },
  { emoji: "🥉", fond: "bg-[#CD7F32]" },
];

/** Classement des candidats après l'élu, avec leur part des points. */
function ClassementAutres({
  autres,
  totalPoints,
}: {
  autres: ResultatCandidat[];
  totalPoints: number;
}) {
  return (
    <section className="mb-6 rounded-3xl bg-white p-4 shadow-lg sm:mb-8 sm:p-8">
      <div className="mb-5 sm:mb-6">
        <p className="text-sm font-bold uppercase tracking-widest text-[#2EC7D3]">
          Classement
        </p>
        <h2 className="mt-1 text-xl font-black text-[#3C3C3B] sm:text-2xl">
          Les autres candidats
        </h2>
      </div>

      <div className="space-y-4">
        {autres.map(({ candidat, points }, index) => {
          const part = pourcentage(points, totalPoints);
          const medaille = medailles[index];
          return (
            <article
              key={candidat.id}
              className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-3 sm:p-5"
            >
              <div className="flex items-center gap-2 sm:gap-5">
                {/* Position (l'élu est 1er) */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3C3C3B] text-xs font-black text-white sm:h-10 sm:w-10 sm:text-sm">
                  {index + 2}
                </div>

                <div className="relative h-14 w-14 shrink-0 sm:h-20 sm:w-20">
                  <div className="h-14 w-14 overflow-hidden rounded-full border-4 border-[#2EC7D3] bg-gray-200 sm:h-20 sm:w-20">
                    <Avatar
                      texte={initiales(candidat.prenom, candidat.nom)}
                      photo={candidat.photo}
                      className="h-full w-full text-base font-black text-[#3C3C3B] sm:text-2xl"
                    />
                  </div>
                  {medaille && (
                    <div
                      className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-sm shadow-md sm:-bottom-2 sm:-right-2 sm:h-9 sm:w-9 sm:text-lg ${medaille.fond}`}
                    >
                      {medaille.emoji}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[#3C3C3B] sm:text-xl">
                        {candidat.prenom} {candidat.nom}
                      </h3>
                      <p className="truncate text-[11px] font-semibold text-gray-500 sm:text-sm">
                        {candidat.parti}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-black text-[#3C3C3B] sm:text-base">
                      {formatPoints(points)} pts
                    </span>
                  </div>

                  <BarreProgression
                    pourcentage={part}
                    className="mt-2 h-2 bg-gray-200 sm:h-3"
                    couleur="bg-[#2EC7D3]"
                  />
                  <p className="mt-1 text-[11px] text-gray-500 sm:text-sm">
                    {part}% des points
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ClassementAutres;
