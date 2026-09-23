/**
 * Page d'accueil de l'espace électeur.
 * Affiche la progression du vote et explique le fonctionnement.
 */
function ElectorHome() {
  // TODO: remplacer par les vraies données venant de l'API (profil + progression)
  const dutiesDone = 4;
  const dutiesTotal = 6;
  const closingDate = "12 avril";

  return (
    <>
      {/* Bandeau hero */}
      <section className="bg-gradient-to-br from-brand-dark to-brand-teal-dark text-white px-8 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-brand-teal text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
              SCRUTIN OUVERT JUSQU'AU {closingDate.toUpperCase()}
            </span>
            <h1 className="font-heading text-4xl font-bold leading-tight mb-4">
              Votre voix,
              <br />
              duel après duel.
            </h1>
            <p className="text-gray-300 mb-6">
              Comparez les candidats deux par deux plutôt que d'en cocher un
              seul. Six duels suffisent pour exprimer votre préférence.
            </p>
            <div className="flex gap-4">
              <a
                href="/vote"
                className="bg-white text-brand-dark rounded-md px-5 py-3 font-medium hover:bg-gray-100 transition-colors duration-300 inline-flex items-center gap-2"
              >
                Continuer à voter →
              </a>
              <a
                href="/resultats"
                className="border border-white text-white rounded-md px-5 py-3 font-medium hover:bg-white/10 transition-colors duration-300"
              >
                Voir les résultats
              </a>
            </div>
          </div>

          <div className="bg-white text-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Votre progression</span>
              <span className="text-sm text-gray-500">
                Clôture le {closingDate}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-brand-teal-dark">
                {dutiesDone}
              </span>
              <span className="text-gray-600">duels sur {dutiesTotal}</span>
            </div>

            <div className="grid grid-cols-6 gap-1 mb-4">
              {Array.from({ length: dutiesTotal }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full ${
                    i < dutiesDone ? "bg-brand-teal" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Plus que {dutiesTotal - dutiesDone} duels avant l'enregistrement
              définitif de votre vote.
            </p>

            <a
              href="/vote"
              className="block text-center bg-brand-teal text-white rounded-md py-3 font-medium hover:bg-brand-teal-dark transition-colors duration-300"
            >
              Reprendre où j'en étais
            </a>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-dark">
              Comment ça marche
            </h2>
            <a
              href="/depouillement"
              className="text-sm text-brand-teal-dark underline hover:no-underline"
            >
              Tout savoir sur le dépouillement
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal-dark font-semibold mb-4">
                1
              </span>
              <p className="text-sm text-gray-700">
                Deux candidats vous sont proposés côte à côte. Vous choisissez
                celui que vous préférez.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal-dark font-semibold mb-4">
                2
              </span>
              <p className="text-sm text-gray-700">
                Chaque duel donne une voix au candidat choisi. Les scores
                restent masqués.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal-dark font-semibold mb-4">
                3
              </span>
              <p className="text-sm text-gray-700">
                Après 6 duels, votre vote est enregistré et anonymisé
                définitivement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Univers MyDigitalSchool */}
      <section className="px-8 py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-brand-dark mb-2">
            Un projet porté par les 3 univers MyDigitalSchool
          </h2>
          <p className="text-sm text-gray-600 mb-8 max-w-2xl">
            Cette plateforme est développée par des étudiants du Bachelor
            Développeur Web — l'un des trois grands univers de formation de
            l'école.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { word: "Tech", color: "#2EC7D3", darkText: false },
              { word: "Design", color: "#662483", darkText: false },
              { word: "Market", color: "#E71D73", darkText: false },
            ].map(({ word, color }) => (
              <div
                key={word}
                className="relative aspect-[4/5] rounded-xl overflow-hidden bg-brand-dark shadow"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(160deg, ${color} 0%, ${color}cc 55%, #3C3C3B 100%)`,
                    clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)",
                  }}
                />
                <div className="relative z-10 h-full flex items-end p-6">
                  <p className="text-white text-2xl sm:text-3xl leading-none">
                    We{" "}
                    <span className="font-heading font-extrabold italic block text-3xl sm:text-4xl">
                      {word}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default ElectorHome;
