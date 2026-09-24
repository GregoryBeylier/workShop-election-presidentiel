import { CheckCircle2, Equal, Lock, Scale, Trophy, X } from "lucide-react";
import CarteChiffre from "../../components/ui/CarteChiffre";
import Panneau from "../../components/ui/Panneau";

// Règles appliquées par le back au dépouillement (ElectionService.classement)
const REGLES = [
  {
    icon: CheckCircle2,
    titre: "Seuls les bulletins complets comptent",
    texte:
      "Un bulletin n'est dépouillé que si tous ses duels ont été votés. Un vote commencé puis abandonné, ou les choix en cours sur la borne, n'entrent jamais dans le calcul.",
  },
  {
    icon: Scale,
    titre: "Égalité de points : le duel direct tranche",
    texte:
      "Si deux candidats finissent avec le même total, celui qui a été choisi le plus souvent face à l'autre passe devant dans le classement.",
  },
  {
    icon: Lock,
    titre: "Résultats sous clé jusqu'à la clôture",
    texte:
      "Personne ne voit les scores pendant le vote. Le classement publié ne montre que des totaux : aucun choix individuel n'est jamais affiché.",
  },
];

/** Section 2 : barème des points et règles du dépouillement. */
function ReglesDepouillement() {
  return (
    <section id="regles" className="scroll-mt-16 px-4 sm:px-8 pb-10 sm:pb-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-2xl font-bold text-brand-dark mb-2">
          Comment les bulletins sont dépouillés
        </h2>
        <p className="text-sm text-gray-600 mb-8 max-w-2xl">
          Chaque duel voté distribue un point. Le candidat qui en cumule le plus
          sur l'ensemble des bulletins est élu.
        </p>

        <Panneau surTitre="Barème" titre="Les points d'un duel">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <CarteChiffre
              label="Victoire"
              valeur="1 pt"
              detail="au candidat que vous choisissez"
              icon={Trophy}
            />
            <CarteChiffre
              label="Égalité"
              valeur="0,5 pt"
              detail="à chacun si vous passez le duel"
              icon={Equal}
              accent
            />
            <CarteChiffre
              label="Défaite"
              valeur="0 pt"
              detail="au candidat non retenu"
              icon={X}
            />
          </div>
        </Panneau>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 sm:mt-8">
          {REGLES.map(({ icon: Icon, titre, texte }) => (
            <div key={titre} className="bg-white rounded-xl shadow p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal-dark mb-4">
                <Icon size={24} />
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-dark mb-2">
                {titre}
              </h3>
              <p className="text-sm text-gray-700">{texte}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ReglesDepouillement;
