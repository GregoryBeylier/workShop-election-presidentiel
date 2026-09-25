package fr.election.api.borne;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.annotation.JsonInclude;

import fr.election.api.checkin.IsoloirService;
import fr.election.api.model.Affrontement;
import fr.election.api.model.Bulletin;
import fr.election.api.model.Candidat;
import fr.election.api.model.ChoixProvisoire;
import fr.election.api.model.EmargementIsoloir;
import fr.election.api.model.Inscription;
import fr.election.api.model.Isoloir;
import fr.election.api.model.LigneVote;
import fr.election.api.repository.AffrontementRepository;
import fr.election.api.repository.BulletinRepository;
import fr.election.api.repository.CandidatRepository;
import fr.election.api.repository.ChoixProvisoireRepository;
import fr.election.api.repository.EmargementIsoloirRepository;
import fr.election.api.repository.InscriptionRepository;
import fr.election.api.repository.IsoloirRepository;
import fr.election.api.repository.LigneVoteRepository;

/**
 * Routes de la borne ESP32 (contrat : borne/API.md). La borne ne décide rien : elle affiche le duel que le
 * serveur lui donne et renvoie le bouton appuyé. Le vote ouvert sur une borne est l'émargement créé par le
 * check-in par code (CheckinService) ; son numéro sert de "jeton". En cas d'erreur, la borne ne lit que le code HTTP.
 */
@Service
public class BorneService {

	private static final Logger log = LoggerFactory.getLogger(BorneService.class);

	public static final String LIBRE = "LIBRE";
	public static final String DEVERROUILLEE = "DEVERROUILLEE";
	public static final String SUIVANT = "SUIVANT";
	public static final String TERMINE = "TERMINE";

	// gauche / droite : numéro de LED (rang du candidat par id_candidat croissant), jamais un id de candidat
	public record Duel(int numero, int total, Integer idAffrontement, int gauche, int droite) {}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record Etat(String etat, String jeton, Integer nbCandidats, Duel duel) {}

	public record Choix(String jeton, Integer idAffrontement, String choix) {}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record ReponseChoix(String statut, Duel duel) {}

	private final IsoloirRepository isoloirRepository;
	private final EmargementIsoloirRepository emargementRepository;
	private final InscriptionRepository inscriptionRepository;
	private final CandidatRepository candidatRepository;
	private final AffrontementRepository affrontementRepository;
	private final ChoixProvisoireRepository choixRepository;
	private final BulletinRepository bulletinRepository;
	private final LigneVoteRepository ligneVoteRepository;
	private final Clock clock;

	public BorneService(IsoloirRepository isoloirRepository, EmargementIsoloirRepository emargementRepository,
			InscriptionRepository inscriptionRepository, CandidatRepository candidatRepository,
			AffrontementRepository affrontementRepository, ChoixProvisoireRepository choixRepository,
			BulletinRepository bulletinRepository, LigneVoteRepository ligneVoteRepository, Clock clock) {
		this.isoloirRepository = isoloirRepository;
		this.emargementRepository = emargementRepository;
		this.inscriptionRepository = inscriptionRepository;
		this.candidatRepository = candidatRepository;
		this.affrontementRepository = affrontementRepository;
		this.choixRepository = choixRepository;
		this.bulletinRepository = bulletinRepository;
		this.ligneVoteRepository = ligneVoteRepository;
		this.clock = clock;
	}

	/**
	 * Retrouve l'isoloir à partir de la clé de la borne (401 si absente, inconnue ou isoloir désactivé)
	 * et note l'heure de l'appel : c'est le battement de cœur qui dit au check-in que la borne est en ligne.
	 * Transaction à part, validée tout de suite : elle ne garde aucun verrou pendant le vote.
	 */
	@Transactional
	public Integer identifier(String cleBorne) {
		if (cleBorne == null || cleBorne.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Clé de borne absente");
		}
		Isoloir isoloir = isoloirRepository.findByCleBorneHash(IsoloirService.sha256Hex(cleBorne))
			.filter(Isoloir::isActif)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Clé de borne invalide"));
		isoloirRepository.noterActiviteBorne(isoloir.getIdIsoloir(), LocalDateTime.now(clock));
		return isoloir.getIdIsoloir();
	}

	// B2 : appelée toutes les 2 s par la borne verrouillée. LIBRE, ou le vote ouvert et le duel à jouer
	@Transactional
	public Etat etat(Integer idIsoloir) {
		List<EmargementIsoloir> votes = emargementRepository.findVotesOuverts(idIsoloir);
		if (votes.isEmpty()) {
			return new Etat(LIBRE, null, null, null);
		}
		EmargementIsoloir vote = votes.get(0);
		Scrutin scrutin = scrutin(vote.getInscription());

		Optional<Duel> duel = prochainDuel(scrutin, vote.getIdEmargement());
		if (duel.isEmpty()) {
			// Tous les choix sont là mais pas le bulletin (ne devrait pas arriver : le dernier choix écrit
			// le bulletin dans la même transaction). On le termine plutôt que de bloquer la borne.
			finaliser(vote, scrutin);
			return new Etat(LIBRE, null, null, null);
		}
		return new Etat(DEVERROUILLEE, jeton(vote), scrutin.nbCandidats(), duel.get());
	}

