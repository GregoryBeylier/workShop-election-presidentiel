import { Trophy } from "lucide-react";
import type { ResultatCandidat } from "../../api/election";
import Avatar from "../../components/ui/Avatar";
import BarreProgression from "../../components/ui/BarreProgression";
import { formatPoints, initiales, pourcentage } from "../../utils/format";

/** Grande carte dorée du candidat arrivé en tête. */
function CarteElu({
  elu,
  totalPoints,
}: {
  elu: ResultatCandidat;
  totalPoints: number;
}) {
  const { prenom, nom, parti } = elu.candidat;
  const part = pourcentage(elu.points, totalPoints);

  return (
    <section className="mb-6 overflow-hidden rounded-3xl bg-[#D4AF37] shadow-xl sm:mb-8">
      <div className="border-b border-white/20 bg-[#B8860B] px-4 py-4 text-center sm:px-6">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5 text-[#3C3C3B]" />
          <p className="text-sm font-black uppercase tracking-[0.15em] text-[#3C3C3B] sm:tracking-[0.2em]">
            Candidat élu
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 p-5 sm:gap-8 sm:p-10 md:flex-row">
        {/* Initiales + médaille (pas de photo en base) */}
        <div className="relative shrink-0">
          <div className="h-32 w-32 overflow-hidden rounded-full border-8 border-white bg-gray-100 shadow-lg sm:h-48 sm:w-48">
            <Avatar
              texte={initiales(prenom, nom)}
              className="h-full w-full text-4xl font-black text-[#3C3C3B] sm:text-6xl"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#3C3C3B] text-xl shadow-lg sm:h-14 sm:w-14 sm:text-2xl">
            🥇
          </div>
        </div>

        <div className="w-full flex-1 text-center md:text-left">
          <p className="text-sm font-bold uppercase tracking-widest text-white/80">
            Félicitations
          </p>
          <h2 className="mt-2 text-3xl font-black text-[#3C3C3B] sm:text-5xl">
            {prenom} {nom}
          </h2>
          <p className="mt-2 text-base font-bold text-[#3C3C3B] sm:text-lg">
            {parti}
          </p>

          <p className="mt-4 text-base font-medium text-[#3C3C3B]/70">
            Nombre de points obtenus
          </p>
          <p className="mt-1 text-4xl font-black text-[#3C3C3B] sm:text-5xl">
            {formatPoints(elu.points)}
          </p>
          <p className="mt-1 font-semibold text-[#3C3C3B]/70">points</p>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-[#3C3C3B]">
                Score obtenu
              </span>
              <span className="text-lg font-black text-[#3C3C3B]">{part}%</span>
            </div>
            <BarreProgression
              pourcentage={part}
              className="h-4 bg-white/50 sm:h-5"
              couleur="bg-[#3C3C3B]"
            />
            <p className="mt-2 text-right text-xs font-semibold text-[#3C3C3B]/70 sm:text-sm">
              {formatPoints(elu.points)} points sur {formatPoints(totalPoints)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CarteElu;
