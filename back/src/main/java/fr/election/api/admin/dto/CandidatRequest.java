package fr.election.api.admin.dto;

// email existant : l'électeur devient candidat (motDePasse ignoré) ;
// sinon son compte est créé avec ce mot de passe provisoire ; photo : URL facultative
public record CandidatRequest(String email, String motDePasse, String prenom, String nom, String parti,
		String photo) {
}
