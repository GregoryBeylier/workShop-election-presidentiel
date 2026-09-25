package fr.election.api.checkin;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import fr.election.api.model.Bulletin;
import fr.election.api.model.EmargementIsoloir;
import fr.election.api.model.Inscription;
import fr.election.api.model.Isoloir;
import fr.election.api.model.JournalCheckin;
import fr.election.api.repository.BulletinRepository;
import fr.election.api.repository.EmargementIsoloirRepository;
import fr.election.api.repository.InscriptionRepository;
import fr.election.api.repository.IsoloirRepository;
import fr.election.api.repository.JournalCheckinRepository;
import fr.election.api.repository.UtilisateurRepository;
import fr.election.api.checkin.CodeIsoloirService.Verification;

@Service
public class CheckinService {

	private static final Logger log = LoggerFactory.getLogger(CheckinService.class);

	// Sans appel de la borne depuis ce délai, elle est considérée hors ligne
	public static final Duration DELAI_BORNE_EN_LIGNE = Duration.ofSeconds(10);

	private static final String MESSAGE_SUCCES = "Identification réussie — votez sur la borne de l'isoloir.";

	// 5 codes faux max en 5 min par votant : deviner un code sur 1 000 000 devient hors de portée
	public static final int MAX_ECHECS_CODE = 5;
	public static final Duration DELAI_ECHECS_CODE = Duration.ofMinutes(5);

	// Statut du votant, tel qu'exposé à l'appli :
	// checked_in_isoloir = vote ouvert sur la borne, voted_booth = bulletin écrit par la borne
	public enum StatutVotant { not_voted, voted_app, checked_in_isoloir, voted_booth, not_registered }

	// Résultat d'un check-in (valeurs autorisées par la contrainte chk_resultat_checkin),
	// sauf too_many_attempts, jamais écrit dans le journal
	public enum ResultatCheckin {
		success, already_voted, invalid_token, not_registered, booth_offline, booth_busy, too_many_attempts
	}

	public record Reponse(ResultatCheckin status, String message) {}

	// Résultat du choix "voter en ligne"
	public enum ResultatVoteEnLigne { success, checked_in_isoloir, not_registered }

	public record ReponseVoteEnLigne(ResultatVoteEnLigne status, String message) {}

	private final CodeIsoloirService codeIsoloirService;
	private final InscriptionRepository inscriptionRepository;
	private final BulletinRepository bulletinRepository;
	private final EmargementIsoloirRepository emargementRepository;
	private final IsoloirRepository isoloirRepository;
	private final JournalCheckinRepository journalRepository;
	private final UtilisateurRepository utilisateurRepository;
	private final Clock clock;

	public CheckinService(CodeIsoloirService codeIsoloirService, InscriptionRepository inscriptionRepository,
			BulletinRepository bulletinRepository, EmargementIsoloirRepository emargementRepository,
			IsoloirRepository isoloirRepository, JournalCheckinRepository journalRepository,
			UtilisateurRepository utilisateurRepository, Clock clock) {
		this.codeIsoloirService = codeIsoloirService;
		this.inscriptionRepository = inscriptionRepository;
		this.bulletinRepository = bulletinRepository;
		this.emargementRepository = emargementRepository;
		this.isoloirRepository = isoloirRepository;
		this.journalRepository = journalRepository;
		this.utilisateurRepository = utilisateurRepository;
		this.clock = clock;
	}

	/**
	 * Émarge le votant dans l'isoloir dont il a tapé le code. L'émargement ouvre son vote sur la borne
	 * de l'isoloir (la borne le voit à son prochain appel de /api/borne/etat) et révoque
	 * définitivement le vote via l'appli.
	 * Un code à 6 chiffres peut se deviner : les échecs sont limités par votant.
	 */
	@Transactional
	public Reponse checkin(Integer idUtilisateur, String code) {
		LocalDateTime maintenant = LocalDateTime.now(clock);
		long echecs = journalRepository.countByIdUtilisateurAndResultatAndScanneLeAfter(idUtilisateur,
				ResultatCheckin.invalid_token.name(), maintenant.minus(DELAI_ECHECS_CODE));
		if (echecs >= MAX_ECHECS_CODE) {
			log.warn("Check-in refusé (trop d'essais) : votant {}", idUtilisateur);
			return new Reponse(ResultatCheckin.too_many_attempts,
					"Trop de codes incorrects. Patientez quelques minutes ou prévenez un assesseur.");
		}

		Verification verification = codeIsoloirService.verifier(code, clock.instant());
		if (verification.resultat() != CodeIsoloirService.Resultat.VALIDE) {
			return journaliser(idUtilisateur, null, maintenant, ResultatCheckin.invalid_token,
					"Code incorrect ou expiré. Tapez le code affiché en ce moment sur l'écran de l'isoloir.");
		}
		Isoloir isoloirVerifie = verification.isoloir();
		Integer idIsoloir = isoloirVerifie.getIdIsoloir();

		// Verrou sur l'inscription : deux envois simultanés ne peuvent pas produire deux émargements
		Optional<Inscription> inscription = inscriptionRepository.findPeriodeOuverteForUpdate(idUtilisateur);
		if (inscription.isEmpty()) {
			return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.not_registered,
					"Vous n'êtes pas inscrit à l'élection en cours.");
		}
		Integer idInscription = inscription.get().getIdInscription();

		Optional<EmargementIsoloir> dejaEmarge = emargementRepository.findByInscription_IdInscription(idInscription);

