package fr.election.api.admin;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.admin.dto.CandidatAdminDto;
import fr.election.api.admin.dto.CandidatRequest;
import fr.election.api.admin.dto.CreationDto;
import fr.election.api.admin.dto.DuelStatsDto;
import fr.election.api.admin.dto.StatsDto;
import fr.election.api.election.ElectionService;
import fr.election.api.election.dto.CandidatDto;
import fr.election.api.election.dto.PeriodeDto;
import fr.election.api.model.Affrontement;
import fr.election.api.model.Candidat;
import fr.election.api.model.Inscription;
import fr.election.api.model.LigneVote;
import fr.election.api.model.PeriodeVote;
import fr.election.api.model.Utilisateur;
import fr.election.api.repository.AdminRepository;
import fr.election.api.repository.AffrontementRepository;
import fr.election.api.repository.BulletinRepository;
import fr.election.api.repository.CandidatRepository;
import fr.election.api.repository.InscriptionRepository;
import fr.election.api.repository.LigneVoteRepository;
import fr.election.api.repository.PeriodeVoteRepository;
import fr.election.api.repository.UtilisateurRepository;

// Cycle de vie du scrutin : PREPARATION (candidats) -> OUVERT (vote) -> CLOS (résultats) -> nouveau scrutin
@Service
public class ScrutinAdminService {

	private final ElectionService electionService;
	private final UtilisateurAdminService utilisateurAdminService;
	private final PeriodeVoteRepository periodeRepository;
	private final CandidatRepository candidatRepository;
	private final AffrontementRepository affrontementRepository;
	private final InscriptionRepository inscriptionRepository;
	private final BulletinRepository bulletinRepository;
	private final LigneVoteRepository ligneVoteRepository;
	private final UtilisateurRepository utilisateurRepository;
	private final AdminRepository adminRepository;

	public ScrutinAdminService(ElectionService electionService, UtilisateurAdminService utilisateurAdminService,
			PeriodeVoteRepository periodeRepository,
			CandidatRepository candidatRepository, AffrontementRepository affrontementRepository,
			InscriptionRepository inscriptionRepository, BulletinRepository bulletinRepository,
			LigneVoteRepository ligneVoteRepository, UtilisateurRepository utilisateurRepository,
			AdminRepository adminRepository) {
		this.electionService = electionService;
		this.utilisateurAdminService = utilisateurAdminService;
		this.periodeRepository = periodeRepository;
		this.candidatRepository = candidatRepository;
		this.affrontementRepository = affrontementRepository;
		this.inscriptionRepository = inscriptionRepository;
		this.bulletinRepository = bulletinRepository;
		this.ligneVoteRepository = ligneVoteRepository;
		this.utilisateurRepository = utilisateurRepository;
		this.adminRepository = adminRepository;
	}

	// Tout ce dont le tableau de bord a besoin, en un appel (rafraîchi toutes les quelques secondes)
	@Transactional(readOnly = true)
	public StatsDto stats() {
		PeriodeVote periode = periodeRepository.findFirstByOrderByIdPeriodeDesc().orElse(null);
		if (periode == null) {
			return new StatsDto(null, 0, 0, List.of(), List.of());
		}
		PeriodeDto periodeDto = electionService.versDto(periode);

		List<LigneVote> lignes = ligneVoteRepository.findByPeriode(periode.getIdPeriode());
		long nbCommences = bulletinRepository.compterDuelsParInscription(periode.getIdPeriode()).size();

		// Détail de chaque duel : victoires de chaque côté et égalités
		Map<Integer, int[]> parDuel = new HashMap<>();
		for (LigneVote ligne : lignes) {
			int[] compteur = parDuel.computeIfAbsent(ligne.getAffrontement().getIdAffrontement(), k -> new int[3]);
			if (ligne.getCandidatChoisi() == null) {
				compteur[2]++;
			} else if (ligne.getCandidatChoisi().getIdCandidat()
				.equals(ligne.getAffrontement().getCandidat1().getIdCandidat())) {
				compteur[0]++;
			} else {
				compteur[1]++;
			}
		}
		List<DuelStatsDto> duels = new ArrayList<>();
		for (Affrontement a : affrontementRepository.findByPeriode(periode.getIdPeriode())) {
			int[] c = parDuel.getOrDefault(a.getIdAffrontement(), new int[3]);
			duels.add(new DuelStatsDto(a.getIdAffrontement(), CandidatDto.de(a.getCandidat1()),
					CandidatDto.de(a.getCandidat2()), c[0], c[1], c[2]));
		}

		return new StatsDto(periodeDto, nbCommences - periodeDto.nbVotants(), lignes.size(),
				electionService.classement(periode), duels);
	}

	// Génère tous les duels (chaque candidat contre chaque autre, une fois) puis ouvre le vote
	@Transactional
	public PeriodeDto ouvrir(LocalDate closLe) {
		PeriodeVote periode = periodeDansLEtat(PeriodeVote.PREPARATION, "Seul un scrutin en préparation peut être démarré");
		if (closLe.isBefore(LocalDate.now())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La date de clôture doit être dans le futur");
		}
		List<Candidat> candidats = candidatRepository.findByPeriodeIdPeriodeOrderByIdCandidat(periode.getIdPeriode());
		if (candidats.size() < 2) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il faut au moins 2 candidats pour démarrer");
		}

