package fr.election.api.photo;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import fr.election.api.model.ImageCandidat;

// Outils partagés par les photos et les logos : remplissage de l'image, URL versionnée, réponse HTTP
final class ImagesCandidat {

	private ImagesCandidat() {
	}

	static void remplir(ImageCandidat image, ImageRecue recue) {
		image.setContenu(recue.contenu());
		image.setTypeMime(recue.typeMime());
		image.setMajLe(LocalDateTime.now());
	}

	// L'URL change à chaque envoi (?v=…) pour contourner le cache navigateur
	static String url(ImageCandidat image, String sorte) {
		long version = image.getMajLe().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
		return "/api/candidats/" + image.getIdCandidat() + "/" + sorte + "?v=" + version;
	}

	// L'URL étant versionnée, on peut garder l'image en cache longtemps
	static ResponseEntity<byte[]> reponse(ImageCandidat image) {
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType(image.getTypeMime()))
			.cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
			.body(image.getContenu());
	}

}
