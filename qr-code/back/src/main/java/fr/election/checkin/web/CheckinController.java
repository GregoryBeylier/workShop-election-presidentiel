package fr.election.checkin.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonProperty;

import fr.election.checkin.service.CheckinService;
import fr.election.checkin.service.CheckinService.Reponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api")
public class CheckinController {

	public record CheckinRequest(@JsonProperty("qr_token") @NotBlank String qrToken) {}

	private final CheckinService checkinService;
	private final VotantCourant votantCourant;

	public CheckinController(CheckinService checkinService, VotantCourant votantCourant) {
		this.checkinService = checkinService;
		this.votantCourant = votantCourant;
	}

	// Appelé par l'appli du votant après le scan. Les refus métier (déjà voté, QR expiré...)
	// sont renvoyés en 200 avec leur status, pour que l'appli affiche le message tel quel.
	@PostMapping("/checkin")
	public Reponse checkin(@RequestHeader(name = VotantCourant.HEADER, required = false) String idUtilisateur,
			@Valid @RequestBody CheckinRequest request) {
		return checkinService.checkin(votantCourant.id(idUtilisateur), request.qrToken());
	}

	@GetMapping("/voter/me/status")
	public Map<String, String> status(@RequestHeader(name = VotantCourant.HEADER, required = false) String idUtilisateur) {
		return Map.of("status", checkinService.statut(votantCourant.id(idUtilisateur)).name());
	}

}
