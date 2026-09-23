import type { ButtonHTMLAttributes } from "react";

const variantes = {
  primaire: "bg-brand-teal text-white hover:bg-brand-teal-dark",
  secondaire: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  danger: "bg-brand-pink text-white hover:bg-brand-pink/85",
  sombre: "bg-brand-dark text-white hover:bg-brand-dark/85",
};

/** Bouton de la charte (turquoise par défaut, rose pour les actions destructrices). */
function Bouton({
  variante = "primaire",
  className = "",
  ...props
}: {
  variante?: keyof typeof variantes;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-300 disabled:opacity-40 ${variantes[variante]} ${className}`}
    />
  );
}

export default Bouton;
