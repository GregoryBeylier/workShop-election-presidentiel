package fr.election.api.checkin;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.HexFormat;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.model.Isoloir;
import fr.election.api.repository.IsoloirRepository;
import fr.election.api.checkin.QrTokenService.QrCourant;

@Service
public class IsoloirService {

	private final IsoloirRepository isoloirRepository;
	private final QrTokenService qrTokenService;
	private final Clock clock;

	public IsoloirService(IsoloirRepository isoloirRepository, QrTokenService qrTokenService, Clock clock) {
		this.isoloirRepository = isoloirRepository;
		this.qrTokenService = qrTokenService;
		this.clock = clock;
	}

	/**
	 * QR à afficher sur la tablette. Réservé à la tablette de l'isoloir (clé tablette) :
	 * sans ça, n'importe qui pourrait récupérer le QR courant depuis chez lui et émarger à distance.
	 */
	public QrCourant qrCourant(Integer idIsoloir, String cleTablette) {
		Isoloir isoloir = isoloirRepository.findById(idIsoloir)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Isoloir inconnu"));

		byte[] attendu = isoloir.getCleTabletteHash().getBytes(StandardCharsets.US_ASCII);
		byte[] recu = cleTablette == null ? new byte[0] : sha256Hex(cleTablette).getBytes(StandardCharsets.US_ASCII);
		if (!MessageDigest.isEqual(attendu, recu)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Clé tablette invalide");
		}
		if (!isoloir.isActif()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Isoloir désactivé");
		}

		return qrTokenService.generer(isoloir, clock.instant());
	}

	public static String sha256Hex(String valeur) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(valeur.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 indisponible", e);
		}
	}

}
