import { useState } from "react";
import { LayoutDashboard, Users, UserRoundCheck, Vote } from "lucide-react";
import { getCandidatsAdmin, getStats } from "../../api/admin";
import { usePolling } from "../../hooks/usePolling";
import Alerte from "../../components/ui/Alerte";
import Bandeau from "../../components/ui/Bandeau";
import Onglets, { type Onglet } from "../../components/ui/Onglets";
import PilotageScrutin from "./PilotageScrutin";
import OngletTableauDeBord from "./tableau-de-bord/OngletTableauDeBord";
import OngletInscriptions from "./inscriptions/OngletInscriptions";
import OngletCandidats from "./candidats/OngletCandidats";
import OngletIsoloirs from "./isoloirs/OngletIsoloirs";

type IdOnglet = "tableau" | "inscriptions" | "candidats" | "isoloirs";

const onglets: Onglet<IdOnglet>[] = [
  {
    id: "tableau",
    label: "Tableau de bord",
    labelCourt: "Suivi",
    icon: LayoutDashboard,
  },
  { id: "inscriptions", label: "Inscriptions", icon: Users },
  { id: "candidats", label: "Candidats", icon: UserRoundCheck },
  { id: "isoloirs", label: "Isoloirs", icon: Vote },
];

// Rafraîchissement des statistiques en temps réel
const INTERVALLE_STATS_MS = 5000;

/**
 * Espace administrateur : pilotage du scrutin (démarrer / clôturer),
 * statistiques en direct, gestion des électeurs, des candidats et des isoloirs.
 */
function PageAdmin() {
  const [onglet, setOnglet] = useState<IdOnglet>("tableau");
  const stats = usePolling(getStats, INTERVALLE_STATS_MS);
  const candidats = usePolling(getCandidatsAdmin);

  // Après une action (inscription, démarrage…), on recharge tout
  const rafraichir = () => {
    stats.recharger();
    candidats.recharger();
  };

  const periode = stats.data?.periode ?? null;
  const etat = periode?.etat ?? null;

  return (
    <>
      <Bandeau
        etiquette="ESPACE ADMINISTRATEUR"
        titre={
          <>
            Pilotez le scrutin,
            <br />
            en temps réel.
          </>
        }
        aside={
          <PilotageScrutin
            periode={periode}
            nbCandidats={candidats.data?.length ?? 0}
            onChange={rafraichir}
          />
        }
      >
        <p className="text-gray-300">
          Inscrivez les électeurs et les candidats, ouvrez puis clôturez le vote
          et suivez la participation en direct.
        </p>
      </Bandeau>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
        <Onglets onglets={onglets} actif={onglet} onChange={setOnglet} />

        {stats.erreur && (
          <Alerte message={{ type: "erreur", texte: stats.erreur }} />
        )}

        {onglet === "tableau" &&
          (stats.data ? (
            <OngletTableauDeBord stats={stats.data} misAJour={stats.misAJour} />
          ) : (
            !stats.erreur && (
              <p className="text-center text-gray-500">
                Chargement des statistiques…
              </p>
            )
          ))}
        {onglet === "inscriptions" && (
          <OngletInscriptions etat={etat} onChange={rafraichir} />
        )}
        {onglet === "candidats" && (
          <OngletCandidats
            candidats={candidats.data ?? []}
            etat={etat}
            onChange={rafraichir}
          />
        )}
        {onglet === "isoloirs" && <OngletIsoloirs />}
      </div>
    </>
  );
}

export default PageAdmin;
