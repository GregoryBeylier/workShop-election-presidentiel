import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login/Login";
import SetPassword from "./components/SetPassword/SetPassword";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
