import { Users } from "lucide-react";
import BarreProgression from "../../components/ui/BarreProgression";
import { pourcentage } from "../../utils/format";

/** Participation en direct pendant le vote (sans aucun score). */
function ParticipationEnCours({
  votants,
  inscrits,
}: {
  votants: number;
  inscrits: number;
}) {
  const participation = pourcentage(votants, inscrits);

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-lg sm:mt-8 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3C3C3B]">
          <Users className="h-5 w-5 text-[#2EC7D3]" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#2EC7D3]">
            Participation en cours
          </p>
          <h2 className="mt-1 text-xl font-black text-[#3C3C3B]">
            Les urnes se remplissent
          </h2>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-[#3C3C3B]">
            Participation
          </span>
          <span className="text-sm font-black text-[#3C3C3B]">
            {participation}%
          </span>
        </div>
        <BarreProgression
          pourcentage={participation}
          className="h-4 bg-gray-200"
          couleur="bg-[#2EC7D3]"
        />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-500">{votants} votes</span>
          <span className="font-semibold text-gray-500">
            sur {inscrits} électeurs inscrits
          </span>
        </div>
      </div>
    </section>
  );
}

export default ParticipationEnCours;
