/**
 * Règles du mot de passe définitif (mêmes règles côté back, MotDePasseService).
 */
export function reglesMotDePasse(motDePasse: string) {
  const regles = {
    longueur: motDePasse.length >= 8,
    majuscule: /[A-Z]/.test(motDePasse),
    chiffre: /\d/.test(motDePasse),
    special: /[^A-Za-z0-9]/.test(motDePasse),
  };
  return { ...regles, valide: Object.values(regles).every(Boolean) };
}

// Sans caractères ambigus (0/O, 1/l/I) pour pouvoir le dicter ou le recopier
const LETTRES = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const CHIFFRES = "23456789";

function tirer(alphabet: string, n: number): string {
  const valeurs = crypto.getRandomValues(new Uint32Array(n));
  return Array.from(valeurs, (v) => alphabet[v % alphabet.length]).join("");
}

/**
 * Mot de passe provisoire lisible, du type "Kmtq-7384-Ravp" (majuscule,
 * chiffres et tirets : il respecte aussi les règles du mot de passe définitif).
 */
export function genererMotDePasse(): string {
  return `${tirer(LETTRES, 1).toUpperCase()}${tirer(LETTRES, 3)}-${tirer(CHIFFRES, 4)}-${tirer(LETTRES, 4)}`;
}
