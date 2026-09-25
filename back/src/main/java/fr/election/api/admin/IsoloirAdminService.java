package fr.election.api.admin;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.admin.dto.IsoloirAdminDto;
import fr.election.api.admin.dto.IsoloirCreeDto;
import fr.election.api.checkin.CheckinService;
import fr.election.api.checkin.IsoloirService;
import fr.election.api.model.EmargementIsoloir;
import fr.election.api.model.Isoloir;
import fr.election.api.repository.AffrontementRepository;
import fr.election.api.repository.BulletinRepository;
import fr.election.api.repository.ChoixProvisoireRepository;
import fr.election.api.repository.EmargementIsoloirRepository;
import fr.election.api.repository.InscriptionRepository;
import fr.election.api.repository.IsoloirRepository;

// Back office des isoloirs (écran QR + borne ESP32) : création avec ses clés, suivi, désactivation,
// et reprise en main d'un vote bloqué sur une borne (recommencer ou annuler)
@Service
public class IsoloirAdminService {

	private static final Logger log = LoggerFactory.getLogger(IsoloirAdminService.class);
	private static final SecureRandom ALEA = new SecureRandom();

	private final IsoloirRepository isoloirRepository;
	private final EmargementIsoloirRepository emargementRepository;
	private final ChoixProvisoireRepository choixRepository;
	private final InscriptionRepository inscriptionRepository;
	private final BulletinRepository bulletinRepository;
	private final AffrontementRepository affrontementRepository;
	private final Clock clock;

	public IsoloirAdminService(IsoloirRepository isoloirRepository, EmargementIsoloirRepository emargementRepository,
			ChoixProvisoireRepository choixRepository, InscriptionRepository inscriptionRepository,
			BulletinRepository bulletinRepository, AffrontementRepository affrontementRepository, Clock clock) {
		this.isoloirRepository = isoloirRepository;
		this.emargementRepository = emargementRepository;
		this.choixRepository = choixRepository;
		this.inscriptionRepository = inscriptionRepository;
		this.bulletinRepository = bulletinRepository;
		this.affrontementRepository = affrontementRepository;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public List<IsoloirAdminDto> lister() {
		LocalDateTime limite = LocalDateTime.now(clock).minus(CheckinService.DELAI_BORNE_EN_LIGNE);
		return isoloirRepository.findAll().stream()
			.sorted((a, b) -> a.getIdIsoloir().compareTo(b.getIdIsoloir()))
			.map(i -> {
				Optional<IsoloirAdminDto.VoteEnCours> vote = voteEnCours(i.getIdIsoloir());
				return new IsoloirAdminDto(i.getIdIsoloir(), i.getLibelle(), i.isActif(), i.aUneBorne(),
						i.getDerniereActiviteBorne() != null && !i.getDerniereActiviteBorne().isBefore(limite),
						vote.isPresent(), vote.orElse(null));
			})
			.toList();
	}

	private Optional<IsoloirAdminDto.VoteEnCours> voteEnCours(Integer idIsoloir) {
		return emargementRepository.findVotesOuverts(idIsoloir).stream().findFirst().map(vote -> {
			int total = affrontementRepository.findByPeriode(vote.getInscription().getPeriode().getIdPeriode()).size();
			int faits = choixRepository.findByIdEmargement(vote.getIdEmargement()).size();
			return new IsoloirAdminDto.VoteEnCours(vote.getInscription().getUtilisateur().getEmail(),
					Math.min(faits + 1, total), total, vote.getEmargeLe());
		});
	}

	/**
	 * Recommencer : efface les choix déjà faits sur la borne. Le votant reste identifié dans l'isoloir ;
	 * au prochain bouton, la borne est renvoyée au premier duel.
	 */
	@Transactional
	public void recommencerVote(Integer idIsoloir, Integer idAdmin) {
		EmargementIsoloir vote = voteOuvertVerrouille(idIsoloir);
		choixRepository.deleteByIdEmargement(vote.getIdEmargement());
		log.warn("Vote recommencé par l'admin {} sur l'isoloir {} (votant {})", idAdmin, idIsoloir,
				vote.getInscription().getUtilisateur().getEmail());
	}

	/**
	 * Annuler : efface les choix et l'émargement. La borne se libère et le votant redevient « n'a pas voté » :
	 * il peut rescanner un isoloir, ou voter en ligne.
	 */
	@Transactional
	public void annulerVote(Integer idIsoloir, Integer idAdmin) {
		EmargementIsoloir vote = voteOuvertVerrouille(idIsoloir);
		choixRepository.deleteByIdEmargement(vote.getIdEmargement());
		choixRepository.flush();
		emargementRepository.delete(vote);
		log.warn("Vote annulé par l'admin {} sur l'isoloir {} (votant {})", idAdmin, idIsoloir,
				vote.getInscription().getUtilisateur().getEmail());
	}

	// Le vote en cours sur l'isoloir, sous le même verrou que la borne et le check-in : si la borne écrit
	// le bulletin au même moment, un seul des deux passe, et un vote terminé n'est jamais touché
	private EmargementIsoloir voteOuvertVerrouille(Integer idIsoloir) {
		EmargementIsoloir vote = emargementRepository.findVotesOuverts(idIsoloir).stream().findFirst()
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Aucun vote en cours sur cet isoloir"));
		inscriptionRepository.findPeriodeOuverteForUpdate(vote.getInscription().getUtilisateur().getIdUtilisateur());
		if (bulletinRepository.existsByInscriptionIdInscription(vote.getInscription().getIdInscription())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce vote vient de se terminer : il est enregistré");
		}
		return vote;
	}

	/**
	 * Crée un isoloir avec trois secrets tirés au hasard : la clé qui signe ses QR (reste dans la base),
	 * la clé de l'écran et la clé de la borne (renvoyées une seule fois, la base n'en garde que l'empreinte).
	 */
	@Transactional
	public IsoloirCreeDto creer(String libelle) {
		String cleEcran = aleaHex(24);
		String cleBorne = aleaHex(24);

		Isoloir isoloir = new Isoloir();
		isoloir.setLibelle(libelle.strip());
		isoloir.setCleHmac(aleaHex(32));
		isoloir.setCleTabletteHash(IsoloirService.sha256Hex(cleEcran));
		isoloir.setCleBorneHash(IsoloirService.sha256Hex(cleBorne));
		isoloirRepository.save(isoloir);

		return new IsoloirCreeDto(isoloir.getIdIsoloir(), isoloir.getLibelle(), cleEcran, cleBorne);
	}

	// Écran ou borne perdu / manipulé : ses QR et sa borne sont refusés tout de suite. On en crée un autre.
	@Transactional
	public void desactiver(Integer idIsoloir) {
		Isoloir isoloir = isoloirRepository.findById(idIsoloir)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Isoloir inconnu"));
		isoloir.setActif(false);
	}

	private static String aleaHex(int octets) {
		byte[] alea = new byte[octets];
		ALEA.nextBytes(alea);
		return HexFormat.of().formatHex(alea);
	}

}
