/** En-tête du vote : "DUEL 2 SUR 6", barre de progression et consigne. */
function ProgressionDuels({ index, total }: { index: number; total: number }) {
  return (
    <div className="text-center mb-2 sm:mb-8">
      <span className="inline-block bg-brand-teal/10 text-brand-teal-dark text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full mb-1.5 sm:mb-3">
        DUEL {index + 1} SUR {total}
      </span>
      <div className="flex gap-1.5 max-w-xs mx-auto mb-1.5 sm:mb-5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1 sm:h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= index ? "bg-brand-teal" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <h1 className="font-heading text-lg sm:text-3xl font-bold text-brand-dark">
        Qui préférez-vous ?
      </h1>
      <p className="hidden sm:block text-sm text-gray-500 mt-1">
        Cliquez sur la carte du candidat de votre choix.
      </p>
    </div>
  );
}

export default ProgressionDuels;
