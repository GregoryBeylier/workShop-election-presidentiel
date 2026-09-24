import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import BarreProgression from "../../components/ui/BarreProgression";
import { formatPoints, pourcentage } from "../../utils/format";

// Bulletin fictif à 3 candidats (donc 3 duels) : une victoire de chaque côté et une égalité
const CANDIDATS = { A: "Alice", B: "Bruno", C: "Chloé" } as const;
type Lettre = keyof typeof CANDIDATS;

const DUELS: { gauche: Lettre; droite: Lettre; choix: Lettre | null }[] = [
  { gauche: "A", droite: "B", choix: "A" },
  { gauche: "A", droite: "C", choix: "C" },
  { gauche: "B", droite: "C", choix: null },
];

// 1 point au candidat choisi, 0,5 à chacun si le duel est passé (égalité)
function points(lettre: Lettre): number {
  return DUELS.reduce((total, { gauche, droite, choix }) => {
    if (gauche !== lettre && droite !== lettre) return total;
    if (choix === null) return total + 0.5;
    return total + (choix === lettre ? 1 : 0);
  }, 0);
}

const CLASSEMENT = (Object.keys(CANDIDATS) as Lettre[])
  .map((lettre) => ({ lettre, points: points(lettre) }))
  .sort((a, b) => b.points - a.points);

/** Carte du bandeau : un bulletin fictif dépouillé duel par duel, puis le classement. */
function ExempleDepouillement() {
  return (
    <div className="bg-white text-gray-900 rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold">Exemple de dépouillement</span>
        <span className="text-sm text-gray-500">1 bulletin</span>
      </div>

      <ul className="flex flex-col gap-2 mb-5">
        {DUELS.map(({ gauche, droite, choix }, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm"
          >
            <span className="text-gray-700">
              {CANDIDATS[gauche]} <span className="text-gray-400">vs</span>{" "}
              {CANDIDATS[droite]}
            </span>
            {choix ? (
              <Badge couleur="teal">{CANDIDATS[choix]} +1</Badge>
            ) : (
              <Badge couleur="purple">Égalité +0,5 / +0,5</Badge>
            )}
          </li>
        ))}
      </ul>

      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
        Classement
      </p>
      <div className="flex flex-col gap-3">
        {CLASSEMENT.map(({ lettre, points }, i) => (
          <div key={lettre} className="flex items-center gap-3">
            <Avatar
              texte={lettre}
              className={`w-8 h-8 text-sm font-semibold ${
                i === 0
                  ? "bg-brand-teal text-white"
                  : "bg-brand-teal/10 text-brand-teal-dark"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {CANDIDATS[lettre]}
                </span>
                <span className="font-semibold text-brand-dark">
                  {formatPoints(points)} pt{points > 1 ? "s" : ""}
                </span>
              </div>
              <BarreProgression
                pourcentage={pourcentage(points, DUELS.length)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExempleDepouillement;
