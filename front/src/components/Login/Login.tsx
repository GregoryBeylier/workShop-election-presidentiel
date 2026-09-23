import { useState, type SubmitEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from "../../assets/mydigitalschool-logo.png";

/**
 * Formulaire de connexion des électeurs.
 * Envoie les identifiants à l'API pour authentification.
 */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Contrôle l'affichage en clair du mot de passe (masqué par défaut)
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TODO: remplacer par le vrai appel API une fois le back prêt
    // const res = await fetch("https://ton-api.com/login", { ... });

    // Simulation en attendant :
    const fakeToken = "fake-token-123";
    localStorage.setItem("token", fakeToken);
    console.log("Connexion simulée réussie, token stocké");
  };
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
          <h1 className="text-2xl font-heading font-bold text-brand-dark">
            Connexion
          </h1>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm text-gray-700">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-300 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
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
          </div>

          <a
            href="/mot-de-passe-oublie"
            className="text-sm text-gray-700 hover:underline"
          >
            Mot de passe oublié ?
          </a>

          <button
            type="submit"
            className="bg-brand-teal text-white rounded-md py-2 px-4 mt-2 font-medium hover:bg-brand-teal-dark transition-colors duration-300"
          >
            Connexion
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
