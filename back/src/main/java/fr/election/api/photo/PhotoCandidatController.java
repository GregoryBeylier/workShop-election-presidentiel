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
import fr.election.api.model.ImageCandidat;

// Photos et logos des candidats : envoi / suppression par l'admin (/api/admin/**),
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

	@PutMapping(path = "/api/admin/candidats/{idCandidat}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public CandidatDto envoyerLogo(@PathVariable Integer idCandidat, @RequestParam("logo") MultipartFile logo) {
		return photoService.enregistrerLogo(idCandidat, logo);
	}

	@DeleteMapping("/api/admin/candidats/{idCandidat}/logo")
	public CandidatDto supprimerLogo(@PathVariable Integer idCandidat) {
		return photoService.supprimerLogo(idCandidat);
	}

	@GetMapping("/api/candidats/{idCandidat}/photo")
	public ResponseEntity<byte[]> lire(@PathVariable Integer idCandidat) {
		return image(photoService.lire(idCandidat));
	}

	@GetMapping("/api/candidats/{idCandidat}/logo")
	public ResponseEntity<byte[]> lireLogo(@PathVariable Integer idCandidat) {
		return image(photoService.lireLogo(idCandidat));
	}

	// L'URL contient une version (?v=…) qui change à chaque envoi : on peut la garder en cache longtemps
	private static ResponseEntity<byte[]> image(ImageCandidat image) {
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType(image.getTypeMime()))
			.cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
			.body(image.getContenu());
	}

}
