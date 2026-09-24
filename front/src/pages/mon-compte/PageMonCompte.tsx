import { useEffect, useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, Lock, BadgeCheck, Eye, EyeOff } from "lucide-react";
import { changerMotDePasse, logout } from "../../api/auth";
import Avatar from "../../components/ui/Avatar";
import { initialesEmail } from "../../utils/format";
import { reglesMotDePasse } from "../../utils/motDePasse";
import ReglesMotDePasse from "../changer-mot-de-passe/ReglesMotDePasse";
import { getProfil, type Profil } from "../../api/election";

type Tab = "informations" | "securite";

/**
 * Page "Mon compte" de l'espace électeur.
 * Permet de consulter/modifier ses informations et son mot de passe.
 */
function PageMonCompte() {
  const navigate = useNavigate();

  const [profil, setProfil] = useState<Profil | null>(null);

  useEffect(() => {
    getProfil()
      .then(setProfil)
      .catch(() => {});
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>("informations");

  // Formulaire de changement de mot de passe (onglet Sécurité)
  const [modificationOuverte, setModificationOuverte] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [succes, setSucces] = useState(false);

  const isPasswordValid = reglesMotDePasse(password).valide;
  const passwordsMatch = password === confirmPassword;

  const fermerModification = () => {
    setModificationOuverte(false);
    setPassword("");
    setConfirmPassword("");
    setErreur(null);
  };

  const handleChangerMotDePasse = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passwordsMatch || !isPasswordValid) return;
    setErreur(null);
    setEnCours(true);
    try {
      await changerMotDePasse(password);
      setModificationOuverte(false);
      setPassword("");
      setConfirmPassword("");
      setSucces(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur, réessayez");
    } finally {
      setEnCours(false);
    }
  };

  const email = profil?.email ?? localStorage.getItem("email") ?? "";

  const tabs: { id: Tab; label: string; icon: typeof UserRound }[] = [
    { id: "informations", label: "Mes informations", icon: UserRound },
    { id: "securite", label: "Sécurité", icon: Lock },
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
            <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-5">
              <h2 className="font-semibold text-brand-dark">Sécurité</h2>

              {!modificationOuverte ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-brand-dark">
                      Mot de passe
                    </p>
                    {succes && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Mot de passe mis à jour.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSucces(false);
                      setModificationOuverte(true);
                    }}
                    className="self-start sm:self-auto border border-gray-300 text-gray-700 rounded-md px-4 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors duration-300"
                  >
                    Modifier
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleChangerMotDePasse}
                  className="flex flex-col gap-4 border-t border-gray-100 pt-5"
                >
                  <div className="flex flex-col gap-1">
                    <label htmlFor="nouveauMdp" className="text-sm text-gray-700">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        id="nouveauMdp"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="8 caractères minimum"
                        minLength={8}
                        required
                        className="border border-gray-300 rounded-md py-2 px-4 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <ReglesMotDePasse motDePasse={password} />
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="confirmerMdp"
                      className="text-sm text-gray-700"
                    >
                      Confirmer le mot de passe
                    </label>
                    <input
                      id="confirmerMdp"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="border border-gray-300 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                    {!passwordsMatch && confirmPassword.length > 0 && (
                      <p className="text-sm text-red-500">
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                  </div>

                  {erreur && <p className="text-sm text-red-500">{erreur}</p>}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={!passwordsMatch || !isPasswordValid || enCours}
                      className="bg-brand-teal text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-brand-teal-dark transition-colors duration-300 disabled:opacity-50"
                    >
                      {enCours ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    <button
                      type="button"
                      onClick={fermerModification}
                      className="border border-gray-300 text-gray-700 rounded-md px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-300"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageMonCompte;
