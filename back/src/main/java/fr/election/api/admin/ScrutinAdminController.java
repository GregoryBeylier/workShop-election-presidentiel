package fr.election.api.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import fr.election.api.admin.dto.CandidatAdminDto;
import fr.election.api.admin.dto.CandidatRequest;
import fr.election.api.admin.dto.CreationDto;
import fr.election.api.admin.dto.OuvrirRequest;
import fr.election.api.admin.dto.StatsDto;
import fr.election.api.election.dto.PeriodeDto;
import jakarta.validation.Valid;

// Pilotage du scrutin : statistiques, démarrage / clôture, candidats.
// /api/admin/** est réservé au rôle ADMIN (voir SecurityConfig)
@RestController
@RequestMapping("/api/admin")
public class ScrutinAdminController {

	private final ScrutinAdminService scrutinService;

	public ScrutinAdminController(ScrutinAdminService scrutinService) {
		this.scrutinService = scrutinService;
	}

	@GetMapping("/stats")
	public StatsDto stats() {
		return scrutinService.stats();
	}

	@PostMapping("/scrutin/ouvrir")
	public PeriodeDto ouvrir(@Valid @RequestBody OuvrirRequest requete) {
		return scrutinService.ouvrir(requete.closLe());
	}

	@PostMapping("/scrutin/cloturer")
	public PeriodeDto cloturer() {
		return scrutinService.cloturer();
	}

	@PostMapping("/scrutin")
	public PeriodeDto nouveauScrutin() {
		return scrutinService.nouveauScrutin();
	}

	@GetMapping("/candidats")
	public List<CandidatAdminDto> candidats() {
		return scrutinService.candidats();
	}

	@PostMapping("/candidats")
	public CreationDto<CandidatAdminDto> ajouterCandidat(@RequestBody CandidatRequest requete) {
		return scrutinService.ajouterCandidat(requete);
	}

	@DeleteMapping("/candidats/{idCandidat}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void retirerCandidat(@PathVariable Integer idCandidat) {
		scrutinService.retirerCandidat(idCandidat);
	}

}
