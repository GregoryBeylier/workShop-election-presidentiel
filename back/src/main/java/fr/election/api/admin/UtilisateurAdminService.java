package fr.election.api.admin;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.admin.dto.CreationDto;
import fr.election.api.admin.dto.SuppressionDto;
import fr.election.api.admin.dto.UtilisateurAdminDto;
import fr.election.api.admin.dto.UtilisateurRequest;
import fr.election.api.auth.MotDePasseService;
import fr.election.api.model.Candidat;
import fr.election.api.model.Inscription;
import fr.election.api.model.PeriodeVote;
import fr.election.api.model.Utilisateur;
import fr.election.api.repository.AdminRepository;
import fr.election.api.repository.BulletinRepository;
import fr.election.api.repository.CandidatRepository;
import fr.election.api.repository.InscriptionRepository;
import fr.election.api.repository.PeriodeVoteRepository;
import fr.election.api.repository.TokenRepository;
import fr.election.api.repository.UtilisateurRepository;

@Service
public class UtilisateurAdminService {

	// Les comptes anonymisés (RGPD) gardent une adresse sur ce domaine réservé, jamais affichée
	static final String DOMAINE_ANONYME = "@anonyme.invalid";

	private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

	private final UtilisateurRepository utilisateurRepository;
	private final AdminRepository adminRepository;
	private final PeriodeVoteRepository periodeRepository;
	private final InscriptionRepository inscriptionRepository;
	private final CandidatRepository candidatRepository;
	private final BulletinRepository bulletinRepository;
	private final TokenRepository tokenRepository;
	private final MotDePasseService motDePasseService;

	public UtilisateurAdminService(UtilisateurRepository utilisateurRepository, AdminRepository adminRepository,
			PeriodeVoteRepository periodeRepository, InscriptionRepository inscriptionRepository,
			CandidatRepository candidatRepository, BulletinRepository bulletinRepository,
			TokenRepository tokenRepository, MotDePasseService motDePasseService) {
		this.utilisateurRepository = utilisateurRepository;
		this.adminRepository = adminRepository;
		this.periodeRepository = periodeRepository;
		this.inscriptionRepository = inscriptionRepository;
		this.candidatRepository = candidatRepository;
		this.bulletinRepository = bulletinRepository;
		this.tokenRepository = tokenRepository;
		this.motDePasseService = motDePasseService;
	}

	@Transactional(readOnly = true)
	public List<UtilisateurAdminDto> lister() {
		PeriodeVote periode = periodeRepository.findFirstByOrderByIdPeriodeDesc().orElse(null);

		Set<Integer> admins = adminRepository.findAll().stream()
			.map(a -> a.getUtilisateur().getIdUtilisateur())
			.collect(Collectors.toSet());

		// Inscriptions, candidatures et avancement du vote dans le scrutin en cours
		Map<Integer, Inscription> inscriptions = new HashMap<>();
		Set<Integer> candidats = new HashSet<>();
		Map<Integer, Long> duelsVotes = new HashMap<>();
		int nbDuels = 0;
		if (periode != null) {
			for (Inscription i : inscriptionRepository.findByPeriodeIdPeriode(periode.getIdPeriode())) {
				inscriptions.put(i.getUtilisateur().getIdUtilisateur(), i);
			}
			for (Candidat c : candidatRepository.findByPeriodeIdPeriodeOrderByIdCandidat(periode.getIdPeriode())) {
				candidats.add(c.getInscription().getIdInscription());
			}
			for (Object[] ligne : bulletinRepository.compterDuelsParInscription(periode.getIdPeriode())) {
				duelsVotes.put((Integer) ligne[0], (Long) ligne[1]);
			}
			nbDuels = candidats.size() * (candidats.size() - 1) / 2;
		}

		List<UtilisateurAdminDto> resultat = new ArrayList<>();
		for (Utilisateur u : utilisateurRepository.findAll()) {
			if (u.getEmail().endsWith(DOMAINE_ANONYME)) {
				continue;
			}
			Inscription inscription = inscriptions.get(u.getIdUtilisateur());
			long votes = inscription == null ? 0 : duelsVotes.getOrDefault(inscription.getIdInscription(), 0L);
			String statutVote = votes == 0 ? "AUCUN" : votes >= nbDuels ? "TERMINE" : "EN_COURS";

			resultat.add(new UtilisateurAdminDto(u.getIdUtilisateur(), u.getEmail(),
					admins.contains(u.getIdUtilisateur()), inscription != null,
					inscription != null && candidats.contains(inscription.getIdInscription()), statutVote,
					u.isMotDePasseProvisoire() ? "PROVISOIRE" : "ACTIF", u.getCreeLe()));
		}
		resultat.sort(Comparator.comparing(UtilisateurAdminDto::email));
		return resultat;
	}

