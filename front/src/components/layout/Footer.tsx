import { Link } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import logo from "../../assets/mydigitalschool-logo.png";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-gray-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
        {/* Colonne marque */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white rounded-lg px-2.5 py-1.5">
              <img
                src={logo}
                alt="MyDigitalSchool"
                className="h-5 w-auto object-contain"
              />
            </div>
            <span className="text-white font-heading font-bold text-sm leading-tight">
              Élection Présidentielle
              <br />
              2026 – 2027
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Plateforme de vote étudiante — projet réalisé par les élèves de
            MyDigitalSchool, basée sur un scrutin en duels successifs.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="text-white text-sm font-semibold mb-4">Navigation</h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link
                to="/"
                className="hover:text-brand-teal transition-colors duration-300"
              >
                Accueil
              </Link>
            </li>
            <li>
              <Link
                to="/vote"
                className="hover:text-brand-teal transition-colors duration-300"
              >
                Voter
              </Link>
            </li>
            <li>
              <Link
                to="/resultats"
                className="hover:text-brand-teal transition-colors duration-300"
              >
                Résultats
              </Link>
            </li>
          </ul>
        </div>

        {/* Informations légales */}
        <div>
          <h3 className="text-white text-sm font-semibold mb-4">
            Informations
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <a
                href="/mentions-legales"
                className="flex items-center gap-2 hover:text-brand-teal transition-colors duration-300"
              >
                <ShieldCheck size={14} />
                Mentions légales
              </a>
            </li>
            <li>
              <a
                href="/protection-donnees"
                className="flex items-center gap-2 hover:text-brand-teal transition-colors duration-300"
              >
                <ShieldCheck size={14} />
                Protection des données
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="flex items-center gap-2 hover:text-brand-teal transition-colors duration-300"
              >
                <Mail size={14} />
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 text-center sm:text-left">
          <span>
            © {year} MyDigitalSchool — projet étudiant, à but pédagogique
          </span>
          <span>Fait avec ♥ par les étudiants du Bachelor Dev Web</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
