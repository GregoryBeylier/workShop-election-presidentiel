package fr.election.checkin.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import fr.election.checkin.model.EmargementIsoloir;
import fr.election.checkin.model.Inscription;
import fr.election.checkin.model.Isoloir;
import fr.election.checkin.model.JournalCheckin;
import fr.election.checkin.repository.BulletinRepository;
import fr.election.checkin.repository.EmargementIsoloirRepository;
import fr.election.checkin.repository.InscriptionRepository;
import fr.election.checkin.repository.JournalCheckinRepository;
import fr.election.checkin.repository.UtilisateurRepository;
import fr.election.checkin.service.QrTokenService.Verification;

@Service
public class CheckinService {

	private static final Logger log = LoggerFactory.getLogger(CheckinService.class);

	// Statut du votant, tel qu'exposé à l'appli
	public enum StatutVotant { not_voted, voted_app, checked_in_isoloir, not_registered }

	// Résultat d'un scan (mêmes valeurs que la contrainte chk_resultat_checkin)
	public enum ResultatCheckin { success, already_voted, expired_token, invalid_token, not_registered }

	public record Reponse(ResultatCheckin status, String message) {}

	private final QrTokenService qrTokenService;
	private final InscriptionRepository inscriptionRepository;
	private final BulletinRepository bulletinRepository;
	private final EmargementIsoloirRepository emargementRepository;
	private final JournalCheckinRepository journalRepository;
	private final UtilisateurRepository utilisateurRepository;
	private final Clock clock;

	public CheckinService(QrTokenService qrTokenService, InscriptionRepository inscriptionRepository,
			BulletinRepository bulletinRepository, EmargementIsoloirRepository emargementRepository,
			JournalCheckinRepository journalRepository, UtilisateurRepository utilisateurRepository, Clock clock) {
		this.qrTokenService = qrTokenService;
		this.inscriptionRepository = inscriptionRepository;
		this.bulletinRepository = bulletinRepository;
		this.emargementRepository = emargementRepository;
		this.journalRepository = journalRepository;
		this.utilisateurRepository = utilisateurRepository;
		this.clock = clock;
	}

	/**
	 * Émarge le votant dans l'isoloir désigné par le QR. Dès que l'émargement est enregistré,
	 * le vote via l'appli est définitivement révoqué, même si le votant ne vote pas sur papier.
	 */
	@Transactional
	public Reponse checkin(Integer idUtilisateur, String qrToken) {
		LocalDateTime maintenant = LocalDateTime.now(clock);
		Verification verification = qrTokenService.verifier(qrToken, clock.instant());
		Integer idIsoloir = verification.isoloir() == null ? null : verification.isoloir().getIdIsoloir();

		switch (verification.resultat()) {
			case INVALIDE -> {
				return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.invalid_token,
						"Ce QR code n'est pas reconnu. Scannez celui affiché dans l'isoloir.");
			}
			case EXPIRE -> {
				return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.expired_token,
						"QR expiré, relancez le scan.");
			}
			case VALIDE -> { }
		}

		// Verrou sur l'inscription : deux scans simultanés ne peuvent pas produire deux émargements
		Optional<Inscription> inscription = inscriptionRepository.findPeriodeOuverteForUpdate(idUtilisateur);
		if (inscription.isEmpty()) {
			return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.not_registered,
					"Vous n'êtes pas inscrit à l'élection en cours.");
		}
		Integer idInscription = inscription.get().getIdInscription();

		Optional<EmargementIsoloir> dejaEmarge = emargementRepository.findByInscription_IdInscription(idInscription);
		if (dejaEmarge.isPresent()) {
			// Double scan dans le même isoloir (double-tap, mauvaise manip) : on confirme sans rien changer
			if (dejaEmarge.get().getIsoloir().getIdIsoloir().equals(idIsoloir)) {
				return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.success,
						"Identification réussie — vous pouvez voter dans l'isoloir.");
			}
			return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.already_voted,
					"Vous vous êtes déjà identifié dans un autre isoloir.");
		}

		if (bulletinRepository.existsByInscription_IdInscription(idInscription)) {
			return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.already_voted,
					"Vous avez déjà voté dans l'application.");
		}

		EmargementIsoloir emargement = new EmargementIsoloir();
		emargement.setInscription(inscription.get());
		emargement.setIsoloir(verification.isoloir());
		emargement.setEmargeLe(maintenant);
		emargementRepository.save(emargement);

		return journaliser(idUtilisateur, idIsoloir, maintenant, ResultatCheckin.success,
				"Identification réussie — vous pouvez voter dans l'isoloir.");
	}

	// Utilisé par l'appli pour savoir si elle propose encore le vote en ligne
	@Transactional(readOnly = true)
	public StatutVotant statut(Integer idUtilisateur) {
		Optional<Inscription> inscription = inscriptionRepository.findPeriodeOuverte(idUtilisateur);
		if (inscription.isEmpty()) {
			return StatutVotant.not_registered;
		}
		Integer idInscription = inscription.get().getIdInscription();
		if (emargementRepository.findByInscription_IdInscription(idInscription).isPresent()) {
			return StatutVotant.checked_in_isoloir;
		}
		if (bulletinRepository.existsByInscription_IdInscription(idInscription)) {
			return StatutVotant.voted_app;
		}
		return StatutVotant.not_voted;
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
