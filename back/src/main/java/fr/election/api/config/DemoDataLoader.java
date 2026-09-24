package fr.election.api.config;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import fr.election.api.model.Admin;
import fr.election.api.model.Affrontement;
import fr.election.api.model.Candidat;
import fr.election.api.model.Inscription;
import fr.election.api.model.PeriodeVote;
import fr.election.api.model.Utilisateur;
import fr.election.api.repository.AdminRepository;
import fr.election.api.repository.AffrontementRepository;
import fr.election.api.repository.CandidatRepository;
import fr.election.api.repository.InscriptionRepository;
import fr.election.api.repository.PeriodeVoteRepository;
import fr.election.api.repository.UtilisateurRepository;

// Comptes de démo créés au démarrage, uniquement avec le profil "demo" : jamais en production
@Component
@Profile("demo")
public class DemoDataLoader implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(DemoDataLoader.class);

	private final UtilisateurRepository utilisateurRepository;
	private final AdminRepository adminRepository;
	private final PeriodeVoteRepository periodeRepository;
	private final InscriptionRepository inscriptionRepository;
	private final CandidatRepository candidatRepository;
	private final AffrontementRepository affrontementRepository;
	private final PasswordEncoder passwordEncoder;

	public DemoDataLoader(UtilisateurRepository utilisateurRepository, AdminRepository adminRepository,
			PeriodeVoteRepository periodeRepository, InscriptionRepository inscriptionRepository,
			CandidatRepository candidatRepository, AffrontementRepository affrontementRepository,
			PasswordEncoder passwordEncoder) {
		this.utilisateurRepository = utilisateurRepository;
		this.adminRepository = adminRepository;
		this.periodeRepository = periodeRepository;
		this.inscriptionRepository = inscriptionRepository;
		this.candidatRepository = candidatRepository;
		this.affrontementRepository = affrontementRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional
	public void run(String... args) {
		compteDemo("root@demo.fr", "root", true);
		compteDemo("test@mydigitalschool.fr", "root", false);

		if (periodeRepository.count() == 0) {
			scrutinDemo();
		}
	}

	// Période ouverte pour 14 jours, 4 candidats, tous les duels, et tous les non-admins inscrits
	private void scrutinDemo() {
		PeriodeVote periode = new PeriodeVote();
		periode.setStatut(true);
		periode.setOuvertLe(LocalDate.now());
		periode.setClosLe(LocalDate.now().plusDays(14).atTime(23, 59));
		periodeRepository.save(periode);

		String[][] candidatsDemo = {
			{ "moreau@demo.fr", "Alexandre", "Moreau", "Union Nouvelle" },
			{ "fontaine@demo.fr", "Claire", "Fontaine", "Rassemblement Citoyen" },
			{ "belkacem@demo.fr", "Yanis", "Belkacem", "Alliance Progressiste" },
			{ "rousseau@demo.fr", "Émilie", "Rousseau", "Parti Écologiste Populaire" },
		};
		for (String[] c : candidatsDemo) {
			compteDemo(c[0], "root", false);
		}

		List<Candidat> candidats = new ArrayList<>();
		for (Utilisateur utilisateur : utilisateurRepository.findAll()) {
			if (adminRepository.existsByUtilisateurIdUtilisateur(utilisateur.getIdUtilisateur())) {
				continue;
			}
			Inscription inscription = new Inscription();
			inscription.setUtilisateur(utilisateur);
			inscription.setPeriode(periode);
			inscriptionRepository.save(inscription);

			for (String[] c : candidatsDemo) {
				if (c[0].equals(utilisateur.getEmail())) {
					Candidat candidat = new Candidat();
					candidat.setInscription(inscription);
					candidat.setPeriode(periode);
					candidat.setPrenom(c[1]);
					candidat.setNom(c[2]);
					candidat.setParti(c[3]);
					candidats.add(candidatRepository.save(candidat));
				}
			}
		}

		for (int i = 0; i < candidats.size(); i++) {
			for (int j = i + 1; j < candidats.size(); j++) {
				Affrontement duel = new Affrontement();
				duel.setCandidat1(candidats.get(i));
				duel.setCandidat2(candidats.get(j));
				affrontementRepository.save(duel);
			}
		}
		log.info("Scrutin de démo créé : {} candidats, {} duels", candidats.size(),
				candidats.size() * (candidats.size() - 1) / 2);
	}

	// Crée le compte s'il n'existe pas, sinon remet le mot de passe de démo s'il a changé
	private void compteDemo(String email, String motDePasse, boolean admin) {
		Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElse(null);

		if (utilisateur == null) {
			utilisateur = new Utilisateur();
			utilisateur.setEmail(email);
			utilisateur.setMotDePasse(passwordEncoder.encode(motDePasse));
			utilisateurRepository.save(utilisateur);
			log.info("Compte de démo créé : {}", email);
		} else if (!passwordEncoder.matches(motDePasse, utilisateur.getMotDePasse())
				|| utilisateur.isMotDePasseProvisoire()) {
			utilisateur.setMotDePasse(passwordEncoder.encode(motDePasse));
			utilisateur.setMotDePasseProvisoire(false);
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