		affrontementRepository.supprimerDeLaPeriode(periode.getIdPeriode());
		for (int i = 0; i < candidats.size(); i++) {
			for (int j = i + 1; j < candidats.size(); j++) {
				Affrontement duel = new Affrontement();
				duel.setCandidat1(candidats.get(i));
				duel.setCandidat2(candidats.get(j));
				affrontementRepository.save(duel);
			}
		}

		periode.setStatut(true);
		periode.setOuvertLe(LocalDate.now());
		periode.setClosLe(closLe);
		affrontementRepository.flush();
		return electionService.versDto(periode);
	}

	// Ferme le vote : les résultats deviennent visibles par tous
	@Transactional
	public PeriodeDto cloturer() {
		PeriodeVote periode = periodeDansLEtat(PeriodeVote.OUVERT, "Aucun scrutin ouvert à clôturer");
		periode.setStatut(false);
		periode.setClosLe(LocalDate.now());
		return electionService.versDto(periode);
	}

	// Nouveau scrutin en préparation, avec tous les électeurs (non admins, non anonymisés) inscrits
	@Transactional
	public PeriodeDto nouveauScrutin() {
		periodeRepository.findFirstByOrderByIdPeriodeDesc()
			.filter(p -> !PeriodeVote.CLOS.equals(p.getEtat()))
			.ifPresent(p -> {
				throw new ResponseStatusException(HttpStatus.CONFLICT,
						"Le scrutin actuel doit être clos avant d'en créer un nouveau");
			});

		PeriodeVote periode = periodeRepository.save(new PeriodeVote());
		for (Utilisateur utilisateur : utilisateurRepository.findAll()) {
			if (utilisateur.getEmail().endsWith(UtilisateurAdminService.DOMAINE_ANONYME)
					|| adminRepository.existsByUtilisateurIdUtilisateur(utilisateur.getIdUtilisateur())) {
				continue;
			}
			Inscription inscription = new Inscription();
			inscription.setUtilisateur(utilisateur);
			inscription.setPeriode(periode);
			inscriptionRepository.save(inscription);
		}
		return electionService.versDto(periode);
	}

	@Transactional(readOnly = true)
	public List<CandidatAdminDto> candidats() {
		return periodeRepository.findFirstByOrderByIdPeriodeDesc()
			.map(p -> candidatRepository.findByPeriodeIdPeriodeOrderByIdCandidat(p.getIdPeriode()).stream()
				.map(ScrutinAdminService::versDto)
				.toList())
			.orElse(List.of());
	}

	// Email inconnu : le compte est créé (mot de passe provisoire) ; sinon l'électeur existant devient candidat
	@Transactional
	public CreationDto<CandidatAdminDto> ajouterCandidat(CandidatRequest requete) {
		PeriodeVote periode = periodeDansLEtat(PeriodeVote.PREPARATION,
				"Les candidats ne peuvent être ajoutés que pendant la préparation du scrutin");
		String prenom = requete.prenom() == null ? "" : requete.prenom().trim();
		String nom = requete.nom() == null ? "" : requete.nom().trim();
		String parti = requete.parti() == null ? "" : requete.parti().trim();
		if (prenom.isEmpty() || nom.isEmpty() || parti.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prénom, nom et parti sont obligatoires");
		}
		if (prenom.length() > 100 || nom.length() > 100 || parti.length() > 100) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "100 caractères maximum par champ");
		}

		String email = UtilisateurAdminService.normaliserEmail(requete.email());
		Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElse(null);
		boolean compteCree = utilisateur == null;
		if (compteCree) {
			String erreur = utilisateurAdminService.verifier(email);
			if (erreur != null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, erreur);
			}
			utilisateur = utilisateurAdminService.creerCompte(email, requete.motDePasse());
		} else if (adminRepository.existsByUtilisateurIdUtilisateur(utilisateur.getIdUtilisateur())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un administrateur ne peut pas être candidat");
		}

		Utilisateur inscrit = utilisateur;
		Inscription inscription = inscriptionRepository
			.findByUtilisateurIdUtilisateurAndPeriodeIdPeriode(inscrit.getIdUtilisateur(), periode.getIdPeriode())
			.orElseGet(() -> {
				Inscription nouvelle = new Inscription();
				nouvelle.setUtilisateur(inscrit);
				nouvelle.setPeriode(periode);
				return inscriptionRepository.save(nouvelle);
			});
		if (candidatRepository.existsByInscriptionIdInscription(inscription.getIdInscription())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet utilisateur est déjà candidat");
		}

		Candidat candidat = new Candidat();
		candidat.setInscription(inscription);
		candidat.setPeriode(periode);
		candidat.setPrenom(prenom);
		candidat.setNom(nom);
		candidat.setParti(parti);
		candidatRepository.save(candidat);
		return new CreationDto<>(versDto(candidat), compteCree);
	}

	// Le candidat redevient simple électeur (son compte et son inscription sont conservés)
	@Transactional
	public void retirerCandidat(Integer idCandidat) {
		periodeDansLEtat(PeriodeVote.PREPARATION, "Les candidats ne peuvent être retirés que pendant la préparation");
		Candidat candidat = candidatRepository.findById(idCandidat)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidat introuvable"));
		candidatRepository.delete(candidat);
	}

	private PeriodeVote periodeDansLEtat(String etat, String erreur) {
		return periodeRepository.findFirstByOrderByIdPeriodeDesc()
			.filter(p -> etat.equals(p.getEtat()))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, erreur));
	}

	private static CandidatAdminDto versDto(Candidat candidat) {
		return new CandidatAdminDto(CandidatDto.de(candidat), candidat.getInscription().getUtilisateur().getEmail());
	}

}
