package fr.election.api.checkin;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;

import fr.election.api.model.Isoloir;
import fr.election.api.repository.IsoloirRepository;

/**
 * Génère et vérifie le code à 6 chiffres affiché sur l'écran de chaque isoloir.
 *
 * Code = HMAC-SHA256("CODE:{id_isoloir}:{id_fenetre}", clé de l'isoloir), tronqué à 6 chiffres comme un code TOTP.
 * - id_fenetre : instant serveur arrondi à la fenêtre de 30 s (le temps de lire et taper le code)
 * Le code prouve que le votant est devant l'écran : sans la clé, impossible de le calculer.
 * Il est accepté pendant sa fenêtre et la suivante (30 à 60 s), pour ne pas faire échouer
 * une saisie pile au moment où le code change.
 */
@Service
public class CodeIsoloirService {

	public static final long FENETRE_MS = 30_000;
	private static final int CHIFFRES = 6;

	public enum Resultat { VALIDE, INVALIDE }

	public record CodeCourant(String code, long expireDansMs) {}

	public record Verification(Resultat resultat, Isoloir isoloir) {}

	private final IsoloirRepository isoloirRepository;

	public CodeIsoloirService(IsoloirRepository isoloirRepository) {
		this.isoloirRepository = isoloirRepository;
	}

	public CodeCourant generer(Isoloir isoloir, Instant maintenant) {
		long fenetre = maintenant.toEpochMilli() / FENETRE_MS;
		long changeLe = (fenetre + 1) * FENETRE_MS;
		return new CodeCourant(code(isoloir, fenetre), changeLe - maintenant.toEpochMilli());
	}

	/**
	 * Retrouve l'isoloir dont le code courant (ou celui de la fenêtre précédente) est `code`.
	 * Le votant ne tape que le code : on le compare à celui de chaque isoloir actif.
	 * Deux isoloirs avec le même code (1 chance sur 500 000 par paire) : refusé, le code suivant passera.
	 */
	public Verification verifier(String code, Instant maintenant) {
		String saisi = code == null ? "" : code.replaceAll("\\s", "");
		if (!saisi.matches("\\d{" + CHIFFRES + "}")) {
			return new Verification(Resultat.INVALIDE, null);
		}

		long fenetreCourante = maintenant.toEpochMilli() / FENETRE_MS;
		byte[] recu = saisi.getBytes(StandardCharsets.US_ASCII);
		List<Isoloir> trouves = isoloirRepository.findByActifTrue().stream()
			.filter(isoloir -> correspond(isoloir, fenetreCourante, recu) || correspond(isoloir, fenetreCourante - 1, recu))
			.toList();
		return trouves.size() == 1
				? new Verification(Resultat.VALIDE, trouves.get(0))
				: new Verification(Resultat.INVALIDE, null);
	}

	// Comparaison en temps constant : le temps de réponse ne dit rien sur les chiffres justes
	private boolean correspond(Isoloir isoloir, long fenetre, byte[] recu) {
		return MessageDigest.isEqual(code(isoloir, fenetre).getBytes(StandardCharsets.US_ASCII), recu);
	}

	// Troncature dynamique de la RFC 4226 (HOTP) : 31 bits pris dans le HMAC, ramenés à 6 chiffres
	private String code(Isoloir isoloir, long fenetre) {
		byte[] h = hmac(isoloir, "CODE:" + isoloir.getIdIsoloir() + ":" + fenetre);
		int o = h[h.length - 1] & 0x0f;
		int valeur = ((h[o] & 0x7f) << 24) | ((h[o + 1] & 0xff) << 16) | ((h[o + 2] & 0xff) << 8) | (h[o + 3] & 0xff);
		return String.format("%06d", valeur % 1_000_000);
	}

	private byte[] hmac(Isoloir isoloir, String message) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(HexFormat.of().parseHex(isoloir.getCleHmac()), "HmacSHA256"));
			return mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException("HMAC-SHA256 indisponible", e);
		}
	}

}
