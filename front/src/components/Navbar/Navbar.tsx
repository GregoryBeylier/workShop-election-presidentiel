import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Vote,
  BarChart3,
  UserRound,
  ChevronDown,
  LogOut,
  QrCode,
} from "lucide-react";
import { getRole, logout } from "../../api/auth";
import logo from "../../assets/mydigitalschool-logo.png";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Accueil", icon: Home },
    { to: "/vote", label: "Voter", icon: Vote },
    { to: "/checkin", label: "Isoloir", icon: QrCode },
    { to: "/resultats", label: "Résultats", icon: BarChart3 },
  ];

  // TODO: remplacer par les vraies données du profil connecté
  const firstName = "Lucas";
  const lastNameInitial = "D.";

  // Menu déroulant "Mon compte / Déconnexion"
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ferme le menu si on clique en dehors
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Vide toute la session locale et renvoie sur la page de connexion
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
        {/* Logo + nom de la plateforme */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src={logo}
            alt="MyDigitalSchool"
            className="h-9 w-auto object-contain"
          />
          <div className="hidden sm:block w-px h-8 bg-gray-200" />
          <span className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-heading font-bold text-brand-dark">
              Élection Présidentielle
            </span>
            <span className="text-xs text-gray-500 font-medium">
              2026 – 2027
            </span>
          </span>
        </Link>

        {/* Navigation principale */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 text-sm font-medium px-3 sm:px-4 py-2 rounded-full transition-colors duration-300 ${
                  isActive
                    ? "bg-brand-teal text-white shadow-sm"
                    : "text-gray-500 hover:text-brand-dark hover:bg-white"
                }`}
              >
                <Icon size={16} strokeWidth={2.25} />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Profil connecté + menu déroulant */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition-colors duration-300 ${
              isMenuOpen || location.pathname === "/mon-compte"
                ? "border-brand-teal bg-brand-teal/5"
                : "border-transparent hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal-dark text-sm font-semibold flex items-center justify-center shrink-0">
              {firstName[0]}
              {lastNameInitial[0]}
            </div>
            <span className="hidden lg:block text-sm font-medium text-gray-700">
              {firstName} {lastNameInitial}
            </span>
            <ChevronDown
              size={14}
              className={`hidden lg:block text-gray-400 transition-transform duration-300 ${
                isMenuOpen ? "rotate-180" : ""
              }`}
              strokeWidth={2.5}
            />
            <UserRound size={18} className="lg:hidden text-gray-500" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {firstName} {lastNameInitial}
                </p>
                <p className="text-xs text-gray-500">
                  {getRole() === "ADMIN" ? "Administrateur" : "Électeur"}
                </p>
              </div>

              <Link
                to="/mon-compte"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-300"
              >
                <UserRound size={16} />
                Mon compte
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-300"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
