import type { LucideIcon } from "lucide-react";

export interface Onglet<T extends string> {
  id: T;
  label: string;
  // Libellé affiché sur mobile quand `label` est trop long
  labelCourt?: string;
  icon: LucideIcon;
}

/**
 * Onglets de l'admin, même style pilule que la navigation principale.
 * Sur mobile : largeurs égales, icône au-dessus du libellé (court).
 */
function Onglets<T extends string>({
  onglets,
  actif,
  onChange,
}: {
  onglets: Onglet<T>[];
  actif: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-white p-1 shadow-sm sm:rounded-full"
    >
      {onglets.map(({ id, label, labelCourt, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={actif === id}
          onClick={() => onChange(id)}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 whitespace-nowrap rounded-xl px-2 py-2 text-xs font-medium transition-colors duration-300 sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:text-sm ${
            actif === id
              ? "bg-brand-teal text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50 hover:text-brand-dark"
          }`}
        >
          <Icon size={16} strokeWidth={2.25} className="shrink-0" />
          <span className="truncate sm:hidden">{labelCourt ?? label}</span>
          <span className="hidden truncate sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default Onglets;
