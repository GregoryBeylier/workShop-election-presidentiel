// Côté le plus long de la photo envoyée : largement assez pour un avatar (même en grand sur les résultats)
const COTE_MAX = 640;
const QUALITE_JPEG = 0.85;
// Fichier d'origine accepté avant redimensionnement (photo d'appareil, etc.)
const POIDS_MAX_ORIGINE = 15 * 1024 * 1024;

/**
 * Vérifie qu'un fichier déposé est une image, puis la réduit et la convertit
 * en JPEG pour que l'envoi et la base restent légers (~50 Ko au lieu de plusieurs Mo).
 * Lève une Error avec un message affichable si le fichier ne convient pas.
 */
export async function preparerPhoto(fichier: File): Promise<Blob> {
  if (!fichier.type.startsWith("image/")) {
    throw new Error("Ce fichier n'est pas une image (JPEG, PNG ou WebP).");
  }
  if (fichier.size > POIDS_MAX_ORIGINE) {
    throw new Error("Image trop lourde (15 Mo maximum).");
  }

  let image: ImageBitmap;
  try {
    // imageOrientation : respecte la rotation EXIF des photos de téléphone
    image = await createImageBitmap(fichier, {
      imageOrientation: "from-image",
    });
  } catch {
    throw new Error(
      "Image illisible : essayez un autre fichier (JPEG, PNG ou WebP).",
    );
  }

  const echelle = Math.min(1, COTE_MAX / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * echelle);
  canvas.height = Math.round(image.height * echelle);
  const ctx = canvas.getContext("2d")!;
  // Fond blanc : les zones transparentes d'un PNG ne deviennent pas noires en JPEG
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Conversion de l'image impossible.")),
      "image/jpeg",
      QUALITE_JPEG,
    ),
  );
}
