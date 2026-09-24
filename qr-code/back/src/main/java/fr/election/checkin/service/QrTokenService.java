package fr.election.checkin.service;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;

import fr.election.checkin.model.Isoloir;
import fr.election.checkin.repository.IsoloirRepository;

/**
 * Génère et vérifie les QR affichés dans les isoloirs.
 *
 * Format du QR : CHK1.{id_isoloir}.{id_fenetre}.{expire_le_ms}.{signature}
 * - id_fenetre : instant serveur arrondi à la fenêtre de 5 s
 * - signature  : HMAC-SHA256("{id_isoloir}:{id_fenetre}", clé de l'isoloir), en base64url
 * Un QR est accepté pendant sa fenêtre et la suivante (5 à 10 s, ~7,5 s en moyenne)
 * pour ne pas faire échouer un scan pile au moment de la rotation.
 */
@Service
public class QrTokenService {

	public static final long FENETRE_MS = 5_000;
	private static final String PREFIXE = "CHK1";

	public enum Resultat { VALIDE, EXPIRE, INVALIDE }

	public record QrCourant(String payload, long expireDansMs) {}

	public record Verification(Resultat resultat, Isoloir isoloir) {}

	private final IsoloirRepository isoloirRepository;

	public QrTokenService(IsoloirRepository isoloirRepository) {
		this.isoloirRepository = isoloirRepository;
	}

	public QrCourant generer(Isoloir isoloir, Instant maintenant) {
		long fenetre = maintenant.toEpochMilli() / FENETRE_MS;
		long expireLe = (fenetre + 2) * FENETRE_MS;
		String payload = String.join(".", PREFIXE, isoloir.getIdIsoloir().toString(), Long.toString(fenetre),
				Long.toString(expireLe), signer(isoloir, fenetre));
		return new QrCourant(payload, expireLe - maintenant.toEpochMilli());
	}

	public Verification verifier(String qrToken, Instant maintenant) {
		String[] parties = qrToken == null ? new String[0] : qrToken.trim().split("\\.");
		if (parties.length != 5 || !PREFIXE.equals(parties[0])) {
			return new Verification(Resultat.INVALIDE, null);
		}

		int idIsoloir;
		long fenetre;
		try {
			idIsoloir = Integer.parseInt(parties[1]);
			fenetre = Long.parseLong(parties[2]);
		} catch (NumberFormatException e) {
			return new Verification(Resultat.INVALIDE, null);
		}

		Optional<Isoloir> isoloir = isoloirRepository.findById(idIsoloir).filter(Isoloir::isActif);
		if (isoloir.isEmpty()) {
			return new Verification(Resultat.INVALIDE, null);
		}

		// On ne fait confiance qu'à la signature et à l'horloge serveur (expire_le n'est qu'indicatif)
		byte[] attendue = signer(isoloir.get(), fenetre).getBytes(StandardCharsets.US_ASCII);
		if (!MessageDigest.isEqual(attendue, parties[4].getBytes(StandardCharsets.US_ASCII))) {
			return new Verification(Resultat.INVALIDE, isoloir.get());
		}

		long fenetreCourante = maintenant.toEpochMilli() / FENETRE_MS;
		if (fenetre == fenetreCourante || fenetre == fenetreCourante - 1) {
			return new Verification(Resultat.VALIDE, isoloir.get());
		}
		// Une fenêtre future ne peut pas venir du serveur : QR forgé
		return new Verification(fenetre > fenetreCourante ? Resultat.INVALIDE : Resultat.EXPIRE, isoloir.get());
	}

	private String signer(Isoloir isoloir, long fenetre) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(HexFormat.of().parseHex(isoloir.getCleHmac()), "HmacSHA256"));
			byte[] signature = mac.doFinal((isoloir.getIdIsoloir() + ":" + fenetre).getBytes(StandardCharsets.UTF_8));
			return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException("HMAC-SHA256 indisponible", e);
		}
	}

}
