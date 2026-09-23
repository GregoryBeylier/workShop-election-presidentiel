import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Login from "./components/Login/Login";
import SetPassword from "./components/SetPassword/SetPassword";
import ElectorHome from "./components/ElectorHome/ElectorHome";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Result from "./components/result/result";
import MyAccount from "./components/MyAccount/MyAccount";
import Vote from "./components/Vote/Vote";

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
          <Route
            path="/mon-compte"
            element={
              <ProtectedRoute>
                <MyAccount />
              </ProtectedRoute>
            }
          />
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
