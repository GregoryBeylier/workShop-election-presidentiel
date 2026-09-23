import { useState, type SubmitEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import {
  changerMotDePasse,
  doitChangerMotDePasse,
  getRole,
  homePath,
  logout,
} from "../../api/auth";
import logo from "../../assets/mydigitalschool-logo.png";
import { reglesMotDePasse } from "../../utils/motDePasse";
import ReglesMotDePasse from "./ReglesMotDePasse";

/**
 * Première connexion : l'utilisateur remplace le mot de passe provisoire
 * fixé par l'admin. Tant que ce n'est pas fait, toutes les autres pages
 * renvoient ici (et le back refuse les autres appels).
 */
function PageChangerMotDePasse() {
  const navigate = useNavigate();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordValid = reglesMotDePasse(password).valide;

  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passwordsMatch || !isPasswordValid) return;
    setErreur(null);
    setEnCours(true);
    try {
      const { admin } = await changerMotDePasse(password);
      navigate(homePath(admin ? "ADMIN" : "ELECTEUR"), { replace: true });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur, réessayez");
      setEnCours(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Pas de mot de passe provisoire à changer : connexion ou accueil selon le cas
  if (!doitChangerMotDePasse()) {
    const role = getRole();
    return <Navigate to={role ? homePath(role) : "/login"} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <img
        src={logo}
        alt="My Digital School"
        className="absolute top-6 left-6 h-10"
      />

      <div className="min-h-screen flex items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow p-6 sm:p-8 w-full max-w-sm flex flex-col gap-4"
        >
          <div>
            <h1 className="text-2xl font-heading font-bold text-brand-dark">
              Choisissez votre mot de passe
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Première connexion : remplacez le mot de passe provisoire donné
              par l'administrateur par un mot de passe personnel.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-gray-700">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
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
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {password.length > 0 && <ReglesMotDePasse motDePasse={password} />}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm text-gray-700">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
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

          <button
            type="submit"
            disabled={!passwordsMatch || !isPasswordValid || enCours}
            className="bg-brand-teal text-white rounded-md py-2 px-4 mt-2 font-medium hover:bg-brand-teal-dark transition-colors duration-300 disabled:opacity-50"
          >
            {enCours ? "Enregistrement…" : "Valider"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-brand-dark transition-colors duration-300"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}

export default PageChangerMotDePasse;
