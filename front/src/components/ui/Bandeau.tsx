import type { ReactNode } from "react";

/**
 * Grand bandeau en dégradé de la charte (accueil électeur, admin) :
 * étiquette, titre et texte à gauche, `aside` à droite (carte, pilotage…).
 * `className` complète la section (hauteur plein écran du dépouillement…).
 */
function Bandeau({
  etiquette,
  titre,
  children,
  aside,
  className = "",
}: {
  etiquette: string;
  titre: ReactNode;
  children: ReactNode;
  aside: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-gradient-to-br from-brand-dark to-brand-teal-dark text-white px-4 sm:px-8 py-12 sm:py-16 ${className}`}
    >
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div>
          <span className="inline-block bg-brand-teal text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            {etiquette}
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold leading-tight mb-4">
            {titre}
          </h1>
          {children}
        </div>
        {aside}
      </div>
    </section>
  );
}

export default Bandeau;