		if (bulletinRepository.existsByInscriptionIdInscription(idInscription)) {
			return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.already_voted,
					dejaEmarge.isPresent() ? "Vous avez déjà voté sur la borne." : "Vous avez déjà voté dans l'application.");
		}

		if (dejaEmarge.isPresent()) {
			// Double envoi dans le même isoloir (double-tap, mauvaise manip) : on confirme sans rien changer
			if (dejaEmarge.get().getIsoloir().getIdIsoloir().equals(idIsoloir)) {
				return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.success, MESSAGE_SUCCES);
			}
			return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.already_voted,
					"Vous vous êtes déjà identifié dans un autre isoloir.");
		}

		if (isoloirVerifie.aUneBorne()) {
			// Verrou sur l'isoloir, toujours après celui de l'inscription (même ordre partout, pas d'interblocage)
			Isoloir isoloir = isoloirRepository.findByIdForUpdate(idIsoloir).orElseThrow();
			LocalDateTime dernierAppel = isoloir.getDerniereActiviteBorne();
			if (dernierAppel == null || dernierAppel.isBefore(maintenant.minus(DELAI_BORNE_EN_LIGNE))) {
				return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.booth_offline,
						"La borne de cet isoloir est hors ligne. Prévenez un assesseur.");
			}
			if (emargementRepository.existsVoteOuvert(idIsoloir)) {
				return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.booth_busy,
						"La borne de cet isoloir est occupée. Attendez qu'elle se libère ou changez d'isoloir.");
			}
		}

		EmargementIsoloir emargement = new EmargementIsoloir();
		emargement.setInscription(inscription.get());
		emargement.setIsoloir(isoloirVerifie);
		emargement.setEmargeLe(maintenant);
		emargementRepository.save(emargement);

		return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.success, MESSAGE_SUCCES);
	}

	/**
	 * Le votant choisit de voter en ligne : son bulletin est créé tout de suite (encore vide),
	 * ce qui ferme définitivement le vote à l'isoloir, même s'il ne va pas au bout de ses duels.
	 * Même verrou que le check-in : un clic sur "Commencer" et un check-in simultanés ne passent pas tous les deux.
	 */
	@Transactional
	public ReponseVoteEnLigne commencerVoteEnLigne(Integer idUtilisateur) {
		Optional<Inscription> inscription = inscriptionRepository.findPeriodeOuverteForUpdate(idUtilisateur);
		if (inscription.isEmpty()) {
			return new ReponseVoteEnLigne(ResultatVoteEnLigne.not_registered,
					"Vous n'êtes pas inscrit à l'élection en cours.");
		}
		Integer idInscription = inscription.get().getIdInscription();

		if (emargementRepository.findByInscription_IdInscription(idInscription).isPresent()) {
			log.warn("Vote en ligne refusé : votant {} déjà identifié dans un isoloir", idUtilisateur);
			return new ReponseVoteEnLigne(ResultatVoteEnLigne.checked_in_isoloir,
					"Vous êtes déjà identifié dans un isoloir : votez sur la borne.");
		}

		// Déjà commencé (double clic, retour arrière) : on confirme sans rien changer
		if (!bulletinRepository.existsByInscriptionIdInscription(idInscription)) {
			Bulletin bulletin = new Bulletin();
			bulletin.setInscription(inscription.get());
			bulletinRepository.save(bulletin);
			log.info("Vote en ligne commencé : votant {}", idUtilisateur);
		}
		return new ReponseVoteEnLigne(ResultatVoteEnLigne.success, "Vous pouvez voter en ligne.");
	}

	// Utilisé par l'appli pour savoir si elle propose encore le vote en ligne
	@Transactional(readOnly = true)
	public StatutVotant statut(Integer idUtilisateur) {
		Optional<Inscription> inscription = inscriptionRepository.findPeriodeOuverte(idUtilisateur);
		if (inscription.isEmpty()) {
			return StatutVotant.not_registered;
		}
		Integer idInscription = inscription.get().getIdInscription();
		boolean emarge = emargementRepository.findByInscription_IdInscription(idInscription).isPresent();
		// Le bulletin d'abord : après un vote sur la borne, le votant a un émargement ET un bulletin
		if (bulletinRepository.existsByInscriptionIdInscription(idInscription)) {
			return emarge ? StatutVotant.voted_booth : StatutVotant.voted_app;
		}
		return emarge ? StatutVotant.checked_in_isoloir : StatutVotant.not_voted;
	}

	private Reponse journaliser(Integer idUtilisateur, Integer idIsoloir, LocalDateTime maintenant,
			ResultatCheckin resultat, String message) {
		journalRepository.save(new JournalCheckin(idUtilisateur, idIsoloir, maintenant, resultat.name()));

		// Visible uniquement dans le terminal du serveur (jamais sur la tablette)
		String votant = utilisateurRepository.findById(idUtilisateur)
			.map(u -> idUtilisateur + " (" + u.getEmail() + ")")
			.orElse(idUtilisateur.toString());
		String isoloir = idIsoloir == null ? "inconnu" : idIsoloir.toString();
		if (resultat == ResultatCheckin.success) {
			log.info("Check-in OK : votant {} dans l'isoloir {}", votant, isoloir);
		} else {
			log.warn("Check-in refusé ({}) : votant {}, isoloir {}", resultat, votant, isoloir);
		}
		return new Reponse(resultat, message);
	}

}
