import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/layout/Layout";
import RouteProtegee from "./components/layout/RouteProtegee";

import PageConnexion from "./pages/connexion/PageConnexion";
import PageChangerMotDePasse from "./pages/changer-mot-de-passe/PageChangerMotDePasse";
import PageAccueil from "./pages/accueil/PageAccueil";
import PageVote from "./pages/vote/PageVote";
import PageAttente from "./pages/attente/PageAttente";
import PageResultats from "./pages/resultats/PageResultats";
import PageMonCompte from "./pages/mon-compte/PageMonCompte";
import PageAdmin from "./pages/admin/PageAdmin";
import PageMentionsLegales from "./pages/mentions-legales/PageMentionsLegales";
import PageProtectionDonnees from "./pages/protection-donnees/PageProtectionDonnees";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages publiques, sans navbar/footer */}
        <Route path="/login" element={<PageConnexion />} />
        <Route
          path="/changer-mot-de-passe"
          element={<PageChangerMotDePasse />}
        />

        {/* Toutes les autres pages exigent d'être connecté */}
        <Route element={<RouteProtegee />}>
          <Route element={<Layout />}>
            <Route path="/" element={<PageAccueil />} />
            <Route path="/resultats" element={<PageResultats />} />
            <Route path="/waiting" element={<PageAttente />} />
            <Route path="/mon-compte" element={<PageMonCompte />} />
            <Route path="/vote" element={<PageVote />} />
            <Route
              path="/mentions-legales"
              element={<PageMentionsLegales />}
            />
            <Route
              path="/protection-donnees"
              element={<PageProtectionDonnees />}
            />

            {/* Pages réservées aux admins (électeur => renvoyé à l'accueil) */}
            <Route element={<RouteProtegee role="ADMIN" />}>
              <Route path="/admin" element={<PageAdmin />} />
            </Route>
          </Route>
        </Route>

        {/* URL inconnue : accueil, qui renvoie lui-même vers /login si besoin */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
