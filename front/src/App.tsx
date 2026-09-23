import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Login from "./components/Login/Login";
import SetPassword from "./components/SetPassword/SetPassword";
import ElectorHome from "./components/ElectorHome/ElectorHome";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Result from "./components/Result/Result";
import Waiting from "./components/Waiting/Waiting";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages sans navbar/footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Pages avec navbar/footer, réservées aux utilisateurs connectés */}
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ElectorHome />
              </ProtectedRoute>
            }
          />
          <Route path="/resultats" element={<Result />} />
          <Route path="/waiting" element={<Waiting />} />
          {/* on ajoutera /vote, /mon-compte ici plus tard */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
