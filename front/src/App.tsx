import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Login from "./components/Login/Login";
import SetPassword from "./components/SetPassword/SetPassword";
import ElectorHome from "./components/ElectorHome/ElectorHome";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Result from "./components/result/result";
import AdminHome from "./components/AdminHome/AdminHome";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages publiques, sans navbar/footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Toutes les autres pages exigent d'être connecté */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<ElectorHome />} />
            <Route path="/resultats" element={<Result />} />
            {/* on ajoutera /vote, /mon-compte ici plus tard */}

            {/* Pages réservées aux admins (électeur => renvoyé à l'accueil) */}
            <Route element={<ProtectedRoute role="ADMIN" />}>
              <Route path="/admin" element={<AdminHome />} />
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
