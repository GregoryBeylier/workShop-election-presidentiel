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
import fr.election.api.model.CandidatLogo;
import fr.election.api.model.CandidatPhoto;
import fr.election.api.model.ImageCandidat;
import fr.election.api.repository.CandidatLogoRepository;
import fr.election.api.repository.CandidatPhotoRepository;
import fr.election.api.repository.CandidatRepository;

@Service
public class PhotoCandidatService {

	// Le front redimensionne avant l'envoi (quelques dizaines de Ko) : 2 Mo laisse de la marge
	private static final long TAILLE_MAX = 2 * 1024 * 1024;

	private final CandidatRepository candidatRepository;
	private final CandidatPhotoRepository photoRepository;
	private final CandidatLogoRepository logoRepository;

	public PhotoCandidatService(CandidatRepository candidatRepository, CandidatPhotoRepository photoRepository,
			CandidatLogoRepository logoRepository) {
		this.candidatRepository = candidatRepository;
		this.photoRepository = photoRepository;
		this.logoRepository = logoRepository;
	}

	// Remplace la photo du candidat ; l'URL change à chaque envoi pour contourner le cache navigateur
	@Transactional
	public CandidatDto enregistrer(Integer idCandidat, MultipartFile fichier) {
		Candidat candidat = candidat(idCandidat);
		CandidatPhoto photo = photoRepository.findById(idCandidat).orElseGet(CandidatPhoto::new);
		photoRepository.save(remplir(photo, idCandidat, fichier));
		candidat.setPhoto(url(photo, "photo"));
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

	// Même principe pour le logo (PNG transparent conservé par le front)
	@Transactional
	public CandidatDto enregistrerLogo(Integer idCandidat, MultipartFile fichier) {
		Candidat candidat = candidat(idCandidat);
		CandidatLogo logo = logoRepository.findById(idCandidat).orElseGet(CandidatLogo::new);
		logoRepository.save(remplir(logo, idCandidat, fichier));
		candidat.setLogo(url(logo, "logo"));
		return CandidatDto.de(candidat);
	}

	@Transactional
	public CandidatDto supprimerLogo(Integer idCandidat) {
		Candidat candidat = candidat(idCandidat);
		logoRepository.deleteById(idCandidat);
		candidat.setLogo(null);
		return CandidatDto.de(candidat);
	}

	@Transactional(readOnly = true)
	public CandidatLogo lireLogo(Integer idCandidat) {
		return logoRepository.findById(idCandidat)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pas de logo pour ce candidat"));
	}

	// Vérifie le fichier reçu et le copie dans l'image
	private static <T extends ImageCandidat> T remplir(T image, Integer idCandidat, MultipartFile fichier) {
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

		image.setIdCandidat(idCandidat);
		image.setContenu(contenu);
		image.setTypeMime(typeMime);
		image.setMajLe(LocalDateTime.now());
		return image;
	}

	private static String url(ImageCandidat image, String sorte) {
		long version = image.getMajLe().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
		return "/api/candidats/" + image.getIdCandidat() + "/" + sorte + "?v=" + version;
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
