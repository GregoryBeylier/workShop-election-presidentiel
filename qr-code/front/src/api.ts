/**
 * Appels à l'API du check-in (proxifiée par Vite sur /api).
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

// TODO JWT : temporaire, l'identité du votant est un simple id stocké localement
const USER_ID_KEY = "userId";

export const getUserId = () => localStorage.getItem(USER_ID_KEY);
export const setUserId = (id: string) => localStorage.setItem(USER_ID_KEY, id);
export const clearUserId = () => localStorage.removeItem(USER_ID_KEY);

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

function voterHeaders(): HeadersInit {
  return { "X-User-Id": getUserId() ?? "" };
}

export function fetchVoterStatus() {
  return request<{ status: VoterStatus }>("/api/voter/me/status", {
    headers: voterHeaders(),
  }).then((r) => r.status);
}

export function checkin(qrToken: string) {
  return request<CheckinResponse>("/api/checkin", {
    method: "POST",
    headers: { ...voterHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ qr_token: qrToken }),
  });
}

export function fetchCurrentQr(boothId: string, boothKey: string) {
  return request<CurrentQr>(`/api/booths/${boothId}/current-qr`, {
    headers: { "X-Isoloir-Cle": boothKey },
    cache: "no-store",
  });
}
