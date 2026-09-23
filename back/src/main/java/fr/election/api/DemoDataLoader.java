package fr.election.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import fr.election.api.model.Admin;
import fr.election.api.model.Utilisateur;
import fr.election.api.repository.AdminRepository;
import fr.election.api.repository.UtilisateurRepository;

// Comptes de démo créés au démarrage, uniquement avec le profil "demo" : jamais en production
@Component
@Profile("demo")
public class DemoDataLoader implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(DemoDataLoader.class);

	private final UtilisateurRepository utilisateurRepository;
	private final AdminRepository adminRepository;
	private final PasswordEncoder passwordEncoder;

	public DemoDataLoader(UtilisateurRepository utilisateurRepository, AdminRepository adminRepository,
			PasswordEncoder passwordEncoder) {
		this.utilisateurRepository = utilisateurRepository;
		this.adminRepository = adminRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional
	public void run(String... args) {
		compteDemo("root@demo.fr", "root", "ROOT", true);
		compteDemo("test@mydigitalschool.fr", "root", "TEST001", false);
	}

	// Crée le compte s'il n'existe pas, sinon remet le mot de passe de démo s'il a changé
	private void compteDemo(String email, String motDePasse, String matricule, boolean admin) {
		Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElse(null);

		if (utilisateur == null) {
			utilisateur = new Utilisateur();
			utilisateur.setEmail(email);
			utilisateur.setMotDePasse(passwordEncoder.encode(motDePasse));
			utilisateur.setMatricule(matricule);
			utilisateurRepository.save(utilisateur);
			log.info("Compte de démo créé : {}", email);
		} else if (!passwordEncoder.matches(motDePasse, utilisateur.getMotDePasse())) {
			utilisateur.setMotDePasse(passwordEncoder.encode(motDePasse));
			log.info("Mot de passe du compte de démo réinitialisé : {}", email);
		}

		if (admin && !adminRepository.existsByUtilisateurIdUtilisateur(utilisateur.getIdUtilisateur())) {
			Admin droits = new Admin();
			droits.setUtilisateur(utilisateur);
			adminRepository.save(droits);
			log.info("Droits admin ajoutés : {}", email);
		}
	}

}
