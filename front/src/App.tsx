import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login/Login";
import SetPassword from "./components/SetPassword/SetPassword";
import Result from "./components/Result/Result";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/Result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
