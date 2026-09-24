// Couleurs secondaires de la charte associées à chaque univers
const UNIVERS = [
  { word: "Tech", color: "#2EC7D3" },
  { word: "Design", color: "#662483" },
  { word: "Market", color: "#E71D73" },
];

/** Présentation des 3 univers de formation MyDigitalSchool (Tech, Design, Market). */
function UniversMDS() {
  return (
    <section className="px-4 sm:px-8 py-10 sm:py-12 bg-gray-50">
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
          {UNIVERS.map(({ word, color }) => (
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
  );
}

export default UniversMDS;
