package fr.election.api.checkin;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import fr.election.api.checkin.CheckinService.Reponse;
import fr.election.api.checkin.CheckinService.ReponseVoteEnLigne;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

// Le votant est celui du JWT (sub = id utilisateur) : impossible d'émarger à la place d'un autre
@RestController
@RequestMapping("/api")
public class CheckinController {

	public record CheckinRequest(@NotBlank String code) {}

	private final CheckinService checkinService;

	public CheckinController(CheckinService checkinService) {
		this.checkinService = checkinService;
	}

	// Appelé par l'appli du votant avec le code tapé. Les refus métier (déjà voté, code faux...)
	// sont renvoyés en 200 avec leur status, pour que l'appli affiche le message tel quel.
	@PostMapping("/checkin")
	public Reponse checkin(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CheckinRequest request) {
		return checkinService.checkin(Integer.valueOf(jwt.getSubject()), request.code());
	}

	// Le votant choisit le vote en ligne : ferme définitivement le vote à l'isoloir
	@PostMapping("/voter/me/online-vote")
	public ReponseVoteEnLigne commencerVoteEnLigne(@AuthenticationPrincipal Jwt jwt) {
		return checkinService.commencerVoteEnLigne(Integer.valueOf(jwt.getSubject()));
	}

	@GetMapping("/voter/me/status")
	public Map<String, String> status(@AuthenticationPrincipal Jwt jwt) {
		return Map.of("status", checkinService.statut(Integer.valueOf(jwt.getSubject())).name());
	}

}
