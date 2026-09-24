import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";

import Login from "./components/Login/Login";
import SetPassword from "./components/SetPassword/SetPassword";

import ElectorHome from "./components/ElectorHome/ElectorHome";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Result from "./components/result/result";
import Waiting from "./components/Waiting/Waiting";
import AdminHome from "./components/AdminHome/AdminHome";
import MyAccount from "./components/MyAccount/MyAccount";
import Checkin from "./components/Checkin/Checkin";
import VoteChoice from "./components/VoteChoice/VoteChoice";
import OnlineVoteGuard from "./components/VoteChoice/OnlineVoteGuard";
import Isoloir from "./components/Isoloir/Isoloir";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages publiques, sans navbar/footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        {/* Écran du poste isoloir : plein écran, authentifié par la clé de l'isoloir (pas de compte) */}
        <Route path="/isoloir/:id" element={<Isoloir />} />

        {/* Toutes les autres pages exigent d'être connecté */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<ElectorHome />} />
            <Route path="/resultats" element={<Result />} />
            <Route path="/waiting" element={<Waiting />} />
            <Route path="/mon-compte" element={<MyAccount />} />
            {/* Vote : choix du mode (en ligne ou isoloir), puis la page correspondante */}
            <Route path="/vote" element={<VoteChoice />} />
            <Route path="/vote/en-ligne" element={<OnlineVoteGuard />} />
            <Route path="/vote/isoloir" element={<Checkin />} />

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
