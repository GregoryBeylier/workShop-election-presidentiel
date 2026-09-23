import { Navigate, Outlet } from "react-router-dom";
import { getRole, type Role } from "../../api/auth";

/**
 * Garde d'un groupe de routes.
 * - pas connecté (token absent, illisible ou expiré) => /login
 * - connecté mais sans le rôle demandé => accueil
 * Sans `role`, il suffit d'être connecté.
 */
function ProtectedRoute({ role }: { role?: Role }) {
  const userRole = getRole();

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
