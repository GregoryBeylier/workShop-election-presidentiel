package fr.election.api.photo;

import java.time.Duration;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import fr.election.api.election.dto.CandidatDto;
import fr.election.api.model.CandidatPhoto;

// Photos des candidats : envoi / suppression par l'admin (/api/admin/**),
// lecture publique car une balise <img> n'envoie pas le JWT (voir SecurityConfig)
@RestController
public class PhotoCandidatController {

	private final PhotoCandidatService photoService;

	public PhotoCandidatController(PhotoCandidatService photoService) {
		this.photoService = photoService;
	}

	@PutMapping(path = "/api/admin/candidats/{idCandidat}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public CandidatDto envoyer(@PathVariable Integer idCandidat, @RequestParam("photo") MultipartFile photo) {
		return photoService.enregistrer(idCandidat, photo);
	}

	@DeleteMapping("/api/admin/candidats/{idCandidat}/photo")
	public CandidatDto supprimer(@PathVariable Integer idCandidat) {
		return photoService.supprimer(idCandidat);
	}

	// L'URL contient une version (?v=…) qui change à chaque envoi : on peut la garder en cache longtemps
	@GetMapping("/api/candidats/{idCandidat}/photo")
	public ResponseEntity<byte[]> lire(@PathVariable Integer idCandidat) {
		CandidatPhoto photo = photoService.lire(idCandidat);
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType(photo.getTypeMime()))
			.cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
			.body(photo.getContenu());
	}

}
