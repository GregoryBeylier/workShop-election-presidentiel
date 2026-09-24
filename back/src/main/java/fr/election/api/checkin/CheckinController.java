package fr.election.api.checkin;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonProperty;

import fr.election.api.checkin.CheckinService.Reponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

// Le votant est celui du JWT (sub = id utilisateur) : impossible d'émarger à la place d'un autre
@RestController
@RequestMapping("/api")
public class CheckinController {

	public record CheckinRequest(@JsonProperty("qr_token") @NotBlank String qrToken) {}

	private final CheckinService checkinService;

	public CheckinController(CheckinService checkinService) {
		this.checkinService = checkinService;
	}

	// Appelé par l'appli du votant après le scan. Les refus métier (déjà voté, QR expiré...)
	// sont renvoyés en 200 avec leur status, pour que l'appli affiche le message tel quel.
	@PostMapping("/checkin")
	public Reponse checkin(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CheckinRequest request) {
		return checkinService.checkin(Integer.valueOf(jwt.getSubject()), request.qrToken());
	}

	@GetMapping("/voter/me/status")
	public Map<String, String> status(@AuthenticationPrincipal Jwt jwt) {
		return Map.of("status", checkinService.statut(Integer.valueOf(jwt.getSubject())).name());
	}

}
