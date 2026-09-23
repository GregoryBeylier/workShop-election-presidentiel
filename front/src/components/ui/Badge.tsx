import type { ReactNode } from "react";

// Couleurs secondaires de la charte pour distinguer les statuts
const couleurs = {
  teal: "bg-brand-teal/10 text-brand-teal-dark",
  green: "bg-brand-green/15 text-brand-green",
  pink: "bg-brand-pink/10 text-brand-pink",
  purple: "bg-brand-purple/10 text-brand-purple",
  gray: "bg-gray-100 text-gray-500",
};

export type CouleurBadge = keyof typeof couleurs;

function Badge({
  couleur,
  children,
}: {
  couleur: CouleurBadge;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${couleurs[couleur]}`}
    >
      {children}
    </span>
  );
}

export default Badge;
