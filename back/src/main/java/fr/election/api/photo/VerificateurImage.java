package fr.election.api.photo;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

// Contrôle commun aux photos et aux logos : fichier présent, taille, format réel (JPEG, PNG ou WebP)
@Component
public class VerificateurImage {

	// Le front redimensionne avant l'envoi (quelques dizaines de Ko) : 2 Mo laisse de la marge
	private static final long TAILLE_MAX = 2 * 1024 * 1024;

	public ImageRecue verifier(MultipartFile fichier) {
		if (fichier == null || fichier.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune image reçue");
		}
		if (fichier.getSize() > TAILLE_MAX) {
			throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image trop lourde (2 Mo maximum)");
		}
		byte[] contenu;
		try {
			contenu = fichier.getBytes();
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image illisible");
		}
		// Type lu dans le fichier lui-même, pas dans l'en-tête envoyé par le navigateur
		String typeMime = typeImage(contenu);
		if (typeMime == null) {
			throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Formats acceptés : JPEG, PNG ou WebP");
		}
		return new ImageRecue(contenu, typeMime);
	}

	// Signature des premiers octets : JPEG (FF D8 FF), PNG (89 'PNG'), WebP ('RIFF' .... 'WEBP')
	private static String typeImage(byte[] o) {
		if (o.length > 3 && (o[0] & 0xFF) == 0xFF && (o[1] & 0xFF) == 0xD8 && (o[2] & 0xFF) == 0xFF) {
			return "image/jpeg";
		}
		if (o.length > 8 && (o[0] & 0xFF) == 0x89 && o[1] == 'P' && o[2] == 'N' && o[3] == 'G') {
			return "image/png";
		}
		if (o.length > 12 && o[0] == 'R' && o[1] == 'I' && o[2] == 'F' && o[3] == 'F'
				&& o[8] == 'W' && o[9] == 'E' && o[10] == 'B' && o[11] == 'P') {
			return "image/webp";
		}
		return null;
	}

}
