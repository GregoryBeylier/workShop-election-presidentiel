import { Users, CheckCircle2, Hourglass, Percent } from "lucide-react";
import type { Stats } from "../../../api/admin";
import { pourcentage } from "../../../utils/format";
import CarteChiffre from "../../../components/ui/CarteChiffre";
import Panneau from "../../../components/ui/Panneau";
import ClassementDirect from "./ClassementDirect";
import DetailDuels from "./DetailDuels";

/** Onglet "Tableau de bord" : chiffres clés, classement et duels en direct. */
function OngletTableauDeBord({
  stats,
  misAJour,
}: {
  stats: Stats;
  misAJour: Date | null;
}) {
  const periode = stats.periode;
  const inscrits = periode?.nbInscrits ?? 0;
  const votants = periode?.nbVotants ?? 0;
  const participation = pourcentage(votants, inscrits);

  const direct = (
    <p className="flex items-center gap-2 text-xs text-gray-400">
      {periode?.etat === "OUVERT" && (
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-green" />
      )}
      {misAJour
        ? `Mis à jour à ${misAJour.toLocaleTimeString("fr-FR")}`
        : "Chargement…"}
    </p>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <CarteChiffre
          label="Inscrits"
          valeur={inscrits}
          detail="électeurs inscrits"
          icon={Users}
        />
        <CarteChiffre
          label="Votants"
          valeur={votants}
          detail="ont voté tous les duels"
          icon={CheckCircle2}
        />
        <CarteChiffre
          label="En cours"
          valeur={stats.nbEnCours}
          detail="ont commencé à voter"
          icon={Hourglass}
        />
        <CarteChiffre
          label="Participation"
          valeur={`${participation}%`}
          detail={`${stats.nbDuelsVotes} duels votés`}
          icon={Percent}
          accent
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panneau surTitre="En direct" titre="Classement" action={direct}>
          <ClassementDirect classement={stats.classement} />
        </Panneau>
        <Panneau surTitre="Détail" titre="Résultats par duel">
          <DetailDuels duels={stats.duels} />
        </Panneau>
      </div>
    </div>
  );
}

export default OngletTableauDeBord;
