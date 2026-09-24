/**
 * Mentions légales du projet étudiant.
 * Contenu pédagogique adapté à un projet de fin d'études (pas une entreprise réelle) :
 * à ajuster si le projet est un jour déployé en dehors du cadre scolaire.
 */
function PageMentionsLegales() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-brand-dark mb-2">
        Mentions légales
      </h1>
      <p className="text-sm text-gray-500 mb-10">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Éditeur du site
          </h2>
          <p>
            Cette plateforme de vote est un projet réalisé dans le cadre du
            Bachelor Développeur Web de <strong>MyDigitalSchool</strong>, par
            un groupe d'étudiants. Il s'agit d'un projet pédagogique, sans
            vocation commerciale, non destiné à organiser une élection
            officielle.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Hébergement
          </h2>
          <p>
            L'application (front-end et back-end) est hébergée dans le cadre
            du projet scolaire. La base de données est hébergée par{" "}
            <strong>Neon</strong> (PostgreSQL managé).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Propriété intellectuelle
          </h2>
          <p>
            Le code source, les visuels et les textes de ce site sont produits
            par les étudiants du groupe projet, dans le respect de la charte
            graphique MyDigitalSchool. Toute reproduction en dehors du cadre
            pédagogique n'est pas autorisée.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Responsabilité
          </h2>
          <p>
            Ce site étant un exercice pédagogique, les résultats de vote
            n'ont aucune valeur officielle ou légale. L'équipe projet ne
            saurait être tenue responsable d'une utilisation détournée de la
            plateforme.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Contact
          </h2>
          <p>
            Pour toute question relative à ce site, une page{" "}
            <a
              href="/contact"
              className="text-brand-teal-dark hover:underline"
            >
              Contact
            </a>{" "}
            est disponible.
          </p>
        </section>
      </div>
    </div>
  );
}

export default PageMentionsLegales;
