import type { LucideIcon } from "lucide-react";

export interface Onglet<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

/** Onglets de l'admin, même style pilule que la navigation principale. */
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
      className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm"
    >
      {onglets.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={actif === id}
          onClick={() => onChange(id)}
          className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${
            actif === id
              ? "bg-brand-teal text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50 hover:text-brand-dark"
          }`}
        >
          <Icon size={16} strokeWidth={2.25} />
          {label}
        </button>
      ))}
    </div>
  );
}

export default Onglets;
