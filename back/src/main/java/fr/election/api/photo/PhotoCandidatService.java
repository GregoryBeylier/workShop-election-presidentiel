package fr.election.api.photo;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.election.dto.CandidatDto;
import fr.election.api.model.Candidat;
import fr.election.api.model.CandidatPhoto;
import fr.election.api.repository.CandidatPhotoRepository;
import fr.election.api.repository.CandidatRepository;

@Service
public class PhotoCandidatService {

	// Le front redimensionne avant l'envoi (quelques dizaines de Ko) : 2 Mo laisse de la marge
	private static final long TAILLE_MAX = 2 * 1024 * 1024;

	private final CandidatRepository candidatRepository;
	private final CandidatPhotoRepository photoRepository;

	public PhotoCandidatService(CandidatRepository candidatRepository, CandidatPhotoRepository photoRepository) {
		this.candidatRepository = candidatRepository;
		this.photoRepository = photoRepository;
	}

	// Remplace la photo du candidat ; l'URL change à chaque envoi pour contourner le cache navigateur
	@Transactional
	public CandidatDto enregistrer(Integer idCandidat, MultipartFile fichier) {
		Candidat candidat = candidat(idCandidat);
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

		CandidatPhoto photo = photoRepository.findById(idCandidat).orElseGet(CandidatPhoto::new);
		photo.setIdCandidat(idCandidat);
		photo.setContenu(contenu);
		photo.setTypeMime(typeMime);
		photo.setMajLe(LocalDateTime.now());
		photoRepository.save(photo);

		long version = photo.getMajLe().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
		candidat.setPhoto("/api/candidats/" + idCandidat + "/photo?v=" + version);
		return CandidatDto.de(candidat);
	}

	@Transactional
	public CandidatDto supprimer(Integer idCandidat) {
		Candidat candidat = candidat(idCandidat);
		photoRepository.deleteById(idCandidat);
		candidat.setPhoto(null);
		return CandidatDto.de(candidat);
	}

	@Transactional(readOnly = true)
	public CandidatPhoto lire(Integer idCandidat) {
		return photoRepository.findById(idCandidat)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pas de photo pour ce candidat"));
	}

	private Candidat candidat(Integer idCandidat) {
		return candidatRepository.findById(idCandidat)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidat introuvable"));
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
