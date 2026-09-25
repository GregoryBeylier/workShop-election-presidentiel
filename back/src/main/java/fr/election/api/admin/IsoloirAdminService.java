package fr.election.api.admin;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.admin.dto.IsoloirAdminDto;
import fr.election.api.admin.dto.IsoloirCreeDto;
import fr.election.api.checkin.CheckinService;
import fr.election.api.checkin.IsoloirService;
import fr.election.api.model.Isoloir;
import fr.election.api.repository.EmargementIsoloirRepository;
import fr.election.api.repository.IsoloirRepository;

// Back office des isoloirs (écran du code + borne ESP32) : création avec ses clés, suivi, désactivation
@Service
public class IsoloirAdminService {

	private static final SecureRandom ALEA = new SecureRandom();

	private final IsoloirRepository isoloirRepository;
	private final EmargementIsoloirRepository emargementRepository;
	private final Clock clock;

	public IsoloirAdminService(IsoloirRepository isoloirRepository, EmargementIsoloirRepository emargementRepository,
			Clock clock) {
		this.isoloirRepository = isoloirRepository;
		this.emargementRepository = emargementRepository;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public List<IsoloirAdminDto> lister() {
		LocalDateTime limite = LocalDateTime.now(clock).minus(CheckinService.DELAI_BORNE_EN_LIGNE);
		return isoloirRepository.findAll().stream()
			.sorted((a, b) -> a.getIdIsoloir().compareTo(b.getIdIsoloir()))
			.map(i -> new IsoloirAdminDto(i.getIdIsoloir(), i.getLibelle(), i.isActif(), i.aUneBorne(),
					i.getDerniereActiviteBorne() != null && !i.getDerniereActiviteBorne().isBefore(limite),
					emargementRepository.existsVoteOuvert(i.getIdIsoloir())))
			.toList();
	}

	/**
	 * Crée un isoloir avec trois secrets tirés au hasard : la clé qui calcule ses codes (reste dans la base),
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

	// Écran ou borne perdu / manipulé : ses codes et sa borne sont refusés tout de suite. On en crée un autre.
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
