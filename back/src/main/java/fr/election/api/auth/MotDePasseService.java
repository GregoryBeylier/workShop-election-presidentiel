package fr.election.api.auth;

import java.security.SecureRandom;
import java.util.Base64;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.model.Utilisateur;
import fr.election.api.repository.UtilisateurRepository;

// Mot de passe provisoire fixé par l'admin, puis mot de passe définitif choisi à la première connexion
@Service
public class MotDePasseService {

	// BCrypt ignore tout ce qui dépasse 72 octets
	private static final int LONGUEUR_MAX = 72;

	private final PasswordEncoder passwordEncoder;
	private final UtilisateurRepository utilisateurRepository;
	private final SecureRandom random = new SecureRandom();

	public MotDePasseService(PasswordEncoder passwordEncoder, UtilisateurRepository utilisateurRepository) {
		this.passwordEncoder = passwordEncoder;
		this.utilisateurRepository = utilisateurRepository;
	}

	// Libre (l'admin choisit ce qu'il veut) : l'utilisateur devra le changer à sa prochaine connexion
	public void definirProvisoire(Utilisateur utilisateur, String motDePasse) {
		if (motDePasse == null || motDePasse.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le mot de passe provisoire est obligatoire");
		}
		if (motDePasse.length() > LONGUEUR_MAX) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Le mot de passe provisoire ne doit pas dépasser 72 caractères");
		}
		utilisateur.setMotDePasse(passwordEncoder.encode(motDePasse));
		utilisateur.setMotDePasseProvisoire(true);
	}

	// Remplacement du mot de passe provisoire : règles de robustesse et différent de l'ancien
	@Transactional
	public Utilisateur remplacerProvisoire(Integer idUtilisateur, String motDePasse) {
		Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
		if (!utilisateur.isMotDePasseProvisoire()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Votre mot de passe a déjà été choisi");
		}
		if (!robuste(motDePasse)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Le mot de passe doit contenir 8 caractères, une majuscule, un chiffre et un caractère spécial");
		}
		if (passwordEncoder.matches(motDePasse, utilisateur.getMotDePasse())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Choisissez un mot de passe différent du mot de passe provisoire");
		}
		utilisateur.setMotDePasse(passwordEncoder.encode(motDePasse));
		utilisateur.setMotDePasseProvisoire(false);
		return utilisateur;
	}

	// Pour un compte anonymisé (RGPD) : plus personne ne peut s'y connecter
	public String inutilisable() {
		byte[] octets = new byte[32];
		random.nextBytes(octets);
		return passwordEncoder.encode(Base64.getEncoder().encodeToString(octets));
	}

	// Mêmes règles que la page de choix du mot de passe du front
	private static boolean robuste(String motDePasse) {
		return motDePasse != null && motDePasse.length() >= 8 && motDePasse.length() <= LONGUEUR_MAX
				&& motDePasse.chars().anyMatch(Character::isUpperCase)
				&& motDePasse.chars().anyMatch(Character::isDigit)
				&& motDePasse.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
	}

}
