package fr.election.checkin.web;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import fr.election.checkin.repository.UtilisateurRepository;

/**
 * Identifie le votant qui appelle l'API.
 *
 * TODO JWT : temporaire, l'id est lu dans le header X-User-Id, donc n'importe qui peut se faire
 * passer pour n'importe qui. À remplacer par l'utilisateur du JWT dès que l'auth de l'appli existe.
 */
@Component
public class VotantCourant {

	public static final String HEADER = "X-User-Id";

	private final UtilisateurRepository utilisateurRepository;

	public VotantCourant(UtilisateurRepository utilisateurRepository) {
		this.utilisateurRepository = utilisateurRepository;
	}

	public Integer id(String header) {
		Integer id;
		try {
			id = header == null ? null : Integer.valueOf(header.trim());
		} catch (NumberFormatException e) {
			id = null;
		}
		if (id == null || !utilisateurRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Votant non identifié");
		}
		return id;
	}

}
