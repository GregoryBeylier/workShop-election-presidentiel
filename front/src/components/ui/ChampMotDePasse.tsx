import { useState } from "react";
import { Eye, EyeOff, Wand2 } from "lucide-react";
import { genererMotDePasse } from "../../utils/motDePasse";

/**
 * Mot de passe provisoire saisi par l'admin, avec affichage en clair
 * et bouton « Générer » (code à 4 chiffres, facile à transmettre).
 */
function ChampMotDePasse({
  id,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  value: string;
  onChange: (valeur: string) => void;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-500">
        Mot de passe provisoire
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
            maxLength={72}
            disabled={disabled}
            autoComplete="new-password"
            aria-describedby={`${id}-aide`}
            className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 font-mono focus:outline-none focus:ring-2 focus:ring-brand-teal disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={
              visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onChange(genererMotDePasse());
            setVisible(true);
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-300 hover:bg-gray-50 disabled:opacity-40"
        >
          <Wand2 size={16} />
          Générer
        </button>
      </div>
      <p id={`${id}-aide`} className="text-xs leading-5 text-gray-500">
        Au choix, sans contrainte : la personne devra le remplacer par son
        propre mot de passe à sa première connexion.
      </p>
    </div>
  );
}

export default ChampMotDePasse;
