package fr.election.api.admin;

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

import fr.election.api.admin.dto.IsoloirAdminDto;
import fr.election.api.admin.dto.IsoloirCreeDto;
import fr.election.api.admin.dto.IsoloirRequest;
import jakarta.validation.Valid;

// Isoloirs (écran QR + borne) : /api/admin/** est réservé au rôle ADMIN (voir SecurityConfig)
@RestController
@RequestMapping("/api/admin/isoloirs")
public class IsoloirAdminController {

	private final IsoloirAdminService isoloirService;

	public IsoloirAdminController(IsoloirAdminService isoloirService) {
		this.isoloirService = isoloirService;
	}

	@GetMapping
	public List<IsoloirAdminDto> isoloirs() {
		return isoloirService.lister();
	}

	@PostMapping
	public IsoloirCreeDto creer(@Valid @RequestBody IsoloirRequest requete) {
		return isoloirService.creer(requete.libelle());
	}

	// Vote bloqué sur la borne : repartir du premier duel, le votant restant dans l'isoloir
	@PostMapping("/{idIsoloir}/vote/recommencer")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void recommencerVote(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idIsoloir) {
		isoloirService.recommencerVote(idIsoloir, Integer.valueOf(jwt.getSubject()));
	}

	// Vote bloqué sur la borne : tout effacer, le votant redevient « n'a pas voté »
	@PostMapping("/{idIsoloir}/vote/annuler")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void annulerVote(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idIsoloir) {
		isoloirService.annulerVote(idIsoloir, Integer.valueOf(jwt.getSubject()));
	}

	@PostMapping("/{idIsoloir}/desactiver")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void desactiver(@PathVariable Integer idIsoloir) {
		isoloirService.desactiver(idIsoloir);
	}

}
