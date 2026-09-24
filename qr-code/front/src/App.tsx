import { BrowserRouter, Routes, Route } from "react-router-dom";
import Isoloir from "./pages/Isoloir";
import Votant from "./pages/Votant";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Écran de la tablette fixée dans l'isoloir */}
        <Route path="/isoloir/:id" element={<Isoloir />} />
        {/* Appli du votant (statut + scan) */}
        <Route path="/" element={<Votant />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
