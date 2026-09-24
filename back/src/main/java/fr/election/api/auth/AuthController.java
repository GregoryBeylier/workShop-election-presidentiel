package fr.election.api.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.auth.dto.ChangementMotDePasseRequest;
import fr.election.api.auth.dto.LoginRequest;
import fr.election.api.auth.dto.LoginResponse;
import fr.election.api.auth.dto.MeResponse;
import fr.election.api.model.Utilisateur;
import fr.election.api.repository.AdminRepository;
import fr.election.api.repository.UtilisateurRepository;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UtilisateurRepository utilisateurRepository;
	private final AdminRepository adminRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final MotDePasseService motDePasseService;

	// Hash factice : on compare quand même quand l'email n'existe pas,
	// pour que le temps de réponse ne révèle pas quels emails sont inscrits
	private final String hashFactice;

	public AuthController(UtilisateurRepository utilisateurRepository, AdminRepository adminRepository,
			PasswordEncoder passwordEncoder, JwtService jwtService, MotDePasseService motDePasseService) {
		this.utilisateurRepository = utilisateurRepository;
		this.adminRepository = adminRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.motDePasseService = motDePasseService;
		this.hashFactice = passwordEncoder.encode("mot-de-passe-factice");
	}

	@PostMapping("/login")
	public LoginResponse login(@Valid @RequestBody LoginRequest requete) {
		Utilisateur utilisateur = utilisateurRepository.findByEmail(requete.email().trim().toLowerCase()).orElse(null);
		String hash = utilisateur != null ? utilisateur.getMotDePasse() : hashFactice;
		boolean motDePasseValide = passwordEncoder.matches(requete.motDePasse(), hash);

		// Même message que l'email ou le mot de passe soit faux
		if (utilisateur == null || !motDePasseValide) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect");
		}

		return reponse(utilisateur);
	}

	// Première connexion : remplace le mot de passe provisoire et renvoie un token avec les droits normaux
	@PostMapping("/changer-mot-de-passe")
	public LoginResponse changerMotDePasse(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody ChangementMotDePasseRequest requete) {
		return reponse(motDePasseService.remplacerProvisoire(Integer.valueOf(jwt.getSubject()), requete.motDePasse()));
	}

	@GetMapping("/me")
	public MeResponse me(@AuthenticationPrincipal Jwt jwt) {
		Integer idUtilisateur = Integer.valueOf(jwt.getSubject());
		Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
		return new MeResponse(utilisateur.getEmail(),
				adminRepository.existsByUtilisateurIdUtilisateur(idUtilisateur));
	}

	private LoginResponse reponse(Utilisateur utilisateur) {
		boolean admin = adminRepository.existsByUtilisateurIdUtilisateur(utilisateur.getIdUtilisateur());
		return new LoginResponse(jwtService.generer(utilisateur, admin), utilisateur.getEmail(), admin,
				utilisateur.isMotDePasseProvisoire());
	}

}
