package fr.election.api.photo;

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

// Logos des candidats : mêmes règles que les photos (envoi / suppression admin, lecture publique)
@RestController
public class LogoCandidatController {

	private final LogoCandidatService logoService;

	public LogoCandidatController(LogoCandidatService logoService) {
		this.logoService = logoService;
	}

	@PutMapping(path = "/api/admin/candidats/{idCandidat}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public CandidatDto envoyer(@PathVariable Integer idCandidat, @RequestParam("logo") MultipartFile logo) {
		return logoService.enregistrer(idCandidat, logo);
	}

	@DeleteMapping("/api/admin/candidats/{idCandidat}/logo")
	public CandidatDto supprimer(@PathVariable Integer idCandidat) {
		return logoService.supprimer(idCandidat);
	}

	@GetMapping("/api/candidats/{idCandidat}/logo")
	public ResponseEntity<byte[]> lire(@PathVariable Integer idCandidat) {
		return ImagesCandidat.reponse(logoService.lire(idCandidat));
	}

}
