import { useEffect, useId, useState } from "react";
import { Sparkles, Trophy } from "lucide-react";
import type { ResultatCandidat } from "../../api/election";
import Avatar from "../../components/ui/Avatar";
import { formatPoints, initiales, pourcentage } from "../../utils/format";

const DUREE_COMPTEUR_MS = 1400;

const animationsReduites = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fait monter un nombre de 0 à `cible` à l'affichage (valeur finale directe si animations réduites). */
function useCompteur(cible: number) {
  const [reduit] = useState(animationsReduites);
  const [valeur, setValeur] = useState(0);

  useEffect(() => {
    if (reduit) return;
    let frame = 0;
    const debut = performance.now();
    const pas = (maintenant: number) => {
      const t = Math.min((maintenant - debut) / DUREE_COMPTEUR_MS, 1);
      // Ralentit en fin de course
      setValeur(Math.round(cible * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(pas);
    };
    frame = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(frame);
  }, [cible, reduit]);

  return reduit ? cible : valeur;
}

// Confettis aux couleurs de la charte, qui tombent en continu
const COULEURS_CONFETTIS = [
  "bg-brand-teal",
  "bg-brand-teal-dark",
  "bg-brand-green",
  "bg-brand-teal-light",
  "bg-brand-pink",
  "bg-brand-purple",
];
const confettis = Array.from({ length: 36 }, (_, i) => ({
  couleur: COULEURS_CONFETTIS[i % COULEURS_CONFETTIS.length],
  gauche: `${(i * 37 + 11) % 100}%`,
  delai: `${(i * 0.29) % 4}s`,
  duree: `${3.5 + (i % 5) * 0.6}s`,
  forme: i % 3 === 0 ? "h-2 w-2 rounded-full" : "h-3 w-1.5 rounded-sm",
}));

/**
 * Grande carte du candidat arrivé en tête, aux tons clairs de la charte (blanc vers teal clair) :
 * confettis en continu, anneau lumineux autour de la photo, « 1 » géant
 * en filigrane, score qui défile.
 * Animations coupées si l'utilisateur les réduit.
 */
function CarteElu({
  elu,
  totalPoints,
}: {
  elu: ResultatCandidat;
  totalPoints: number;
}) {
  const { prenom, nom, parti, photo, logo } = elu.candidat;
  const part = pourcentage(elu.points, totalPoints);
  const partAffichee = useCompteur(part);
  const idTitre = useId();

  const bilan = [
    { label: "Victoires", valeur: elu.victoires },
    { label: "Égalités", valeur: elu.egalites },
    { label: "Défaites", valeur: elu.defaites },
  ];

  return (
    <section
      aria-labelledby={idTitre}
      className="relative isolate mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#e6f6f6] to-brand-teal-light text-brand-dark shadow-[0_30px_60px_-20px_rgba(35,161,171,0.45)] motion-safe:animate-[monte_0.7s_ease-out] sm:mb-8"
    >
      {/* Décor : « 1 » géant, halo teal derrière la photo, reflet, confettis */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 [container-type:size]">
        <span className="absolute -top-10 right-4 hidden select-none font-heading text-[22rem] font-extrabold leading-none text-transparent [-webkit-text-stroke:3px_rgba(35,161,171,0.18)] md:block">
          1
        </span>
        <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-teal/20 blur-3xl motion-safe:animate-[halo-flotte_10s_ease-in-out_infinite]" />
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/50 to-transparent motion-safe:animate-[reflet-balaie_7s_ease-in-out_infinite] motion-reduce:hidden" />
        {confettis.map(({ couleur, gauche, delai, duree, forme }, i) => (
          <span
            key={i}
            style={{ left: gauche, animationDelay: delai, animationDuration: duree }}
            className={`absolute -top-4 opacity-0 motion-safe:animate-[confetti-tombe_4s_linear_infinite_both] motion-reduce:hidden ${couleur} ${forme}`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-10 px-5 py-10 sm:px-10 sm:py-12 md:flex-row md:gap-14">
        {/* Photo dans son anneau tournant (décoratif : le nom est donné en texte) */}
        <div className="relative h-40 w-40 shrink-0 motion-safe:animate-[vs-pop_0.9s_ease-out] sm:h-56 sm:w-56">
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-full bg-brand-teal/35 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -inset-1.5 rounded-full bg-[conic-gradient(from_0deg,var(--color-brand-teal),transparent_30%,var(--color-brand-teal-light)_50%,transparent_80%,var(--color-brand-teal))] motion-safe:animate-[spin_5s_linear_infinite]"
          />
          <div className="absolute inset-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl">
            <Avatar
              texte={initiales(prenom, nom)}
              photo={photo}
              className="h-full w-full bg-gradient-to-br from-white to-brand-teal-light/50 font-heading text-5xl font-extrabold text-brand-dark sm:text-7xl"
            />
          </div>
          <Sparkles
            aria-hidden="true"
            className="absolute -right-3 -top-1 h-7 w-7 text-brand-teal motion-safe:animate-[scintille_3s_ease-in-out_infinite]"
          />
          <span className="absolute -bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-teal px-4 py-1.5 font-heading text-base font-extrabold text-brand-dark shadow-[0_8px_24px_-6px_rgba(35,161,171,0.7)]">
            <Trophy className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            <span aria-hidden="true">
              1<sup className="ml-px">er</sup>
            </span>
            <span className="sr-only">Première place</span>
          </span>
        </div>

        <div className="w-full min-w-0 flex-1 text-center md:text-left">
          <p className="inline-block rounded-full bg-brand-teal px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-dark motion-safe:animate-[monte_0.6s_ease-out_0.2s_both]">
            Candidat élu
          </p>
          <h2
            id={idTitre}
            className="mt-4 font-heading leading-[0.95] tracking-tight motion-safe:animate-[monte_0.6s_ease-out_0.35s_both]"
          >
            <span className="block text-2xl font-semibold text-brand-teal-dark sm:text-3xl">
              {prenom}
            </span>
            <span className="block break-words text-5xl font-extrabold uppercase text-brand-dark sm:text-7xl">
              {nom}
            </span>
          </h2>
          <p className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-gray-600 motion-safe:animate-[monte_0.6s_ease-out_0.5s_both]">
            {logo && (
              <img
                src={logo}
                alt=""
                className="h-8 w-8 rounded-full bg-white object-contain p-0.5"
              />
            )}
            <span className="sr-only">Parti : </span>
            {parti}
          </p>

          {/* Score et bilan des duels */}
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col-reverse rounded-2xl bg-white px-4 py-4 text-left shadow-[0_12px_30px_-12px_rgba(35,161,171,0.6)] motion-safe:animate-[monte_0.6s_ease-out_0.6s_both]">
              <dt className="mt-2 text-xs font-semibold text-brand-dark">
                Score · {formatPoints(elu.points)} pts sur {formatPoints(totalPoints)}
              </dt>
              <dd className="font-heading text-4xl font-extrabold leading-none text-brand-teal-dark sm:text-5xl">
                {/* Le compteur défile à l'écran ; les lecteurs d'écran lisent la valeur finale */}
                <span aria-hidden="true">
                  {partAffichee}
                  <span className="text-2xl sm:text-3xl">%</span>
                </span>
                <span className="sr-only">{part} %</span>
              </dd>
            </div>
            {bilan.map(({ label, valeur }, i) => (
              <div
                key={label}
                style={{ animationDelay: `${0.7 + i * 0.1}s` }}
                className="flex flex-col-reverse rounded-2xl bg-white/55 px-4 py-4 text-left ring-1 ring-white backdrop-blur-md motion-safe:animate-[monte_0.6s_ease-out_both]"
              >
                <dt className="mt-2 text-xs font-semibold uppercase tracking-wider text-brand-dark">
                  {label}
                </dt>
                <dd className="font-heading text-4xl font-extrabold leading-none text-brand-dark sm:text-5xl">
                  {valeur}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export default CarteElu;
