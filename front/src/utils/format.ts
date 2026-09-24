import type { Periode } from "../api/election";

/** Fin du scrutin : clos_le est une date-heure "YYYY-MM-DDTHH:mm:ss" (heure locale). */
export function dateCloture(periode: Periode): Date | null {
  return periode.closLe ? new Date(periode.closLe) : null;
}

/** "12 avril" */
export function formatJour(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/** "12 avril" à partir d'une date "YYYY-MM-DD" de l'API ("—" si absente). */
export function formatJourIso(iso: string | null): string {
  return iso ? formatJour(new Date(`${iso}T00:00:00`)) : "—";
}

/** "12 avril à 18h30" */
export function formatJourHeure(date: Date): string {
  const heure = date
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", "h");
  return `${formatJour(date)} à ${heure}`;
}

/** "12 avril à 18h30" à partir d'une date-heure ISO de l'API ("—" si absente). */
export function formatJourHeureIso(iso: string | null): string {
  return iso ? formatJourHeure(new Date(iso)) : "—";
}

/** Nombre de points au format français (0,5 pour une égalité). */
export const formatPoints = (points: number) =>
  points.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

/** Pourcentage arrondi, 0 si le total est nul. */
export function pourcentage(valeur: number, total: number): number {
  return total > 0 ? Math.round((valeur / total) * 100) : 0;
}

/** "Claire", "Fontaine" => "CF" */
export function initiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`;
}

/** "jean.dupont@exemple.fr" => "JE" (les électeurs n'ont ni nom ni prénom) */
export function initialesEmail(email: string): string {
  return email.slice(0, 2).toUpperCase();
}
