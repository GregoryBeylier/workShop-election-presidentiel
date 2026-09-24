import { Link } from "react-router-dom";

/** Affiché quand tous les duels ont déjà été votés (en ligne, ou sur la borne si `nbDuels` est absent). */
function VoteTermine({ nbDuels }: { nbDuels?: number }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 text-center">
      <h1 className="font-heading text-2xl font-bold text-brand-dark mb-2">
        Votre vote est enregistré
      </h1>
      <p className="text-gray-500 mb-6">
        {nbDuels === undefined ? "" : `Vous avez voté les ${nbDuels} duels. `}Merci pour votre participation !
      </p>
      <Link
        to="/waiting"
        className="inline-block bg-brand-teal text-white rounded-md px-6 py-2 font-medium hover:bg-brand-teal-dark transition-colors duration-300"
      >
        Suivre le scrutin
      </Link>
    </div>
  );
}

export default VoteTermine;
