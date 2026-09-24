/** Les 3 étapes du vote par duels. */
function CommentCaMarche({ nbDuels }: { nbDuels: number }) {
  const etapes = [
    "Deux candidats vous sont proposés côte à côte. Vous choisissez celui que vous préférez.",
    "Chaque duel donne 1 point au candidat choisi (0,5 chacun en cas d'égalité). Les scores restent masqués.",
    `Après ${nbDuels} duels, votre vote est enregistré et anonymisé définitivement.`,
  ];

  return (
    <section className="px-4 sm:px-8 py-10 sm:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
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
          {etapes.map((texte, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-6">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal-dark font-semibold mb-4">
                {i + 1}
              </span>
              <p className="text-sm text-gray-700">{texte}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CommentCaMarche;
