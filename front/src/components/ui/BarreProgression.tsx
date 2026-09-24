/**
 * Barre horizontale remplie à `pourcentage` % (participation, score…).
 * `className` règle la hauteur et le fond, `couleur` le remplissage.
 */
function BarreProgression({
  pourcentage,
  className = "h-2 bg-gray-200",
  couleur = "bg-brand-teal",
}: {
  pourcentage: number;
  className?: string;
  couleur?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-full ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ${couleur}`}
        style={{ width: `${Math.min(Math.max(pourcentage, 0), 100)}%` }}
      />
    </div>
  );
}

export default BarreProgression;
