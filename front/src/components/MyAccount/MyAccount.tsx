import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, Lock, Bell, CheckSquare, BadgeCheck } from "lucide-react";
import { mockElecteurs } from "../../data/mockData";

type Tab = "informations" | "securite" | "notifications" | "vote";

/**
 * Page "Mon compte" de l'espace électeur.
 * Permet de consulter/modifier ses informations, son mot de passe
 * et ses préférences de notifications.
 */
function MyAccount() {
  const navigate = useNavigate();

  // TODO: remplacer par les vraies données du profil connecté (API)
  const currentUser = mockElecteurs[0]; // Lucas Dupont

  const [activeTab, setActiveTab] = useState<Tab>("informations");
  const [prenom, setPrenom] = useState(currentUser.prenom);
  const [nom, setNom] = useState(currentUser.nom);
  const [email, setEmail] = useState(currentUser.email);
  const [commune, setCommune] = useState("Saint-Martin-d'Hères");
  const [emailAlerts, setEmailAlerts] = useState(true);

  const tabs: { id: Tab; label: string; icon: typeof UserRound }[] = [
    { id: "informations", label: "Mes informations", icon: UserRound },
    { id: "securite", label: "Sécurité", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "vote", label: "Mon vote", icon: CheckSquare },
  ];

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: brancher l'appel API de mise à jour du profil
    console.log({ prenom, nom, email, commune });
  };

  const handleCancel = () => {
    setPrenom(currentUser.prenom);
    setNom(currentUser.nom);
    setEmail(currentUser.email);
    setCommune("Saint-Martin-d'Hères");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      {/* En-tête profil */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-brand-dark text-white text-lg font-semibold flex items-center justify-center shrink-0">
          {currentUser.prenom[0]}
          {currentUser.nom[0]}
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold text-brand-dark">
            {currentUser.prenom} {currentUser.nom}
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
                <form
                  onSubmit={handleSave}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                      Prénom
                    </label>
                    <input
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                      Nom
                    </label>
                    <input
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                      Adresse mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                      Commune d'inscription
                    </label>
                    <input
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>

                  <div className="sm:col-span-2 flex gap-3 mt-2">
                    <button
                      type="submit"
                      className="bg-brand-teal text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-brand-teal-dark transition-colors duration-300"
                    >
                      Enregistrer les modifications
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="border border-gray-300 text-gray-700 rounded-md px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-300"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-brand-dark">
                      Mot de passe
                    </p>
                    <p className="text-xs text-gray-500">
                      Modifié il y a 3 mois
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
                {currentUser.statutVote === "a_vote"
                  ? "vous avez déjà voté"
                  : currentUser.statutVote === "en_cours"
                    ? "vote en cours"
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

export default MyAccount;
