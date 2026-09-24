import { apiFetch } from "./client";

export interface Candidat {
  id: number;
  prenom: string;
  nom: string;
  parti: string;
  photo: string | null; // URL, null : on affiche les initiales
}

export type EtatScrutin = "PREPARATION" | "OUVERT" | "CLOS";

export interface Periode {
  id: number;
  etat: EtatScrutin;
  ouverte: boolean;
  ouvertLe: string | null; // "YYYY-MM-DD"
  closLe: string | null; // "YYYY-MM-DDTHH:mm:ss", clôture prévue si OUVERT, effective si CLOS
  nbDuels: number;
  nbInscrits: number;
  nbVotants: number; // électeurs ayant voté tous les duels
}

export interface Duel {
  id: number;
  candidat1: Candidat;
  candidat2: Candidat;
  fait: boolean; // déjà voté par l'électeur connecté
}

export interface MonVote {
  inscrit: boolean;
  duels: Duel[];
}

export interface ResultatCandidat {
  candidat: Candidat;
  points: number;
  victoires: number;
  egalites: number;
  defaites: number;
}

export interface Resultats {
  periode: Periode;
  classement: ResultatCandidat[]; // trié par points décroissants
}

export interface Profil {
  email: string;
  admin: boolean;
}

export const getPeriode = () => apiFetch<Periode>("/periode");

export const getMonVote = () => apiFetch<MonVote>("/vote");

/** idCandidatChoisi null = duel passé (égalité). */
export const voter = (idDuel: number, idCandidatChoisi: number | null) =>
  apiFetch<void>(`/vote/${idDuel}`, {
    method: "POST",
    body: { idCandidatChoisi },
  });

/** Lève une ApiError 409 tant que le scrutin est ouvert. */
export const getResultats = () => apiFetch<Resultats>("/resultats");

export const getProfil = () => apiFetch<Profil>("/auth/me");
