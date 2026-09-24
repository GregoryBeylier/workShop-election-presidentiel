import { Link } from "react-router-dom";

/** Carte "Votre progression" : duels votés sur le total, date de clôture. */
function CarteProgression({
  faits,
  total,
  dateCloture,
}: {
  faits: number;
  total: number;
  dateCloture: string;
}) {
  const termine = total > 0 && faits >= total;

  return (
    <div className="bg-white text-gray-900 rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold">Votre progression</span>
        <span className="text-sm text-gray-500">Clôture le {dateCloture}</span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-brand-teal-dark">{faits}</span>
        <span className="text-gray-600">duels sur {total}</span>
      </div>

      {/* Un segment par duel */}
      <div
        className="grid gap-1 mb-4"
        style={{
          gridTemplateColumns: `repeat(${Math.max(total, 1)}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full ${
              i < faits ? "bg-brand-teal" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {termine
          ? "Votre vote est entièrement enregistré. Merci !"
          : `Plus que ${total - faits} duels avant l'enregistrement définitif de votre vote.`}
      </p>

      <Link
        to="/vote"
        className="block text-center bg-brand-teal text-white rounded-md py-3 font-medium hover:bg-brand-teal-dark transition-colors duration-300"
      >
        Reprendre où j'en étais
      </Link>
    </div>
  );
}

export default CarteProgression;