	/**
	 * B3 : un bouton a été appuyé. Écrit le choix (provisoire) et renvoie le duel suivant ; au dernier duel,
	 * écrit le bulletin et toutes ses lignes d'un coup. Idempotent : la borne renvoie la même requête après
	 * une coupure, sans que rien soit compté deux fois.
	 */
	@Transactional
	public ReponseChoix choisir(Integer idIsoloir, Choix requete) {
		if (requete == null || requete.idAffrontement() == null || !estUnChoix(requete.choix())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requête mal formée");
		}
		EmargementIsoloir vote = emargementRepository.findById(idEmargement(requete.jeton()))
			.filter(e -> e.getIsoloir().getIdIsoloir().equals(idIsoloir))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Jeton inconnu pour cette borne"));

		// Même verrou que le check-in et le vote en ligne : les choix d'un votant passent un par un
		Inscription inscription = vote.getInscription();
		inscriptionRepository.findPeriodeOuverteForUpdate(inscription.getUtilisateur().getIdUtilisateur())
			.filter(i -> i.getIdInscription().equals(inscription.getIdInscription()))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.GONE, "Scrutin clos"));

		// Rejeu du dernier duel : le bulletin est déjà écrit
		if (bulletinRepository.existsByInscriptionIdInscription(inscription.getIdInscription())) {
			return new ReponseChoix(TERMINE, null);
		}

		Scrutin scrutin = scrutin(inscription);
		if (!scrutin.duels().containsKey(requete.idAffrontement())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duel inconnu");
		}

		boolean dejaRecu = choixRepository
			.existsById(new ChoixProvisoire.Cle(vote.getIdEmargement(), requete.idAffrontement()));
		if (!dejaRecu) {
			Integer attendu = prochainDuel(scrutin, vote.getIdEmargement()).map(Duel::idAffrontement).orElse(null);
			if (!requete.idAffrontement().equals(attendu)) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce n'est pas le duel attendu");
			}
			choixRepository.saveAndFlush(
					new ChoixProvisoire(vote.getIdEmargement(), requete.idAffrontement(), requete.choix()));
		}

		Optional<Duel> suivant = prochainDuel(scrutin, vote.getIdEmargement());
		if (suivant.isPresent()) {
			return new ReponseChoix(SUIVANT, suivant.get());
		}
		finaliser(vote, scrutin);
		return new ReponseChoix(TERMINE, null);
	}

	// Dernier duel : les choix provisoires deviennent le bulletin et ses lignes, puis sont effacés
	private void finaliser(EmargementIsoloir vote, Scrutin scrutin) {
		Bulletin bulletin = new Bulletin();
		bulletin.setInscription(vote.getInscription());
		bulletinRepository.save(bulletin);

		for (ChoixProvisoire choix : choixRepository.findByIdEmargement(vote.getIdEmargement())) {
			Affrontement duel = scrutin.duels().get(choix.getIdAffrontement());
			LigneVote ligne = new LigneVote();
			ligne.setBulletin(bulletin);
			ligne.setAffrontement(duel);
			ligne.setCandidatChoisi(switch (choix.getChoix()) {
				case ChoixProvisoire.GAUCHE -> duel.getCandidat1();
				case ChoixProvisoire.DROITE -> duel.getCandidat2();
				default -> null; // BLANC : égalité
			});
			ligneVoteRepository.save(ligne);
		}
		choixRepository.deleteByIdEmargement(vote.getIdEmargement());
		log.info("Vote terminé sur la borne de l'isoloir {} : bulletin {} écrit", vote.getIsoloir().getIdIsoloir(),
				bulletin.getIdBulletin());
	}

	// Duels de la période (dans l'ordre de jeu) et numéro de LED de chaque candidat
	private record Scrutin(List<Affrontement> ordre, Map<Integer, Affrontement> duels, Map<Integer, Integer> leds) {
		int nbCandidats() { return leds.size(); }
	}

	private Scrutin scrutin(Inscription inscription) {
		Integer idPeriode = inscription.getPeriode().getIdPeriode();
		List<Candidat> candidats = candidatRepository.findByPeriodeIdPeriodeOrderByIdCandidat(idPeriode);
		Map<Integer, Integer> leds = new HashMap<>();
		for (int i = 0; i < candidats.size(); i++) {
			leds.put(candidats.get(i).getIdCandidat(), i);
		}
		List<Affrontement> ordre = affrontementRepository.findByPeriode(idPeriode);
		return new Scrutin(ordre, ordre.stream().collect(Collectors.toMap(Affrontement::getIdAffrontement,
				Function.identity())), leds);
	}

	// Le duel à jouer : le premier (par id_affrontement) qui n'a pas encore de choix
	private Optional<Duel> prochainDuel(Scrutin scrutin, Integer idEmargement) {
		var dejaJoues = choixRepository.findByIdEmargement(idEmargement).stream()
			.map(ChoixProvisoire::getIdAffrontement)
			.collect(Collectors.toSet());
		List<Affrontement> ordre = scrutin.ordre();
		for (int i = 0; i < ordre.size(); i++) {
			Affrontement a = ordre.get(i);
			if (!dejaJoues.contains(a.getIdAffrontement())) {
				return Optional.of(new Duel(i + 1, ordre.size(), a.getIdAffrontement(),
						scrutin.leds().get(a.getCandidat1().getIdCandidat()),
						scrutin.leds().get(a.getCandidat2().getIdCandidat())));
			}
		}
		return Optional.empty();
	}

	private static String jeton(EmargementIsoloir vote) {
		return String.valueOf(vote.getIdEmargement());
	}

	private static Integer idEmargement(String jeton) {
		try {
			return Integer.valueOf(jeton == null ? "" : jeton.strip());
		} catch (NumberFormatException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jeton mal formé");
		}
	}

	private static boolean estUnChoix(String choix) {
		return ChoixProvisoire.GAUCHE.equals(choix) || ChoixProvisoire.DROITE.equals(choix)
				|| ChoixProvisoire.BLANC.equals(choix);
	}

}
