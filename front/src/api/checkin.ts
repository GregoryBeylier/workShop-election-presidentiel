import { getValidToken } from "./auth";

/**
 * Appels à l'API du check-in isoloir (voir qr-code/spec-checkin-qr-isoloir.md).
 */

export type VoterStatus =
  | "not_voted"
  | "voted_app"
  | "checked_in_isoloir"
  | "not_registered";

export type CheckinStatus =
  | "success"
  | "already_voted"
  | "expired_token"
  | "invalid_token"
  | "not_registered";

export interface CheckinResponse {
  status: CheckinStatus;
  message: string;
}

export interface CurrentQr {
  qr_payload: string;
  expires_in: number;
}

// Erreur réseau (Wi-Fi coupé, serveur injoignable) : la requête n'a pas abouti
export class NetworkError extends Error {}

// Réponse HTTP inattendue (401, 500...)
export class HttpError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new NetworkError();
  }
  if (!res.ok) {
    throw new HttpError(res.status);
  }
  return res.json() as Promise<T>;
}

// Le votant est identifié par son JWT : le back ignore toute autre identité envoyée par le front
function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${getValidToken() ?? ""}` };
}

export function fetchVoterStatus() {
  return request<{ status: VoterStatus }>("/api/voter/me/status", {
    headers: authHeaders(),
  }).then((r) => r.status);
}

export function checkin(qrToken: string) {
  return request<CheckinResponse>("/api/checkin", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ qr_token: qrToken }),
  });
}

export interface OnlineVoteResponse {
  status: "success" | "checked_in_isoloir" | "not_registered";
  message: string;
}

// Le votant choisit le vote en ligne : ferme définitivement le vote à l'isoloir
export function startOnlineVote() {
  return request<OnlineVoteResponse>("/api/voter/me/online-vote", {
    method: "POST",
    headers: authHeaders(),
  });
}

// Poste isoloir : pas de JWT, il présente la clé de l'isoloir
export function fetchCurrentQr(boothId: string, boothKey: string) {
  return request<CurrentQr>(`/api/booths/${boothId}/current-qr`, {
    headers: { "X-Isoloir-Cle": boothKey },
    cache: "no-store",
  });
}
