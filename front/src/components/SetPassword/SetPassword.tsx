import { useState, type SubmitEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from "../../assets/mydigitalschool-logo.png";

/**
 * Page de création de mot de passe, accessible via le lien reçu par email
 * après que l'admin a créé le compte de l'électeur.
 */
function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordsMatch = password === confirmPassword;

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passwordsMatch) return;
    // TODO: brancher l'appel API réel (envoyer le mot de passe + le token du lien email)
    console.log({ password });
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <img
        src={logo}
        alt="My Digital School"
        className="absolute top-6 left-6 h-10"
      />

      <div className="min-h-screen flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow p-8 w-96 flex flex-col gap-4"
        >
          <h1 className="text-2xl font-semibold">Créer votre mot de passe</h1>

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
                className="border border-gray-300 rounded-md py-2 px-4 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="border border-gray-300 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!passwordsMatch && confirmPassword.length > 0 && (
              <p className="text-sm text-red-500">
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!passwordsMatch}
            className="bg-[#35C4D6] text-white rounded-md py-2 px-4 mt-2 font-medium hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Valider
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetPassword;
