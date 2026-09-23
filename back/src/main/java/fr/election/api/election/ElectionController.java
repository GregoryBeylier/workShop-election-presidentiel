package fr.election.api.election;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Toutes ces routes exigent un JWT valide (voir SecurityConfig) ; sub = id de l'utilisateur
@RestController
@RequestMapping("/api")
public class ElectionController {

	private final ElectionService electionService;

	public ElectionController(ElectionService electionService) {
		this.electionService = electionService;
	}

	@GetMapping("/periode")
	public PeriodeDto periode() {
		return electionService.periode();
	}

	@GetMapping("/candidats")
	public List<CandidatDto> candidats() {
		return electionService.candidats();
	}

	@GetMapping("/vote")
	public MonVoteDto monVote(@AuthenticationPrincipal Jwt jwt) {
		return electionService.monVote(Integer.valueOf(jwt.getSubject()));
	}

	@PostMapping("/vote/{idAffrontement}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void voter(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idAffrontement,
			@RequestBody VoteRequest requete) {
		electionService.voter(Integer.valueOf(jwt.getSubject()), idAffrontement, requete.idCandidatChoisi());
	}

	@GetMapping("/resultats")
	public ResultatsDto resultats() {
		return electionService.resultats();
	}

}
