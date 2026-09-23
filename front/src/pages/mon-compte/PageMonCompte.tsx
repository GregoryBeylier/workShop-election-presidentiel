import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, Lock, Bell, CheckSquare, BadgeCheck } from "lucide-react";
import { logout } from "../../api/auth";
import Avatar from "../../components/ui/Avatar";
import { initialesEmail } from "../../utils/format";
import {
  getMonVote,
  getProfil,
  type MonVote,
  type Profil,
} from "../../api/election";

type Tab = "informations" | "securite" | "notifications" | "vote";

/**
 * Page "Mon compte" de l'espace électeur.
 * Affiche ses informations (email, rôle), son statut de vote
 * et ses préférences de notifications.
 */
function PageMonCompte() {
  const navigate = useNavigate();

  const [profil, setProfil] = useState<Profil | null>(null);
  const [monVote, setMonVote] = useState<MonVote | null>(null);

  useEffect(() => {
    getProfil()
      .then(setProfil)
      .catch(() => {});
    getMonVote()
      .then(setMonVote)
      .catch(() => {});
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>("informations");
  const [emailAlerts, setEmailAlerts] = useState(true);

  const email = profil?.email ?? localStorage.getItem("email") ?? "";
  const duelsFaits = monVote?.duels.filter((d) => d.fait).length ?? 0;
  const duelsTotal = monVote?.duels.length ?? 0;

  const tabs: { id: Tab; label: string; icon: typeof UserRound }[] = [
    { id: "informations", label: "Mes informations", icon: UserRound },
    { id: "securite", label: "Sécurité", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "vote", label: "Mon vote", icon: CheckSquare },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      {/* En-tête profil */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar
          texte={initialesEmail(email)}
          className="w-14 h-14 bg-brand-dark text-white text-lg font-semibold"
        />
        <div>
          <h1 className="font-heading text-xl font-bold text-brand-dark break-all">
            {email}
          </h1>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1">
            <BadgeCheck size={12} />
            IDENTITÉ VÉRIFIÉE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Menu latéral */}
        <nav className="bg-white rounded-xl shadow p-2 flex flex-col gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 text-sm font-medium px-3 py-2.5 rounded-lg text-left transition-colors duration-300 ${
                activeTab === id
                  ? "bg-brand-teal/10 text-brand-teal-dark"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Contenu */}
        <div className="flex flex-col gap-6">
          {activeTab === "informations" && (
            <>
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-brand-dark mb-4">
                  Mes informations
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium text-gray-500">
                      Adresse mail
                    </dt>
                    <dd className="border border-gray-200 bg-gray-50 rounded-md py-2 px-3 break-all">
                      {email}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium text-gray-500">Rôle</dt>
                    <dd className="border border-gray-200 bg-gray-50 rounded-md py-2 px-3">
                      {!profil
                        ? "…"
                        : profil.admin
                          ? "Administrateur"
                          : "Électeur"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-brand-dark">
                      Mot de passe
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("securite")}
                    className="self-start sm:self-auto border border-gray-300 text-gray-700 rounded-md px-4 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors duration-300"
                  >
                    Modifier
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 pt-5">
                  <div>
                    <p className="text-sm font-medium text-brand-dark">
                      Alertes par e-mail
                    </p>
                    <p className="text-xs text-gray-500">
                      Ouverture et clôture du scrutin, publication des résultats
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailAlerts}
                    onClick={() => setEmailAlerts((v) => !v)}
                    className={`w-11 h-6 rounded-full transition-colors duration-300 relative shrink-0 ${
                      emailAlerts ? "bg-brand-teal" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                        emailAlerts ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="self-start border border-red-200 text-red-600 rounded-md px-5 py-2 text-sm font-medium hover:bg-red-50 transition-colors duration-300"
              >
                Se déconnecter
              </button>
            </>
          )}

          {activeTab === "securite" && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold text-brand-dark mb-2">Sécurité</h2>
              <p className="text-sm text-gray-500">
                Gestion du mot de passe — à venir.
              </p>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold text-brand-dark mb-2">
                Notifications
              </h2>
              <p className="text-sm text-gray-500">
                Préférences de notifications détaillées — à venir.
              </p>
            </div>
          )}

          {activeTab === "vote" && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold text-brand-dark mb-2">Mon vote</h2>
              <p className="text-sm text-gray-500">
                Statut :{" "}
                {!monVote
                  ? "…"
                  : !monVote.inscrit
                    ? "vous n'êtes pas inscrit à ce scrutin"
                    : duelsTotal > 0 && duelsFaits === duelsTotal
                      ? "vous avez déjà voté"
                      : duelsFaits > 0
                        ? `vote en cours (${duelsFaits} duels sur ${duelsTotal})`
                        : "vous n'avez pas encore voté"}
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageMonCompte;
