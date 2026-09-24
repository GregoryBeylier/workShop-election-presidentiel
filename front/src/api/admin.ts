import { apiFetch } from "./client";
import type { Candidat, Periode, ResultatCandidat } from "./election";

export interface DetailDuels {
  id: number;
  candidat1: Candidat;
  candidat2: Candidat;
  victoires1: number;
  victoires2: number;
  egalites: number;
}

export interface Stats {
  periode: Periode | null; // null : aucun scrutin créé
  nbEnCours: number; // électeurs ayant commencé sans finir
  nbDuelsVotes: number;
  classement: ResultatCandidat[];
  duels: DetailDuels[];
}

export interface Creation<T> {
  element: T;
  // false : l'email appartenait déjà à un compte, le mot de passe saisi n'a pas servi
  compteCree: boolean;
}

export type StatutVote = "AUCUN" | "EN_COURS" | "TERMINE";
// PROVISOIRE : l'utilisateur n'a pas encore remplacé le mot de passe fixé par l'admin
export type StatutCompte = "ACTIF" | "PROVISOIRE";

export interface UtilisateurAdmin {
  id: number;
  email: string;
  admin: boolean;
  inscrit: boolean;
  candidat: boolean;
  statutVote: StatutVote;
  statutCompte: StatutCompte;
  creeLe: string;
}

export interface NouvelUtilisateur {
  email: string;
  motDePasse: string; // provisoire, à changer à la première connexion
}

export interface CandidatAdmin {
  candidat: Candidat;
  email: string;
}

export interface NouveauCandidat extends NouvelUtilisateur {
  prenom: string;
  nom: string;
  parti: string;
}

export const getStats = () => apiFetch<Stats>("/admin/stats");

/** closLe : "YYYY-MM-DDTHH:mm", date et heure de clôture prévue affichée aux électeurs. */
export const ouvrirScrutin = (closLe: string) =>
  apiFetch<Periode>("/admin/scrutin/ouvrir", {
    method: "POST",
    body: { closLe },
  });

export const cloturerScrutin = () =>
  apiFetch<Periode>("/admin/scrutin/cloturer", { method: "POST" });

export const nouveauScrutin = () =>
  apiFetch<Periode>("/admin/scrutin", { method: "POST" });

export const getUtilisateurs = () =>
  apiFetch<UtilisateurAdmin[]>("/admin/utilisateurs");

export const creerUtilisateur = (utilisateur: NouvelUtilisateur) =>
  apiFetch<Creation<number>>("/admin/utilisateurs", {
    method: "POST",
    body: utilisateur,
  });

/** Mot de passe oublié : nouveau mot de passe provisoire, à changer à la connexion suivante. */
export const reinitialiserMotDePasse = (
  idUtilisateur: number,
  motDePasse: string,
) =>
  apiFetch<void>(`/admin/utilisateurs/${idUtilisateur}/mot-de-passe`, {
    method: "POST",
    body: { motDePasse },
  });

/** SUPPRIME : aucune trace de vote ; ANONYMISE : votes conservés sans identité. */
export const supprimerUtilisateur = (idUtilisateur: number) =>
  apiFetch<{ mode: "SUPPRIME" | "ANONYMISE" }>(
    `/admin/utilisateurs/${idUtilisateur}`,
    { method: "DELETE" },
  );

export const getCandidatsAdmin = () =>
  apiFetch<CandidatAdmin[]>("/admin/candidats");

export const ajouterCandidat = (candidat: NouveauCandidat) =>
  apiFetch<Creation<CandidatAdmin>>("/admin/candidats", {
    method: "POST",
    body: candidat,
  });

/** Remplace la photo du candidat (image déjà redimensionnée, voir preparerPhoto). */
export const envoyerPhotoCandidat = (idCandidat: number, photo: Blob) => {
  const donnees = new FormData();
  donnees.append("photo", photo, "photo.jpg");
  return apiFetch<Candidat>(`/admin/candidats/${idCandidat}/photo`, {
    method: "PUT",
    body: donnees,
  });
};

export const supprimerPhotoCandidat = (idCandidat: number) =>
  apiFetch<Candidat>(`/admin/candidats/${idCandidat}/photo`, {
    method: "DELETE",
  });

export const retirerCandidat = (idCandidat: number) =>
  apiFetch<void>(`/admin/candidats/${idCandidat}`, { method: "DELETE" });
