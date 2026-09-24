package fr.election.api.election;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.election.dto.CandidatDto;
import fr.election.api.election.dto.DuelDto;
import fr.election.api.election.dto.MonVoteDto;
import fr.election.api.election.dto.PeriodeDto;
import fr.election.api.election.dto.ResultatCandidatDto;
import fr.election.api.election.dto.ResultatsDto;
import fr.election.api.model.Affrontement;
import fr.election.api.model.Bulletin;
import fr.election.api.model.Candidat;
import fr.election.api.model.Inscription;
import fr.election.api.model.LigneVote;
import fr.election.api.model.PeriodeVote;
import fr.election.api.repository.AffrontementRepository;
import fr.election.api.repository.BulletinRepository;
import fr.election.api.repository.CandidatRepository;
import fr.election.api.repository.EmargementIsoloirRepository;
import fr.election.api.repository.InscriptionRepository;
import fr.election.api.repository.LigneVoteRepository;
import fr.election.api.repository.PeriodeVoteRepository;

@Service
public class ElectionService {

	private static final BigDecimal POINTS_VICTOIRE = BigDecimal.ONE;
	private static final BigDecimal POINTS_EGALITE = new BigDecimal("0.5");

	private final PeriodeVoteRepository periodeRepository;
	private final CandidatRepository candidatRepository;
	private final AffrontementRepository affrontementRepository;
	private final InscriptionRepository inscriptionRepository;
	private final BulletinRepository bulletinRepository;
	private final LigneVoteRepository ligneVoteRepository;
	private final EmargementIsoloirRepository emargementIsoloirRepository;

	public ElectionService(PeriodeVoteRepository periodeRepository, CandidatRepository candidatRepository,
			AffrontementRepository affrontementRepository, InscriptionRepository inscriptionRepository,
			BulletinRepository bulletinRepository, LigneVoteRepository ligneVoteRepository,
			EmargementIsoloirRepository emargementIsoloirRepository) {
		this.periodeRepository = periodeRepository;
		this.candidatRepository = candidatRepository;
		this.affrontementRepository = affrontementRepository;
		this.inscriptionRepository = inscriptionRepository;
		this.bulletinRepository = bulletinRepository;
		this.ligneVoteRepository = ligneVoteRepository;
		this.emargementIsoloirRepository = emargementIsoloirRepository;
	}

	@Transactional(readOnly = true)
	public PeriodeDto periode() {
		return versDto(periodeEnCours());
	}

	@Transactional(readOnly = true)
	public List<CandidatDto> candidats() {
		return candidatRepository.findByPeriodeIdPeriodeOrderByIdCandidat(periodeEnCours().getIdPeriode()).stream()
			.map(CandidatDto::de)
			.toList();
	}

	// Duels de la période, avec pour chacun si l'électeur l'a déjà voté
	@Transactional(readOnly = true)
	public MonVoteDto monVote(Integer idUtilisateur) {
		PeriodeVote periode = periodeEnCours();
		Inscription inscription = inscriptionRepository
			.findByUtilisateurIdUtilisateurAndPeriodeIdPeriode(idUtilisateur, periode.getIdPeriode())
			.orElse(null);

		Set<Integer> faits = inscription == null ? Set.of()
				: bulletinRepository.findByInscriptionIdInscription(inscription.getIdInscription())
					.map(b -> ligneVoteRepository.findByBulletinIdBulletin(b.getIdBulletin()).stream()
						.map(l -> l.getAffrontement().getIdAffrontement())
						.collect(Collectors.toSet()))
					.orElse(Set.of());

		List<DuelDto> duels = affrontementRepository.findByPeriode(periode.getIdPeriode()).stream()
			.map(a -> new DuelDto(a.getIdAffrontement(), CandidatDto.de(a.getCandidat1()),
					CandidatDto.de(a.getCandidat2()), faits.contains(a.getIdAffrontement())))
			.toList();
		return new MonVoteDto(inscription != null, duels);
	}

