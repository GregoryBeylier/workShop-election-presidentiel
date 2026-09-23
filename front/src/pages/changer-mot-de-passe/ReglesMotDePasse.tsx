import { reglesMotDePasse } from "../../utils/motDePasse";

const libelles = [
  { cle: "longueur", texte: "Au moins 8 caractères" },
  { cle: "majuscule", texte: "Une majuscule" },
  { cle: "chiffre", texte: "Un chiffre" },
  { cle: "special", texte: "Un caractère spécial" },
] as const;

/** Liste des règles du mot de passe, cochées au fur et à mesure de la saisie. */
function ReglesMotDePasse({ motDePasse }: { motDePasse: string }) {
  const regles = reglesMotDePasse(motDePasse);

  return (
    <ul className="text-sm space-y-1 mt-1">
      {libelles.map(({ cle, texte }) => (
        <li
          key={cle}
          className={regles[cle] ? "text-green-600" : "text-gray-400"}
        >
          {regles[cle] ? "✓" : "○"} {texte}
        </li>
      ))}
    </ul>
  );
}

export default ReglesMotDePasse;
