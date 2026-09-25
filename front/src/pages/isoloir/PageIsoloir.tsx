import { useEffect, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import { getCodeIsoloir } from "../../api/checkin";

const POLL_MS = 1000;

type TabletState =
  | { kind: "loading" }
  | { kind: "unauthorized" }
  | { kind: "ok"; code: string; expiresAt: number }
  | { kind: "offline"; code: string | null; expiresAt: number };

/**
 * Écran plein écran de la tablette isoloir.
 * N'affiche que le code fourni par le serveur (jamais calculé localement) et rien sur les votants.
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
        const res = await getCodeIsoloir(id, boothKey);
        if (cancelled) return;
        setState({ kind: "ok", code: res.code, expiresAt: Date.now() + res.expires_in });
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          setState({ kind: "unauthorized" });
          return;
        }
        setState((prev) =>
          prev.kind === "ok" || prev.kind === "offline"
            ? { kind: "offline", code: prev.code, expiresAt: prev.expiresAt }
            : { kind: "offline", code: null, expiresAt: 0 },
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

  // Hors ligne, on garde le code jusqu'à sa rotation, puis on le masque (il serait refusé)
  const code =
    state.kind === "ok" || (state.kind === "offline" && state.expiresAt > now) ? state.code : null;
  const connected = state.kind === "ok";

  return (
    <FullScreen>
      {code ? (
        <>
          <p className="text-2xl text-gray-400 text-center px-6">
            Tapez ce code dans l'appli, rubrique « Voter à l'isoloir »
          </p>
          <p className="font-mono font-bold text-white tabular-nums tracking-widest text-[min(18vw,30vh)] leading-none">
            {code.slice(0, 3)} {code.slice(3)}
          </p>
        </>
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
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 select-none">
      {children}
    </div>
  );
}

export default PageIsoloir;
