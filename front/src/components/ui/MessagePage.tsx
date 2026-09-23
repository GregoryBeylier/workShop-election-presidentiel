/** Message centré en pleine page : chargement, liste vide ou erreur. */
function MessagePage({
  texte,
  erreur = false,
}: {
  texte: string;
  erreur?: boolean;
}) {
  return (
    <p
      role={erreur ? "alert" : "status"}
      className={`mx-auto max-w-4xl px-4 py-10 text-center sm:px-8 ${
        erreur ? "text-red-600" : "text-gray-500"
      }`}
    >
      {texte}
    </p>
  );
}

export default MessagePage;
