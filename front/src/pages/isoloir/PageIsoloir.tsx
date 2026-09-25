import { useEffect, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { ApiError } from "../../api/client";
import { getQrIsoloir } from "../../api/checkin";

const POLL_MS = 1000;

type TabletState =
  | { kind: "loading" }
  | { kind: "unauthorized" }
  | { kind: "ok"; payload: string; expiresAt: number }
  | { kind: "offline"; payload: string | null; expiresAt: number };

/**
 * Écran plein écran de la tablette isoloir.
 * N'affiche que le QR fourni par le serveur (jamais généré localement) et rien sur les votants.
 * La clé tablette est passée une fois dans l'URL (?cle=...) puis mémorisée sur l'appareil.
 */
function PageIsoloir() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const storageKey = `cle-isoloir-${id}`;
  const keyFromUrl = searchParams.get("cle");
  const boothKey = keyFromUrl ?? localStorage.getItem(storageKey) ?? "";
  const [state, setState] = useState<TabletState>({ kind: "loading" });
  const [now, setNow] = useState(() => Date.now());

  // Mémorise la clé puis la retire de l'URL pour qu'elle ne reste pas affichée
  useEffect(() => {
    if (keyFromUrl) {
      localStorage.setItem(storageKey, keyFromUrl);
      setSearchParams({}, { replace: true });
    }
  }, [keyFromUrl, storageKey, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const qr = await getQrIsoloir(id, boothKey);
        if (cancelled) return;
        const expiresAt = Date.now() + qr.expires_in;
        // Même QR qu'avant : on ne touche pas au rendu pour éviter tout clignotement
        setState((prev) =>
          prev.kind === "ok" && prev.payload === qr.qr_payload
            ? { ...prev, expiresAt }
            : { kind: "ok", payload: qr.qr_payload, expiresAt },
        );
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          setState({ kind: "unauthorized" });
          return;
        }
        setState((prev) =>
          prev.kind === "ok" || prev.kind === "offline"
            ? { kind: "offline", payload: prev.payload, expiresAt: prev.expiresAt }
            : { kind: "offline", payload: null, expiresAt: 0 },
        );
      }
    };

    poll();
    const timer = setInterval(() => {
      setNow(Date.now());
      poll();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id, boothKey]);

  if (state.kind === "unauthorized") {
    return (
      <FullScreen>
        <p className="text-2xl font-heading font-bold text-white text-center px-6">
          Tablette non autorisée
        </p>
        <p className="text-gray-400 text-center px-6">
          Ouvrez cette page avec la clé de l'isoloir : /isoloir/{id}?cle=…
        </p>
      </FullScreen>
    );
  }

  // Un QR expiré ne sert à rien : on le masque plutôt que de faire échouer les scans
  const payload =
    state.kind === "ok" || (state.kind === "offline" && state.expiresAt > now)
      ? state.payload
      : null;
  const connected = state.kind === "ok";

  return (
    <FullScreen>
      {payload ? (
        // Fond noir autour pour ne pas éblouir dans l'isoloir ; le QR garde sa marge blanche
        // (4 modules) dont les téléphones ont besoin pour le lire
        <QRCodeSVG
          value={payload}
          size={1024}
          marginSize={4}
          level="M"
          className="w-[min(70vw,65vh)] h-auto rounded-lg"
        />
      ) : (
        <p className="text-2xl font-heading font-bold text-gray-300">
          {state.kind === "loading" ? "Chargement…" : "Connexion au serveur perdue"}
        </p>
      )}

      {/* Indicateur discret pour le staff */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-gray-500">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            connected ? "bg-brand-green" : "bg-brand-pink animate-pulse"
          }`}
        />
        {connected ? "Connecté" : "Hors ligne"}
      </div>
    </FullScreen>
  );
}

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 select-none">
      {children}
    </div>
  );
}

export default PageIsoloir;
