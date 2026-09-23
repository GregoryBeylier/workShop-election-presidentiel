export interface Candidat {
  id: string;
  prenom: string;
  nom: string;
  parti: string;
  priorites: string[]; // 3 mots-clés du programme
  statut: "valide" | "en_attente";
  voix: number;
}

export interface Electeur {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  statutVote: "a_vote" | "en_cours" | "pas_vote";
  derniereActivite: string | null; // ex: "10 avril · 14:32", ou null si jamais voté
}

export const mockCandidats: Candidat[] = [
  {
    id: "1",
    prenom: "Alexandre",
    nom: "Moreau",
    parti: "Union Nouvelle",
    priorites: [
      "Emploi des jeunes",
      "Transition écologique",
      "Pouvoir d'achat",
    ],
    statut: "valide",
    voix: 18,
  },
  {
    id: "2",
    prenom: "Claire",
    nom: "Fontaine",
    parti: "Rassemblement Citoyen",
    priorites: ["Sécurité", "Santé publique", "Éducation"],
    statut: "valide",
    voix: 6,
  },
  {
    id: "3",
    prenom: "Yanis",
    nom: "Belkacem",
    parti: "Alliance Progressiste",
    priorites: ["Logement", "Justice sociale", "Numérique"],
    statut: "valide",
    voix: 4,
  },
  {
    id: "4",
    prenom: "Émilie",
    nom: "Rousseau",
    parti: "Parti Écologiste Populaire",
    priorites: ["Climat", "Agriculture locale", "Mobilité durable"],
    statut: "en_attente",
    voix: 3,
  },
];

export const mockElecteurs: Electeur[] = [
  {
    id: "1",
    prenom: "Lucas",
    nom: "Dupont",
    email: "lucas.dupont@exemple.fr",
    statutVote: "a_vote",
    derniereActivite: "10 avril · 14:32",
  },
  {
    id: "2",
    prenom: "Emma",
    nom: "Martin",
    email: "emma.martin@exemple.fr",
    statutVote: "en_cours",
    derniereActivite: "10 avril · 11:08",
  },
  {
    id: "3",
    prenom: "Karim",
    nom: "Benali",
    email: "karim.benali@exemple.fr",
    statutVote: "pas_vote",
    derniereActivite: null,
  },
  {
    id: "4",
    prenom: "Sofia",
    nom: "Lemoine",
    email: "sofia.lemoine@exemple.fr",
    statutVote: "a_vote",
    derniereActivite: "9 avril · 18:47",
  },
  {
    id: "5",
    prenom: "Théo",
    nom: "Garnier",
    email: "theo.garnier@exemple.fr",
    statutVote: "pas_vote",
    derniereActivite: null,
  },
];
