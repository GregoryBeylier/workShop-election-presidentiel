/**
 * Politique de protection des données personnelles.
 * Contenu pédagogique inspiré du RGPD, adapté au périmètre réel du projet
 * (email, mot de passe, votes) — à faire relire/compléter si le projet
 * sort un jour du cadre scolaire.
 */
function PageProtectionDonnees() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-brand-dark mb-2">
        Protection des données
      </h1>
      <p className="text-sm text-gray-500 mb-10">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Responsable de traitement
          </h2>
          <p>
            Dans le cadre de ce projet étudiant MyDigitalSchool, l'équipe
            projet agit comme responsable des données traitées par cette
            plateforme. Aucune donnée n'est cédée, vendue ou transmise à un
            tiers.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Données collectées
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Adresse email (identifiant de connexion)</li>
            <li>Mot de passe (stocké chiffré, jamais en clair)</li>
            <li>
              Votes exprimés (rattachés à votre compte le temps du scrutin,
              uniquement pour vous permettre de reprendre où vous en étiez
              et d'éviter un double vote sur un même duel — ce lien n'est
              jamais affiché ni utilisé pour savoir qui a voté pour qui)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Finalité
          </h2>
          <p>
            Ces données sont utilisées uniquement pour permettre la
            connexion, le suivi de votre progression de vote et le calcul du
            classement final. Le vote reste anonyme dans les résultats
            publiés : seul le total de points par candidat est visible, pas
            le détail de qui a voté pour qui.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Durée de conservation
          </h2>
          <p>
            Les données sont conservées le temps du projet pédagogique. Elles
            sont supprimées ou anonymisées à la demande, notamment via la
            suppression de compte disponible côté administration.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Vos droits
          </h2>
          <p>
            Conformément au RGPD, vous disposez d'un droit d'accès, de
            rectification et de suppression de vos données. Pour l'exercer,
            contactez l'équipe projet via la page{" "}
            <a
              href="/contact"
              className="text-brand-teal-dark hover:underline"
            >
              Contact
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-brand-dark mb-2">
            Sécurité
          </h2>
          <p>
            Les mots de passe sont chiffrés (BCrypt) et les échanges avec le
            serveur sont authentifiés par jeton (JWT). Aucune donnée
            sensible n'est stockée en clair.
          </p>
        </section>
      </div>

      <p className="mt-12 text-center text-xs text-gray-300">
        Si tu as lu jusqu'ici : bravo pour ta curiosité, et sache qu'on a mis
        tout notre cœur (et pas mal de cafés ☕) dans ce projet. Merci de nous
        lire ! — L'équipe dev
      </p>
    </div>
  );
}

export default PageProtectionDonnees;
