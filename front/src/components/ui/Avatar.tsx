/**
 * Pastille ronde avec des initiales (candidats, utilisateur connecté).
 * La taille et les couleurs sont données par `className`.
 */
function Avatar({ texte, className }: { texte: string; className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full ${className}`}
    >
      {texte}
    </div>
  );
}

export default Avatar;
