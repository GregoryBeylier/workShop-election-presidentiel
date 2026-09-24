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

/**
 * Mot de passe provisoire : code à 4 chiffres, du type "0473", facile à dicter
 * ou à recopier (valable une seule connexion, il doit ensuite être remplacé).
 */
export function genererMotDePasse(): string {
  const [valeur] = crypto.getRandomValues(new Uint32Array(1));
  return String(valeur % 10000).padStart(4, "0");
}
