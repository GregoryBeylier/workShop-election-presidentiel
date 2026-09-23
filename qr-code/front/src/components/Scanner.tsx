import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

/**
 * Caméra de l'appli qui lit un QR code.
 * S'arrête dès la première lecture pour n'envoyer qu'une seule requête par scan.
 */
function Scanner({
  onScan,
  onCancel,
}: {
  onScan: (value: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  // onScan peut changer à chaque rendu du parent : on garde la dernière version sans relancer la caméra
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let done = false;
    const scanner = new QrScanner(
      video,
      (result) => {
        if (done) return;
        done = true;
        scanner.stop();
        onScanRef.current(result.data);
      },
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        returnDetailedScanResult: true,
      },
    );

    scanner.start().catch(() => {
      setError(
        window.isSecureContext
          ? "Impossible d'accéder à la caméra. Autorisez-la dans les réglages du navigateur."
          : "La caméra n'est disponible que sur une page sécurisée (https).",
      );
    });

    return () => scanner.destroy();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl bg-black aspect-square">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      </div>
      {error ? (
        <p className="text-brand-pink text-sm">{error}</p>
      ) : (
        <p className="text-sm text-gray-500 text-center">
          Visez le QR code affiché sur la tablette de l'isoloir.
        </p>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="text-brand-dark underline text-sm self-center"
      >
        Annuler
      </button>
    </div>
  );
}

export default Scanner;
