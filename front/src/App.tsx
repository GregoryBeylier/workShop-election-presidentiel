import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout/Layout";

import Login from "./components/Login/Login";
import SetPassword from "./components/SetPassword/SetPassword";

import ElectorHome from "./components/ElectorHome/ElectorHome";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import Result from "./components/Result/Result";
import Waiting from "./components/Waiting/Waiting";

import MyAccount from "./components/MyAccount/MyAccount";
import Vote from "./components/Vote/Vote";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Pages sans navbar/footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Pages avec navbar/footer */}
        <Route element={<Layout />}>

          {/* Accueil électeur */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ElectorHome />
              </ProtectedRoute>
            }
          />

          {/* Résultats */}
          <Route
            path="/resultats"
            element={<Result />}
          />

          {/* Page d'attente */}
          <Route
            path="/waiting"
            element={<Waiting />}
          />

          {/* Mon compte */}
          <Route
            path="/mon-compte"
            element={
              <ProtectedRoute>
                <MyAccount />
              </ProtectedRoute>
            }
          />

          {/* Vote */}
          <Route
            path="/vote"
            element={
              <ProtectedRoute>
                <Vote />
              </ProtectedRoute>
            }
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;