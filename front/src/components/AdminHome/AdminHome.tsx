import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/auth";

/**
 * Page d'accueil de l'espace admin (provisoire, pour tester la garde de rôle).
 */
function AdminHome() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <section className="max-w-6xl mx-auto px-8 py-16">
      <h1 className="font-heading text-3xl font-bold text-brand-dark">
        Hello World
      </h1>
      <p className="text-gray-500 mt-2">
        Si vous voyez cette page, vous êtes connecté en tant qu'admin.
      </p>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-8 inline-flex items-center gap-2 bg-brand-teal text-white rounded-md py-2 px-4 font-medium hover:bg-brand-teal-dark transition-colors duration-300"
      >
        <LogOut size={18} />
        Déconnexion
      </button>
    </section>
  );
}

export default AdminHome;
