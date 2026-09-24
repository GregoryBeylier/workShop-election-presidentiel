import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Vote,
  BarChart3,
  UserRound,
  ChevronDown,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { getRole, homePath, logout } from "../../api/auth";
import Avatar from "../ui/Avatar";
import { initialesEmail } from "../../utils/format";
import logo from "../../assets/mydigitalschool-logo.png";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Un admin ne vote pas : il pilote le scrutin depuis /admin
  const links =
    getRole() === "ADMIN"
      ? [
          { to: "/admin", label: "Administration", icon: LayoutDashboard },
          { to: "/resultats", label: "Résultats", icon: BarChart3 },
        ]
      : [
          { to: "/", label: "Accueil", icon: Home },
          { to: "/vote", label: "Voter", icon: Vote },
          { to: "/resultats", label: "Résultats", icon: BarChart3 },
        ];

  // Les électeurs n'ont ni nom ni prénom : on affiche l'email (enregistré à la connexion)
  const email = localStorage.getItem("email") ?? "";
  const displayName = email.split("@")[0];

  // Barre du bas (mobile) : mêmes liens + accès au compte (déconnexion depuis la page)
  const liensMobile = [
    ...links,
    { to: "/mon-compte", label: "Compte", icon: UserRound },
  ];

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
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
          {/* Logo + nom de la plateforme */}
          <Link
            to={homePath(getRole())}
            className="flex items-center gap-3 shrink-0"
          >
            <img
              src={logo}
              alt="MyDigitalSchool"
              className="h-9 w-auto object-contain"
            />
            <div className="w-px h-8 bg-gray-200" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-heading font-bold text-brand-dark">
                Élection Présidentielle
              </span>
              <span className="text-xs text-gray-500 font-medium">
                2026 – 2027
              </span>
            </span>
          </Link>

          {/* Navigation principale (sur mobile : barre du bas) */}
          <div className="hidden md:flex items-center gap-1 bg-gray-50 rounded-full p-1">
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
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Profil connecté + menu déroulant */}
          <div className="relative shrink-0 hidden md:block" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition-colors duration-300 ${
                isMenuOpen || location.pathname === "/mon-compte"
                  ? "border-brand-teal bg-brand-teal/5"
                  : "border-transparent hover:border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Avatar
                texte={initialesEmail(email)}
                className="w-8 h-8 bg-brand-teal/10 text-brand-teal-dark text-sm font-semibold"
              />
              <span className="hidden lg:block text-sm font-medium text-gray-700">
                {displayName}
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
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {email}
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

      {/* Barre de navigation du bas, façon application (mobile uniquement) */}
      <nav
        aria-label="Navigation principale"
        className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur border-t border-gray-100 shadow-[0_-4px_16px_rgba(60,60,59,0.06)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="h-16 grid grid-flow-col auto-cols-fr">
          {liensMobile.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-1"
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-300 ${
                    isActive
                      ? "bg-brand-teal text-white shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <Icon size={18} strokeWidth={2.25} />
                </span>
                <span
                  className={`text-[11px] leading-none ${
                    isActive
                      ? "font-semibold text-brand-dark"
                      : "font-medium text-gray-500"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