	@Transactional
	public CreationDto<Integer> creer(UtilisateurRequest requete) {
		String email = normaliserEmail(requete.email());
		String erreur = verifier(email);
		if (erreur != null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, erreur);
		}
		Utilisateur utilisateur = creerCompte(email, requete.motDePasse());
		return new CreationDto<>(utilisateur.getIdUtilisateur(), true);
	}

	// Mot de passe oublié : l'admin fixe un nouveau mot de passe provisoire, à changer à la connexion suivante
	@Transactional
	public void reinitialiserMotDePasse(Integer idUtilisateur, String motDePasse) {
		motDePasseService.definirProvisoire(trouver(idUtilisateur), motDePasse);
	}

	// RGPD : suppression si l'utilisateur n'a laissé aucune trace de vote ou de candidature,
	// sinon anonymisation pour ne pas fausser les résultats (les votes restent, sans lien avec la personne)
	@Transactional
	public SuppressionDto supprimer(Integer idUtilisateur, Integer idAdminConnecte) {
		if (idUtilisateur.equals(idAdminConnecte)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous ne pouvez pas supprimer votre propre compte");
		}
		Utilisateur utilisateur = trouver(idUtilisateur);

		List<Candidat> candidatures = new ArrayList<>(candidatRepository.findByInscriptionUtilisateurIdUtilisateur(idUtilisateur));
		for (Candidat candidat : List.copyOf(candidatures)) {
			String etat = candidat.getPeriode().getEtat();
			if (PeriodeVote.OUVERT.equals(etat)) {
				throw new ResponseStatusException(HttpStatus.CONFLICT,
						"Cet utilisateur est candidat au scrutin en cours : clôturez le scrutin avant de le supprimer");
			}
			// Candidature d'un scrutin pas encore ouvert : aucun vote, on la retire simplement
			if (PeriodeVote.PREPARATION.equals(etat)) {
				candidatRepository.delete(candidat);
				candidatures.remove(candidat);
			}
		}

		if (candidatures.isEmpty() && !bulletinRepository.existsByInscriptionUtilisateurIdUtilisateur(idUtilisateur)) {
			candidatRepository.flush();
			utilisateurRepository.delete(utilisateur);
			return new SuppressionDto("SUPPRIME");
		}

		utilisateur.setEmail("utilisateur-" + idUtilisateur + DOMAINE_ANONYME);
		utilisateur.setMatricule(null);
		utilisateur.setMotDePasse(motDePasseService.inutilisable());
		utilisateur.setMotDePasseProvisoire(false);
		tokenRepository.supprimerTous(idUtilisateur);
		adminRepository.supprimerDroits(idUtilisateur);
		for (Candidat candidat : candidatures) {
			candidat.setPrenom("Candidat");
			candidat.setNom("anonymisé n°" + candidat.getIdCandidat());
		}
		return new SuppressionDto("ANONYMISE");
	}

	// Crée le compte avec le mot de passe provisoire de l'admin et l'inscrit au scrutin s'il n'est pas clos
	Utilisateur creerCompte(String email, String motDePasseProvisoire) {
		Utilisateur utilisateur = new Utilisateur();
		utilisateur.setEmail(email);
		motDePasseService.definirProvisoire(utilisateur, motDePasseProvisoire);
		utilisateurRepository.save(utilisateur);

		periodeRepository.findFirstByOrderByIdPeriodeDesc()
			.filter(p -> !PeriodeVote.CLOS.equals(p.getEtat()))
			.ifPresent(periode -> {
				Inscription inscription = new Inscription();
				inscription.setUtilisateur(utilisateur);
				inscription.setPeriode(periode);
				inscriptionRepository.save(inscription);
			});
		return utilisateur;
	}

	// Message d'erreur affichable, ou null si le compte peut être créé.
	// L'email est l'identifiant unique : une même personne ne peut pas avoir deux comptes.
	String verifier(String email) {
		if (email.isEmpty() || email.length() > 255 || !EMAIL.matcher(email).matches()) {
			return "Email invalide";
		}
		if (utilisateurRepository.existsByEmail(email)) {
			return "Un compte existe déjà avec cet email";
		}
		return null;
	}

	static String normaliserEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase();
	}

	private Utilisateur trouver(Integer idUtilisateur) {
		return utilisateurRepository.findById(idUtilisateur)
			.filter(u -> !u.getEmail().endsWith(DOMAINE_ANONYME))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
	}

}
