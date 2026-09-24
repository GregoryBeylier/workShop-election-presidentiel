package fr.election.api.photo;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.election.dto.CandidatDto;
import fr.election.api.model.Candidat;
import fr.election.api.model.CandidatLogo;
import fr.election.api.repository.CandidatLogoRepository;
import fr.election.api.repository.CandidatRepository;

// Logo du candidat, dans les colonnes logo_* de sa ligne candidat : on remplit ou on vide ces colonnes,
// les changements sont enregistrés à la fin de la transaction
@Service
public class LogoCandidatService {

	private final CandidatRepository candidatRepository;
	private final CandidatLogoRepository logoRepository;
	private final VerificateurImage verificateur;

	public LogoCandidatService(CandidatRepository candidatRepository, CandidatLogoRepository logoRepository,
			VerificateurImage verificateur) {
		this.candidatRepository = candidatRepository;
		this.logoRepository = logoRepository;
		this.verificateur = verificateur;
	}

	@Transactional
	public CandidatDto enregistrer(Integer idCandidat, MultipartFile fichier) {
		ImageRecue recue = verificateur.verifier(fichier);
		Candidat candidat = candidat(idCandidat);
		CandidatLogo logo = logo(idCandidat);
		ImagesCandidat.remplir(logo, recue);
		candidat.setLogo(ImagesCandidat.url(logo, "logo"));
		return CandidatDto.de(candidat);
	}

	@Transactional
	public CandidatDto supprimer(Integer idCandidat) {
		Candidat candidat = candidat(idCandidat);
		logo(idCandidat).vider();
		candidat.setLogo(null);
		return CandidatDto.de(candidat);
	}

	@Transactional(readOnly = true)
	public CandidatLogo lire(Integer idCandidat) {
		CandidatLogo logo = logo(idCandidat);
		if (logo.estVide()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pas de logo pour ce candidat");
		}
		return logo;
	}

	private Candidat candidat(Integer idCandidat) {
		return candidatRepository.findById(idCandidat)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidat introuvable"));
	}

	private CandidatLogo logo(Integer idCandidat) {
		return logoRepository.findById(idCandidat)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidat introuvable"));
	}

}
