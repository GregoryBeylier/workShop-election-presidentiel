import { apiFetch, ApiError } from "./client";

/**
 * Mode de vote (en ligne ou isoloir) et check-in QR de l'isoloir
 * (voir qr-code/spec-checkin-qr-isoloir.md).
 * Le votant est identifié par son JWT : le back ignore toute autre identité envoyée par le front.
 */

export type StatutVotant =
  | "not_voted"
  | "voted_app"
  | "checked_in_isoloir"
  | "not_registered";

export interface ReponseCheckin {
  status: "success" | "already_voted" | "expired_token" | "invalid_token" | "not_registered";
  message: string;
}

export interface ReponseVoteEnLigne {
  status: "success" | "checked_in_isoloir" | "not_registered";
  message: string;
}

export interface QrIsoloir {
  qr_payload: string;
  expires_in: number;
}

export function getStatutVotant(): Promise<StatutVotant> {
  return apiFetch<{ status: StatutVotant }>("/voter/me/status").then((r) => r.status);
}

// Après le scan du QR affiché dans l'isoloir : révoque définitivement le vote en ligne
export function checkin(qrToken: string) {
  return apiFetch<ReponseCheckin>("/checkin", { method: "POST", body: { qr_token: qrToken } });
}

// Le votant choisit le vote en ligne : ferme définitivement le vote à l'isoloir
export function commencerVoteEnLigne() {
  return apiFetch<ReponseVoteEnLigne>("/voter/me/online-vote", { method: "POST" });
}

/**
 * QR courant d'un isoloir, pour l'écran du poste. Pas de JWT (le poste n'a pas de compte) :
 * il présente la clé de l'isoloir. D'où un fetch direct plutôt qu'apiFetch.
 */
export async function getQrIsoloir(idIsoloir: string, cleIsoloir: string): Promise<QrIsoloir> {
  let res: Response;
  try {
    res = await fetch(`/api/booths/${idIsoloir}/current-qr`, {
      headers: { "X-Isoloir-Cle": cleIsoloir },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur");
  }
  if (!res.ok) {
    throw new ApiError(res.status, "QR indisponible");
  }
  return res.json() as Promise<QrIsoloir>;
}
