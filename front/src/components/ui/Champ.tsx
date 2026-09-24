import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Champ de formulaire libellé, même style que les formulaires Connexion / Mon compte.
 * `aide` : explication affichée sous le champ (et lue par les lecteurs d'écran).
 */
function Champ({
  label,
  id,
  aide,
  ...props
}: {
  label: string;
  id: string;
  aide?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-500">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={aide ? `${id}-aide` : undefined}
        {...props}
        className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal disabled:bg-gray-50 disabled:text-gray-400"
      />
      {aide && (
        <p id={`${id}-aide`} className="text-xs leading-5 text-gray-500">
          {aide}
        </p>
      )}
    </div>
  );
}

export default Champ;
