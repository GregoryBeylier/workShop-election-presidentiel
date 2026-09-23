import { apiFetch } from "./client";

export interface Candidat {
  id: number;
  prenom: string;
  nom: string;
  parti: string;
}

export interface Periode {
  id: number;
  ouverte: boolean;
  ouvertLe: string | null; // "YYYY-MM-DD"
  closLe: string | null;
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
  matricule: string;
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

/**
 * Fin du scrutin : clos_le est une date, le scrutin se termine à la fin de ce jour-là.
 */
export function dateCloture(periode: Periode): Date | null {
  return periode.closLe ? new Date(`${periode.closLe}T23:59:59`) : null;
}

/** "12 avril" */
export function formatJour(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}
