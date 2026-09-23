import BarreProgression from "../../components/ui/BarreProgression";
import { pourcentage } from "../../utils/format";

/** Votants, inscrits et taux de participation du scrutin clos. */
function CarteParticipation({
  votants,
  inscrits,
}: {
  votants: number;
  inscrits: number;
}) {
  const participation = pourcentage(votants, inscrits);

  const chiffres = [
    {
      label: "Votants",
      valeur: votants,
      detail: "personnes ont voté",
      accent: false,
    },
    {
      label: "Inscrits",
      valeur: inscrits,
      detail: "personnes inscrites",
      accent: false,
    },
    {
      label: "Participation",
      valeur: `${participation}%`,
      detail: "des inscrits ont voté",
      accent: true,
    },
  ];

  return (
    <section className="mb-8 rounded-3xl bg-white p-5 shadow-lg sm:mb-10 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-[#2EC7D3]">
          Participation
        </p>
        <h2 className="mt-1 text-xl font-black text-[#3C3C3B] sm:text-2xl">
          Participation au scrutin
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
        {chiffres.map(({ label, valeur, detail, accent }, i) => (
          <div
            key={label}
            className={`rounded-2xl p-5 text-center ${accent ? "bg-[#2EC7D3]" : "bg-[#3C3C3B]"}`}
          >
            <p
              className={`text-sm font-bold uppercase tracking-wide ${accent ? "text-[#3C3C3B]/60" : "text-white/60"}`}
            >
              {label}
            </p>
            <p
              className={`mt-2 text-3xl font-black sm:text-4xl ${
                accent
                  ? "text-[#3C3C3B]"
                  : i === 0
                    ? "text-[#2EC7D3]"
                    : "text-white"
              }`}
            >
              {valeur}
            </p>
            <p
              className={`mt-1 text-sm ${accent ? "text-[#3C3C3B]/60" : "text-white/60"}`}
            >
              {detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-7 sm:mt-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-[#3C3C3B]">
            Taux de participation
          </span>
          <span className="text-sm font-black text-[#3C3C3B]">
            {votants} / {inscrits}
          </span>
        </div>
        <BarreProgression
          pourcentage={participation}
          className="h-4 bg-gray-200 sm:h-5"
          couleur="bg-[#2EC7D3]"
        />
        <p className="mt-2 text-right text-sm font-semibold text-gray-500">
          {participation}% de participation
        </p>
      </div>
    </section>
  );
}

export default CarteParticipation;
