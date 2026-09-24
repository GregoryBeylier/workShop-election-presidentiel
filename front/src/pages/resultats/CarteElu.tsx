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

// Étincelles autour de la photo : position et décalage de l'animation
const etincelles = [
  { className: "-left-4 top-4 h-5 w-5", delai: "0s" },
  { className: "-right-2 top-0 h-4 w-4", delai: "0.8s" },
  { className: "-right-6 bottom-10 h-6 w-6", delai: "1.6s" },
  { className: "-left-2 bottom-4 h-3 w-3", delai: "2.4s" },
];

/**
 * Grande carte du candidat arrivé en tête : dégradé teal de la charte (touche de violet) animé,
 * halo lumineux autour de la photo, score et bilan des duels qui défilent.
 * Couleurs de la charte (teal + violet), animations coupées si l'utilisateur les réduit.
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
      className="relative isolate mb-6 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,var(--color-brand-teal-dark),var(--color-brand-teal),var(--color-brand-purple),var(--color-brand-teal),var(--color-brand-teal-dark))] bg-[length:300%_300%] text-white shadow-[0_25px_60px_-15px_rgba(35,161,171,0.6)] motion-safe:animate-[degrade-coule_14s_ease-in-out_infinite,monte_0.7s_ease-out] sm:mb-8"
    >
      {/* Décor : halos flottants, trame de points, reflet qui balaie la carte */}
      <div aria-hidden="true">
        <div className="pointer-events-none absolute -left-20 -top-24 -z-10 h-96 w-96 rounded-full bg-brand-teal/30 blur-3xl motion-safe:animate-[halo-flotte_9s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -bottom-32 right-10 -z-10 h-96 w-96 rounded-full bg-brand-purple/40 blur-3xl motion-safe:animate-[halo-flotte_11s_ease-in-out_infinite_reverse]" />
        <div className="pointer-events-none absolute right-1/3 top-0 -z-10 h-72 w-72 rounded-full bg-brand-teal-light/40 blur-3xl motion-safe:animate-[halo-flotte_13s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[length:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/4 bg-gradient-to-r from-transparent via-white/15 to-transparent motion-safe:animate-[reflet-balaie_6s_ease-in-out_infinite] motion-reduce:hidden" />
      </div>


      <div className="flex flex-col items-center gap-10 px-5 py-10 sm:px-10 sm:py-12 md:flex-row md:gap-14">
        {/* Photo dans son halo tournant (décoratif : le nom est donné en texte) */}
        <div className="relative h-40 w-40 shrink-0 motion-safe:animate-[vs-pop_0.9s_ease-out] sm:h-56 sm:w-56">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,var(--color-brand-teal),#ffffff,var(--color-brand-purple),var(--color-brand-teal-light),var(--color-brand-teal))] opacity-70 blur-xl motion-safe:animate-[spin_6s_linear_infinite]"
          />
          <div className="absolute inset-2 overflow-hidden rounded-full bg-white shadow-2xl ring-4 ring-white">
            <Avatar
              texte={initiales(prenom, nom)}
              photo={photo}
              className="h-full w-full bg-gradient-to-br from-brand-teal-light/60 via-white to-brand-purple/25 font-heading text-4xl font-extrabold text-brand-purple sm:text-6xl"
            />
          </div>
          {etincelles.map(({ className, delai }) => (
            <Sparkles
              key={delai}
              aria-hidden="true"
              style={{ animationDelay: delai }}
              className={`absolute text-white opacity-0 motion-safe:animate-[scintille_3.2s_ease-in-out_infinite] motion-reduce:opacity-100 ${className}`}
            />
          ))}
          <span className="absolute -bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-1.5 font-heading text-sm font-extrabold text-brand-purple shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)]">
            <Trophy className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            <span aria-hidden="true">
              1<sup className="ml-px">er</sup>
            </span>
            <span className="sr-only">Première place</span>
          </span>
        </div>

        <div className="w-full min-w-0 flex-1 text-center md:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] ring-1 ring-white/40 backdrop-blur motion-safe:animate-[monte_0.6s_ease-out_0.2s_both]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Candidat élu
          </p>
          <h2
            id={idTitre}
            className="mt-4 font-heading leading-[0.95] tracking-tight motion-safe:animate-[monte_0.6s_ease-out_0.35s_both]"
          >
            <span className="block text-2xl font-semibold text-white sm:text-3xl">
              {prenom}
            </span>
            {/* Texte en dégradé : repasse en couleur système en mode contraste élevé */}
            <span className="block break-words bg-[linear-gradient(90deg,#ffffff,var(--color-brand-teal-light),#ffffff,#e9d5ff,#ffffff)] bg-[length:200%_auto] bg-clip-text text-5xl font-extrabold uppercase text-transparent drop-shadow-[0_4px_20px_rgba(46,199,211,0.35)] motion-safe:animate-[degrade-coule_5s_linear_infinite] forced-colors:bg-none forced-colors:text-[CanvasText] sm:text-7xl">
              {nom}
            </span>
          </h2>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 py-1 pl-1 pr-4 text-sm font-semibold ring-1 ring-white/40 backdrop-blur motion-safe:animate-[monte_0.6s_ease-out_0.5s_both]">
            {logo ? (
              <img src={logo} alt="" className="h-7 w-7 rounded-full bg-white object-contain p-0.5" />
            ) : (
              <span className="h-7 w-2" />
            )}
            <span className="sr-only">Parti : </span>
            {parti}
          </p>

          {/* Score et bilan des duels */}
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col-reverse rounded-2xl bg-white px-4 py-4 text-left shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] motion-safe:animate-[monte_0.6s_ease-out_0.6s_both]">
              <dt className="mt-2 text-xs font-semibold text-brand-purple">
                Score · {formatPoints(elu.points)} pts sur {formatPoints(totalPoints)}
              </dt>
              <dd className="bg-gradient-to-r from-brand-teal-dark to-brand-purple bg-clip-text font-heading text-4xl font-extrabold leading-none text-transparent forced-colors:bg-none forced-colors:text-[CanvasText] sm:text-5xl">
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
                className="flex flex-col-reverse rounded-2xl bg-white/15 px-4 py-4 text-left ring-1 ring-white/40 backdrop-blur-md motion-safe:animate-[monte_0.6s_ease-out_both]"
              >
                <dt className="mt-2 text-xs font-semibold uppercase tracking-wider text-white">
                  {label}
                </dt>
                <dd className="font-heading text-4xl font-extrabold leading-none sm:text-5xl">
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
