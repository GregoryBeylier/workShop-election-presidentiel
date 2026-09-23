package fr.election.api.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import fr.election.api.admin.dto.CreationDto;
import fr.election.api.admin.dto.MotDePasseRequest;
import fr.election.api.admin.dto.SuppressionDto;
import fr.election.api.admin.dto.UtilisateurAdminDto;
import fr.election.api.admin.dto.UtilisateurRequest;

// Gestion des comptes : inscription, mot de passe provisoire, suppression RGPD.
// /api/admin/** est réservé au rôle ADMIN (voir SecurityConfig)
@RestController
@RequestMapping("/api/admin/utilisateurs")
public class UtilisateurAdminController {

	private final UtilisateurAdminService utilisateurService;

	public UtilisateurAdminController(UtilisateurAdminService utilisateurService) {
		this.utilisateurService = utilisateurService;
	}

	@GetMapping
	public List<UtilisateurAdminDto> utilisateurs() {
		return utilisateurService.lister();
	}

	@PostMapping
	public CreationDto<Integer> creer(@RequestBody UtilisateurRequest requete) {
		return utilisateurService.creer(requete);
	}

	@PostMapping("/{idUtilisateur}/mot-de-passe")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void reinitialiserMotDePasse(@PathVariable Integer idUtilisateur, @RequestBody MotDePasseRequest requete) {
		utilisateurService.reinitialiserMotDePasse(idUtilisateur, requete.motDePasse());
	}

	@DeleteMapping("/{idUtilisateur}")
	public SuppressionDto supprimer(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idUtilisateur) {
		return utilisateurService.supprimer(idUtilisateur, Integer.valueOf(jwt.getSubject()));
	}

}
