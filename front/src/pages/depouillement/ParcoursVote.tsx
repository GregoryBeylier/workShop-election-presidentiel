import { BarChart3, Hash, KeyRound, Swords } from "lucide-react";

/** Section 1 : le parcours d'un électeur, de la connexion aux résultats. */
function ParcoursVote({ nbDuels }: { nbDuels: number }) {
  const etapes = [
    {
      icon: KeyRound,
      titre: "Connexion",
      texte:
        "Vous vous connectez avec les identifiants remis par l'école. Chaque électeur est inscrit au scrutin en cours et ne dispose que d'un seul bulletin.",
    },
    {
      icon: Hash,
      titre: "Choix du mode",
      texte:
        "En ligne depuis votre téléphone ou votre ordinateur, ou à l'isoloir en tapant le code affiché sur l'écran puis en votant avec les boutons de la borne. L'un ou l'autre, jamais les deux.",
    },
    {
      icon: Swords,
      titre: "Les duels",
      texte: `Chaque paire de candidats s'affronte une seule fois${
        nbDuels > 0 ? ` : ${nbDuels} duels au total` : ""
      }. Pour chacun, vous choisissez votre préféré ou vous passez le duel (égalité).`,
    },
    {
      icon: BarChart3,
      titre: "Clôture et résultats",
      texte:
        "Les scores restent masqués pendant tout le scrutin. À la clôture, les bulletins sont dépouillés et le classement est publié sur la page Résultats.",
    },
  ];

  return (
    <section
      id="parcours"
      className="scroll-mt-16 px-4 sm:px-8 py-10 sm:py-12"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-2xl font-bold text-brand-dark mb-2">
          Du vote aux résultats
        </h2>
        <p className="text-sm text-gray-600 mb-8 max-w-2xl">
          Plutôt que de cocher un seul nom, vous comparez les candidats deux par
          deux. Voici le chemin que suit votre voix sur la plateforme.
        </p>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {etapes.map(({ icon: Icon, titre, texte }, i) => (
            <li key={titre} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal-dark font-semibold">
                  {i + 1}
                </span>
                <Icon size={20} className="text-brand-teal" />
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-dark mb-2">
                {titre}
              </h3>
              <p className="text-sm text-gray-700">{texte}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default ParcoursVote;
