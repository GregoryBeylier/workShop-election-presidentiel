package fr.election.api.election;

import fr.election.api.model.Candidat;

public record CandidatDto(Integer id, String prenom, String nom, String parti) {

	static CandidatDto de(Candidat candidat) {
		return new CandidatDto(candidat.getIdCandidat(), candidat.getPrenom(), candidat.getNom(), candidat.getParti());
	}

}
