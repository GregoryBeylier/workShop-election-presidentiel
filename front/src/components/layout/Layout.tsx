import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Structure commune (navbar + footer) pour toutes les pages
 * sauf la connexion et le changement de mot de passe.
 */
function Layout() {
  return (
    // Sur mobile, marge basse pour la barre de navigation fixe (h-16 + zone du geste)
    <div className="min-h-screen bg-gray-50 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