	@Transactional
	public void voter(Integer idUtilisateur, Integer idAffrontement, Integer idCandidatChoisi) {
		PeriodeVote periode = periodeEnCours();
		if (!periode.isStatut()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Le scrutin est clos");
		}

		// Verrou sur l'inscription (même verrou que le check-in isoloir) : un vote en ligne et un scan
		// simultanés passent l'un après l'autre, jamais les deux. La période vient d'être vérifiée ouverte.
		Inscription inscription = inscriptionRepository.findPeriodeOuverteForUpdate(idUtilisateur)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
					"Vous n'êtes pas inscrit à ce scrutin"));

		// Identifié à l'isoloir => il vote sur papier, plus en ligne (même en appelant l'API directement)
		if (emargementIsoloirRepository.findByInscription_IdInscription(inscription.getIdInscription()).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Vous êtes identifié dans un isoloir : votez sur le bulletin papier.");
		}

		Affrontement affrontement = affrontementRepository.findByPeriode(periode.getIdPeriode()).stream()
			.filter(a -> a.getIdAffrontement().equals(idAffrontement))
			.findFirst()
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Duel introuvable"));

		Candidat choisi = null;
		if (idCandidatChoisi != null) {
			choisi = List.of(affrontement.getCandidat1(), affrontement.getCandidat2()).stream()
				.filter(c -> c.getIdCandidat().equals(idCandidatChoisi))
				.findFirst()
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Ce candidat ne participe pas à ce duel"));
		}

		// Le bulletin est créé au premier duel voté
		Bulletin bulletin = bulletinRepository.findByInscriptionIdInscription(inscription.getIdInscription())
			.orElseGet(() -> {
				Bulletin nouveau = new Bulletin();
				nouveau.setInscription(inscription);
				return bulletinRepository.save(nouveau);
			});

		if (ligneVoteRepository.existsByBulletinIdBulletinAndAffrontementIdAffrontement(bulletin.getIdBulletin(),
				idAffrontement)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Vous avez déjà voté pour ce duel");
		}

		LigneVote ligne = new LigneVote();
		ligne.setBulletin(bulletin);
		ligne.setAffrontement(affrontement);
		ligne.setCandidatChoisi(choisi);
		ligneVoteRepository.save(ligne);
	}

	// Par duel : 1 point au gagnant, 0,5 à chacun en cas d'égalité, 0 au perdant.
	// Visible uniquement une fois le scrutin clos.
	@Transactional(readOnly = true)
	public ResultatsDto resultats() {
		PeriodeVote periode = periodeEnCours();
		if (!PeriodeVote.CLOS.equals(periode.getEtat())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Les résultats seront publiés à la clôture");
		}
		return new ResultatsDto(versDto(periode), classement(periode));
	}

	// Classement de la période, calculé à partir des lignes de vote (appelé dans une transaction)
	public List<ResultatCandidatDto> classement(PeriodeVote periode) {
		Map<Integer, Score> scores = new LinkedHashMap<>();
		for (Candidat candidat : candidatRepository.findByPeriodeIdPeriodeOrderByIdCandidat(periode.getIdPeriode())) {
			scores.put(candidat.getIdCandidat(), new Score(CandidatDto.de(candidat)));
		}

		for (LigneVote ligne : ligneVoteRepository.findByPeriode(periode.getIdPeriode())) {
			Score s1 = scores.get(ligne.getAffrontement().getCandidat1().getIdCandidat());
			Score s2 = scores.get(ligne.getAffrontement().getCandidat2().getIdCandidat());
			if (ligne.getCandidatChoisi() == null) {
				s1.egalite();
				s2.egalite();
			} else if (ligne.getCandidatChoisi().getIdCandidat().equals(s1.candidat.id())) {
				s1.victoire();
				s2.defaite();
			} else {
				s2.victoire();
				s1.defaite();
			}
		}

		return scores.values().stream()
			.map(Score::versDto)
			.sorted(Comparator.comparing(ResultatCandidatDto::points).reversed())
			.toList();
	}

	public PeriodeVote periodeEnCours() {
		return periodeRepository.findFirstByOrderByIdPeriodeDesc()
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun scrutin"));
	}

	public PeriodeDto versDto(PeriodeVote periode) {
		int nbDuels = affrontementRepository.findByPeriode(periode.getIdPeriode()).size();
		return new PeriodeDto(periode.getIdPeriode(), periode.getEtat(), periode.isStatut(), periode.getOuvertLe(),
				periode.getClosLe(),
				nbDuels, inscriptionRepository.countByPeriodeIdPeriode(periode.getIdPeriode()),
				nbDuels == 0 ? 0 : bulletinRepository.countComplets(periode.getIdPeriode(), nbDuels));
	}

	private static final class Score {

		private final CandidatDto candidat;
		private BigDecimal points = BigDecimal.ZERO;
		private int victoires;
		private int egalites;
		private int defaites;

		Score(CandidatDto candidat) {
			this.candidat = candidat;
		}

		void victoire() {
			points = points.add(POINTS_VICTOIRE);
			victoires++;
		}

		void egalite() {
			points = points.add(POINTS_EGALITE);
			egalites++;
		}

		void defaite() {
			defaites++;
		}

		ResultatCandidatDto versDto() {
			return new ResultatCandidatDto(candidat, points, victoires, egalites, defaites);
		}

	}

}
