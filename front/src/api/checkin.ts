import { API_URL } from "./config";
import { apiFetch, ApiError } from "./client";

/**
 * Mode de vote (en ligne ou isoloir) et check-in par le code de l'isoloir (voir borne/API.md).
 * Le code à 6 chiffres affiché sur l'écran de l'isoloir ouvre le vote sur sa borne :
 * le votant vote ensuite avec ses boutons.
 * Le votant est identifié par son JWT : le back ignore toute autre identité envoyée par le front.
 */

export type StatutVotant =
  | "not_voted"
  | "voted_app" // a commencé (ou fini) de voter en ligne
  | "checked_in_isoloir" // code validé : vote en cours sur la borne
  | "voted_booth" // la borne a enregistré le bulletin
  | "not_registered";

export interface ReponseCheckin {
  status:
    | "success"
    | "already_voted"
    | "invalid_token" // code faux ou expiré
    | "not_registered"
    | "booth_offline" // la borne ne répond plus
    | "booth_busy" // un autre votant est en train de voter sur cette borne
    | "too_many_attempts"; // trop de codes courts incorrects, bloqué quelques minutes
  message: string;
}

export interface ReponseVoteEnLigne {
  status: "success" | "checked_in_isoloir" | "not_registered";
  message: string;
}

export interface CodeIsoloir {
  code: string; // 6 chiffres, change toutes les 30 s
  expires_in: number;
}

export function getStatutVotant(): Promise<StatutVotant> {
  return apiFetch<{ status: StatutVotant }>("/voter/me/status").then((r) => r.status);
}

// Code tapé par le votant : ouvre le vote sur la borne de l'isoloir, révoque le vote en ligne
export function checkin(code: string) {
  return apiFetch<ReponseCheckin>("/checkin", { method: "POST", body: { code } });
}

// Le votant choisit le vote en ligne : ferme définitivement le vote à l'isoloir
export function commencerVoteEnLigne() {
  return apiFetch<ReponseVoteEnLigne>("/voter/me/online-vote", { method: "POST" });
}

/**
 * Code courant d'un isoloir, pour l'écran du poste. Pas de JWT (le poste n'a pas de compte) :
 * il présente la clé de l'isoloir. D'où un fetch direct plutôt qu'apiFetch.
 */
export async function getCodeIsoloir(idIsoloir: string, cleIsoloir: string): Promise<CodeIsoloir> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/booths/${idIsoloir}/current-code`, {
      headers: { "X-Isoloir-Cle": cleIsoloir },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur");
  }
  if (!res.ok) {
    throw new ApiError(res.status, "Code indisponible");
  }
  return res.json() as Promise<CodeIsoloir>;
}
