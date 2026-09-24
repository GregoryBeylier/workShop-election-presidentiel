import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Camera, Loader2, X } from "lucide-react";
import Avatar from "./Avatar";
import { preparerPhoto } from "../../utils/image";

/**
 * Photo ronde modifiable : glisser-déposer une image dessus, ou cliquer pour
 * choisir un fichier. L'image est redimensionnée (preparerPhoto) avant d'être
 * passée à `onPhoto`. Avec `children`, tout le bloc (pointillés) accepte le dépôt.
 */
function DepotPhoto({
  texte,
  photo,
  libelle,
  className,
  onPhoto,
  onSupprimer,
  onErreur,
  children,
}: {
  texte: string; // initiales si pas de photo
  photo: string | null;
  libelle: string; // "photo de Claire Fontaine", pour les lecteurs d'écran
  className: string; // taille et couleurs de l'avatar
  onPhoto: (photo: Blob) => Promise<void> | void;
  onSupprimer?: () => Promise<void> | void;
  onErreur: (message: string) => void;
  children?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const executer = async (action: () => Promise<void> | void) => {
    setEnCours(true);
    try {
      await action();
    } catch (e) {
      onErreur((e as Error).message);
    } finally {
      setEnCours(false);
    }
  };

  const traiter = (fichier: File | undefined) => {
    if (fichier) executer(async () => onPhoto(await preparerPhoto(fichier)));
  };

  const glisser = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setSurvol(true);
    },
    onDragLeave: (e: DragEvent) => {
      // Ignore le passage d'un élément enfant à un autre
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setSurvol(false);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setSurvol(false);
      if (!enCours) traiter(e.dataTransfer.files[0]);
    },
  };

  return (
    <div
      {...glisser}
      className={
        children
          ? `flex items-center gap-4 rounded-xl border-2 border-dashed p-3 transition-colors duration-300 ${
              survol
                ? "border-brand-teal bg-brand-teal/5"
                : "border-gray-300 bg-white"
            }`
          : "shrink-0"
      }
    >
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={enCours}
          title="Glissez une image ici ou cliquez pour en choisir une"
          aria-label={`${photo ? "Changer la" : "Ajouter une"} ${libelle}`}
          className={`group relative block rounded-full transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 ${
            survol ? "ring-4 ring-brand-teal ring-offset-2" : ""
          }`}
        >
          <Avatar texte={texte} photo={photo} className={className} />
          <span
            className={`absolute inset-0 flex items-center justify-center rounded-full bg-brand-dark/55 text-white transition-opacity duration-300 ${
              enCours || survol
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
            }`}
          >
            {enCours ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Camera size={18} />
            )}
          </span>
          {/* Toujours visible : indique sur mobile (sans survol) que la photo se change */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-teal text-white shadow ring-2 ring-white">
            <Camera size={11} strokeWidth={2.5} />
          </span>
        </button>

        {photo && onSupprimer && !enCours && (
          <button
            type="button"
            onClick={() => executer(onSupprimer)}
            title="Retirer la photo"
            aria-label={`Retirer la ${libelle}`}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-500 shadow ring-1 ring-gray-200 transition-colors duration-300 hover:text-brand-pink"
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {children}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          traiter(e.target.files?.[0]);
          // Permet de re-choisir le même fichier
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default DepotPhoto;
