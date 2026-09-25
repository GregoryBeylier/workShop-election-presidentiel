package fr.election.api.checkin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonProperty;

import fr.election.api.checkin.CodeIsoloirService.CodeCourant;

// Route publique (pas de JWT) : le poste isoloir s'authentifie avec sa propre clé, voir SecurityConfig
@RestController
@RequestMapping("/api/booths")
public class IsoloirController {

	public record CodeCourantDto(@JsonProperty("code") String code, @JsonProperty("expires_in") long expiresIn) {}

	private final IsoloirService isoloirService;

	public IsoloirController(IsoloirService isoloirService) {
		this.isoloirService = isoloirService;
	}

	// Appelé chaque seconde par le poste isoloir
	@GetMapping("/{id}/current-code")
	public CodeCourantDto currentCode(@PathVariable Integer id,
			@RequestHeader(name = "X-Isoloir-Cle", required = false) String cleTablette) {
		CodeCourant code = isoloirService.codeCourant(id, cleTablette);
		return new CodeCourantDto(code.code(), code.expireDansMs());
	}

}
