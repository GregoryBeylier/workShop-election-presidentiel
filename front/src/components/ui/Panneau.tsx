import type { ReactNode } from "react";

/**
 * Carte de section de l'admin, même style que les cartes de la page Résultats
 * (sur-titre turquoise en capitales + titre anthracite).
 */
function Panneau({
  surTitre,
  titre,
  action,
  children,
}: {
  surTitre: string;
  titre: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-lg sm:p-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-teal">
            {surTitre}
          </p>
          <h2 className="mt-1 font-heading text-xl font-bold text-brand-dark sm:text-2xl">
            {titre}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default Panneau;
