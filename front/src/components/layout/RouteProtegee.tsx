import { Navigate, Outlet } from "react-router-dom";
import { doitChangerMotDePasse, getRole, type Role } from "../../api/auth";

/**
 * Garde d'un groupe de routes.
 * - pas connecté (token absent, illisible ou expiré) => /login
 * - mot de passe provisoire pas encore changé => /changer-mot-de-passe
 * - connecté mais sans le rôle demandé => accueil
 * Sans `role`, il suffit d'être connecté.
 */
function RouteProtegee({ role }: { role?: Role }) {
  const userRole = getRole();

  if (doitChangerMotDePasse()) {
    return <Navigate to="/changer-mot-de-passe" replace />;
  }
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RouteProtegee;
