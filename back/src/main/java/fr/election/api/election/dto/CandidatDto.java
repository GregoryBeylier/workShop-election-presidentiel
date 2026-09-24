package fr.election.api.election.dto;

import fr.election.api.model.Candidat;

public record CandidatDto(Integer id, String prenom, String nom, String parti, String photo) {

	public static CandidatDto de(Candidat candidat) {
		return new CandidatDto(candidat.getIdCandidat(), candidat.getPrenom(), candidat.getNom(), candidat.getParti(),
				candidat.getPhoto());
	}

}
