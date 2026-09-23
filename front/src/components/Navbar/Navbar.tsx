import { Link, useLocation } from "react-router-dom";
import { Home, Vote, BarChart3, UserRound, ChevronDown } from "lucide-react";
import logo from "../../assets/mydigitalschool-logo.png";

function Navbar() {
  const location = useLocation();

  const links = [
    { to: "/", label: "Accueil", icon: Home },
    { to: "/vote", label: "Voter", icon: Vote },
    { to: "/resultats", label: "Résultats", icon: BarChart3 },
  ];

  // TODO: remplacer par les vraies données du profil connecté
  const firstName = "Lucas";
  const lastNameInitial = "D.";

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between gap-6">
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
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-colors duration-300 ${
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

        {/* Profil connecté */}
        <Link
          to="/mon-compte"
          className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition-colors duration-300 shrink-0 ${
            location.pathname === "/mon-compte"
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
            className="hidden lg:block text-gray-400"
            strokeWidth={2.5}
          />
          <UserRound size={18} className="lg:hidden text-gray-500" />
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
