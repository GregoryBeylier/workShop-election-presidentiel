import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getValidToken } from "../../api/auth";

function ProtectedRoute({ children }: { children: ReactNode }) {
  // Token absent, illisible ou expiré : retour à la connexion
  if (!getValidToken()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
