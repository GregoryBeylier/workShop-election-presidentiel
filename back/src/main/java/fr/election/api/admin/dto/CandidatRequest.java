package fr.election.api.admin.dto;

// email existant : l'électeur devient candidat (motDePasse ignoré) ;
// sinon son compte est créé avec ce mot de passe provisoire (la photo s'envoie ensuite, à part)
public record CandidatRequest(String email, String motDePasse, String prenom, String nom, String parti) {
}
