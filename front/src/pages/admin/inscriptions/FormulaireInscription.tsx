import { useState, type SubmitEvent } from "react";
import { UserPlus } from "lucide-react";
import { ajouterCandidat, creerUtilisateur } from "../../../api/admin";
import type { EtatScrutin } from "../../../api/election";
import Champ from "../../../components/ui/Champ";
import ChampMotDePasse from "../../../components/ui/ChampMotDePasse";
import type { IdentifiantsProvisoires } from "./Identifiants";
import ChoixRole, { type Role } from "./ChoixRole";
import Bouton from "../../../components/ui/Bouton";
import Alerte from "../../../components/ui/Alerte";

const vide = { email: "", motDePasse: "", prenom: "", nom: "", parti: "" };

/**
 * Formulaire unique d'inscription : l'admin choisit si la personne est simple
 * électeur ou aussi candidat (prénom, nom et parti en plus). Un candidat
 * vote aussi. L'admin fixe un mot de passe provisoire, que la personne
 * changera à sa première connexion.
 */
function FormulaireInscription({
  etat,
  onInscrit,
}: {
  etat: EtatScrutin | null;
  // identifiants null : le compte existait déjà (électeur devenu candidat)
  onInscrit: (
    identifiants: IdentifiantsProvisoires | null,
    message: string,
  ) => void;
}) {
  const [role, setRole] = useState<Role>("electeur");
  const [form, setForm] = useState(vide);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Les candidats ne peuvent être ajoutés qu'avant l'ouverture du vote
  const candidatPossible = etat === "PREPARATION";
  const estCandidat = role === "candidat" && candidatPossible;

  const champ = (cle: keyof typeof vide) => ({
    value: form[cle],
    onChange: (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [cle]: e.target.value })),
  });
  

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const email = form.email.trim().toLowerCase();
      const identifiants = { email, motDePasse: form.motDePasse };
      if (estCandidat) {
        const { element, compteCree } = await ajouterCandidat(form);
        const nom = `${element.candidat.prenom} ${element.candidat.nom}`;
        onInscrit(
          compteCree ? identifiants : null,
          compteCree
            ? `${nom} est inscrit comme candidat.`
            : `${nom} est maintenant candidat. Son compte existait déjà : son mot de passe ne change pas.`,
        );
      } else {
        await creerUtilisateur({ email, motDePasse: form.motDePasse });
        onInscrit(identifiants, `${email} est inscrit comme électeur.`);
      }
      setForm(vide);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <ChoixRole
        role={estCandidat ? "candidat" : "electeur"}
        candidatPossible={candidatPossible}
        etat={etat}
        onChange={setRole}
      />

      {/* Identité du candidat, affichée aux électeurs */}
      {estCandidat && (
        <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
          <Champ
            label="Prénom"
            id="insc-prenom"
            required
            maxLength={100}
            {...champ("prenom")}
          />
          <Champ
            label="Nom"
            id="insc-nom"
            required
            maxLength={100}
            {...champ("nom")}
          />
          <div className="sm:col-span-2">
            <Champ
              label="Parti"
              id="insc-parti"
              required
              maxLength={100}
              aide="Affiché sous le nom du candidat sur la page de vote et dans les résultats."
              {...champ("parti")}
            />
          </div>
        </div>
      )}

      {/* Compte : l'email est l'identifiant unique (école ou personne extérieure) */}
      <Champ
        label="Adresse mail"
        id="insc-email"
        type="email"
        required
        maxLength={255}
        placeholder="prenom.nom@exemple.fr"
        aide={
          estCandidat
            ? "Si cette adresse appartient déjà à un électeur, il devient candidat (son mot de passe ne change pas). Sinon son compte est créé."
            : "Adresse personnelle ou de l'école : elle sert d'identifiant de connexion. Une adresse ne peut avoir qu'un seul compte."
        }
        {...champ("email")}
      />

      <ChampMotDePasse
        id="insc-mdp"
        value={form.motDePasse}
        onChange={(motDePasse) => setForm((f) => ({ ...f, motDePasse }))}
      />

      {erreur && <Alerte message={{ type: "erreur", texte: erreur }} />}

      <Bouton type="submit" disabled={enCours} className="self-start">
        <UserPlus size={16} />
        {enCours
          ? "Inscription…"
          : estCandidat
            ? "Inscrire le candidat"
            : "Inscrire l'électeur"}
      </Bouton>
    </form>
  );
}

export default FormulaireInscription;
