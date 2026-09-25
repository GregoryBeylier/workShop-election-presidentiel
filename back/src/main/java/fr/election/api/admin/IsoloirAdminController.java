package fr.election.api.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
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

// Isoloirs (écran du code + borne) : /api/admin/** est réservé au rôle ADMIN (voir SecurityConfig)
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
		return isoloirService.creer(requete.libelle(), requete.ipBorne());
	}

	@PostMapping("/{idIsoloir}/desactiver")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void desactiver(@PathVariable Integer idIsoloir) {
		isoloirService.desactiver(idIsoloir);
	}

}
