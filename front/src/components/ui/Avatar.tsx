import { useState } from "react";

/**
 * Pastille ronde : photo si elle existe (candidats), sinon initiales.
 * Une photo introuvable retombe aussi sur les initiales.
 * La taille et les couleurs sont données par `className`.
 */
function Avatar({
  texte,
  photo,
  className,
  entier = false,
}: {
  texte: string;
  photo?: string | null;
  className: string;
  entier?: boolean; // image affichée en entier (logo) plutôt que recadrée (photo)
}) {
  // URL qui n'a pas pu être chargée (une nouvelle URL est retentée)
  const [photoEnErreur, setPhotoEnErreur] = useState<string | null>(null);
  const afficherPhoto = !!photo && photo !== photoEnErreur;

  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
    >
      {afficherPhoto ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          onError={() => setPhotoEnErreur(photo)}
          className={`h-full w-full ${entier ? "object-contain p-1" : "object-cover"}`}
        />
      ) : (
        texte
      )}
    </div>
  );
}

export default Avatar;
