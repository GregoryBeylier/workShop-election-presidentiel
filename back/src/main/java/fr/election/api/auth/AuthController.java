package fr.election.api.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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

	// Hash factice : on compare quand même quand l'email n'existe pas,
	// pour que le temps de réponse ne révèle pas quels emails sont inscrits
	private final String hashFactice;

	public AuthController(UtilisateurRepository utilisateurRepository, AdminRepository adminRepository,
			PasswordEncoder passwordEncoder, JwtService jwtService) {
		this.utilisateurRepository = utilisateurRepository;
		this.adminRepository = adminRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
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

		boolean admin = adminRepository.existsByUtilisateurIdUtilisateur(utilisateur.getIdUtilisateur());
		return new LoginResponse(jwtService.generer(utilisateur, admin), utilisateur.getEmail(), admin);
	}

}
