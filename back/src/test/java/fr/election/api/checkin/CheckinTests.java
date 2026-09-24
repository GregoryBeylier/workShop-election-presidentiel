package fr.election.api.checkin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.server.ResponseStatusException;

import fr.election.api.admin.IsoloirAdminService;
import fr.election.api.admin.dto.IsoloirCreeDto;
import fr.election.api.auth.JwtService;
import fr.election.api.checkin.CheckinService.ResultatCheckin;
import fr.election.api.checkin.CheckinService.ResultatVoteEnLigne;
import fr.election.api.checkin.CheckinService.StatutVotant;
import fr.election.api.election.ElectionService;
import fr.election.api.election.dto.ResultatCandidatDto;
import fr.election.api.model.Affrontement;
import fr.election.api.model.Bulletin;
import fr.election.api.model.Candidat;
import fr.election.api.model.Inscription;
import fr.election.api.model.Isoloir;
import fr.election.api.model.PeriodeVote;
import fr.election.api.model.Utilisateur;
import fr.election.api.repository.AffrontementRepository;
import fr.election.api.repository.BulletinRepository;
import fr.election.api.repository.CandidatRepository;
import fr.election.api.repository.EmargementIsoloirRepository;
import fr.election.api.repository.InscriptionRepository;
import fr.election.api.repository.IsoloirRepository;
import fr.election.api.repository.JournalCheckinRepository;
import fr.election.api.repository.LigneVoteRepository;
import fr.election.api.repository.PeriodeVoteRepository;
import fr.election.api.repository.UtilisateurRepository;

// Votants : alice et chloe n'ont pas voté, bob a voté en ligne, david n'est pas inscrit
@SpringBootTest
class CheckinTests {

	// Début d'une fenêtre de 5 s
	private static final Instant T0 = Instant.ofEpochMilli(1_800_000_000_000L);

	@TestConfiguration
	static class Config {
		@Bean
		@Primary
		HorlogeTest horlogeTest() {
			return new HorlogeTest(T0);
		}
	}

	@Autowired HorlogeTest horloge;
	@Autowired CheckinService checkinService;
	@Autowired QrTokenService qrTokenService;
	@Autowired JwtService jwtService;
	@Autowired UtilisateurRepository utilisateurRepository;
	@Autowired PeriodeVoteRepository periodeRepository;
	@Autowired InscriptionRepository inscriptionRepository;
	@Autowired BulletinRepository bulletinRepository;
	@Autowired IsoloirRepository isoloirRepository;
	@Autowired EmargementIsoloirRepository emargementRepository;
	@Autowired JournalCheckinRepository journalRepository;
	@Autowired WebApplicationContext context;
	@Autowired ElectionService electionService;
	@Autowired CandidatRepository candidatRepository;
	@Autowired AffrontementRepository affrontementRepository;
	@Autowired LigneVoteRepository ligneVoteRepository;
	@Autowired TransactionTemplate transaction;
	@Autowired IsoloirAdminService isoloirAdminService;

	MockMvc mvc;
	Utilisateur alice, bob, chloe, david;
	Isoloir isoloir1, isoloir2;
	Candidat candidat1, candidat2;
	Affrontement duel;

	@BeforeEach
	void setUp() {
		horloge.regler(T0);
		mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

		PeriodeVote periode = new PeriodeVote();
		periode.setStatut(true);
		periodeRepository.save(periode);

		alice = utilisateur("alice");
		bob = utilisateur("bob");
		chloe = utilisateur("chloe");
		david = utilisateur("david");
		inscrire(alice, periode);
		Inscription inscriptionBob = inscrire(bob, periode);
		inscrire(chloe, periode);

		Bulletin bulletin = new Bulletin();
		bulletin.setInscription(inscriptionBob);
		bulletinRepository.save(bulletin);

		isoloir1 = isoloir("Isoloir 1", "cle-poste-1");
		isoloir2 = isoloir("Isoloir 2", "cle-poste-2");

		// Un duel à voter en ligne
		candidat1 = candidat(inscrire(utilisateur("cand1"), periode));
		candidat2 = candidat(inscrire(utilisateur("cand2"), periode));
		duel = new Affrontement();
		duel.setCandidat1(candidat1);
		duel.setCandidat2(candidat2);
		affrontementRepository.save(duel);
	}

	@AfterEach
	void nettoyer() {
		journalRepository.deleteAll();
		emargementRepository.deleteAll();
		ligneVoteRepository.deleteAll();
		bulletinRepository.deleteAll();
		affrontementRepository.deleteAll();
		candidatRepository.deleteAll();
		inscriptionRepository.deleteAll();
		isoloirRepository.deleteAll();
		utilisateurRepository.deleteAll();
		periodeRepository.deleteAll();
	}

	private Utilisateur utilisateur(String nom) {
		Utilisateur u = new Utilisateur();
		u.setEmail(nom + "@mydigitalschool.fr");
		u.setMatricule(nom.toUpperCase());
		u.setMotDePasse("hash");
		return utilisateurRepository.save(u);
	}

	private Inscription inscrire(Utilisateur utilisateur, PeriodeVote periode) {
		Inscription i = new Inscription();
		i.setUtilisateur(utilisateur);
		i.setPeriode(periode);
		return inscriptionRepository.save(i);
	}

	private Candidat candidat(Inscription inscription) {
		Candidat c = new Candidat();
		c.setInscription(inscription);
		c.setPeriode(inscription.getPeriode());
		c.setNom(inscription.getUtilisateur().getMatricule());
		return candidatRepository.save(c);
	}

	private void voterEnLigne(Utilisateur u) {
		electionService.voter(id(u), duel.getIdAffrontement(), candidat1.getIdCandidat());
	}

	private Isoloir isoloir(String libelle, String cleTablette) {
		Isoloir iso = new Isoloir();
		iso.setLibelle(libelle);
		iso.setCleHmac("5c7b55f6a0ce90fe05a08974ae4b2c20aeecbb75c8325bbde2436958483f5d6a");
		iso.setCleTabletteHash(IsoloirService.sha256Hex(cleTablette));
		return isoloirRepository.save(iso);
	}

	// Donne une borne à l'isoloir, dont le dernier appel date d'il y a `secondes`
	private void brancherBorne(Isoloir isoloir, long secondes) {
		isoloir.setCleBorneHash(IsoloirService.sha256Hex("cle-borne-" + isoloir.getLibelle()));
		isoloir.setDerniereActiviteBorne(LocalDateTime.now(horloge).minusSeconds(secondes));
		isoloirRepository.save(isoloir);
	}

	// Ce que fera la borne au dernier duel (route de l'autre équipe) : le bulletin est écrit
	private void terminerVoteSurBorne(Utilisateur u) {
		Bulletin bulletin = new Bulletin();
		bulletin.setInscription(inscriptionRepository.findPeriodeOuverte(id(u)).orElseThrow());
		bulletinRepository.save(bulletin);
	}

	private String qr(Isoloir isoloir) {
		return qrTokenService.generer(isoloir, horloge.instant()).payload();
	}

	private String bearer(Utilisateur utilisateur) {
		return "Bearer " + jwtService.generer(utilisateur, false);
	}

	private Integer id(Utilisateur u) {
		return u.getIdUtilisateur();
	}

	@Test
	void checkinValideRevoqueLeVoteEnLigne() {
		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.not_voted);

		assertThat(checkinService.checkin(id(alice), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.success);
		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.checked_in_isoloir);
		assertThat(journalRepository.findByIdUtilisateur(id(alice))).extracting("resultat").containsExactly("success");
	}

	@Test
	void qrDeLaFenetrePrecedenteAccepte() {
		String token = qr(isoloir1);
		horloge.avancer(QrTokenService.FENETRE_MS + 2_000);

		assertThat(checkinService.checkin(id(alice), token).status()).isEqualTo(ResultatCheckin.success);
	}

	@Test
	void qrPlusVieuxQueDeuxFenetresExpire() {
		String token = qr(isoloir1);
		horloge.avancer(2 * QrTokenService.FENETRE_MS);

		assertThat(checkinService.checkin(id(alice), token).status()).isEqualTo(ResultatCheckin.expired_token);
		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.not_voted);
	}

	@Test
	void qrFalsifieOuIllisibleRejete() {
		String token = qr(isoloir1);
		String autreIsoloir = token.replaceFirst("^CHK1\\.\\d+\\.", "CHK1." + isoloir2.getIdIsoloir() + ".");
		String signatureAlteree = token.substring(0, token.length() - 1) + (token.endsWith("A") ? "B" : "A");

		assertThat(checkinService.checkin(id(alice), autreIsoloir).status()).isEqualTo(ResultatCheckin.invalid_token);
		assertThat(checkinService.checkin(id(alice), signatureAlteree).status()).isEqualTo(ResultatCheckin.invalid_token);
		assertThat(checkinService.checkin(id(alice), "https://example.com").status()).isEqualTo(ResultatCheckin.invalid_token);
		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.not_voted);
	}

	@Test
	void qrDuFuturRejete() {
		horloge.avancer(2 * QrTokenService.FENETRE_MS);
		String tokenFutur = qr(isoloir1);
		horloge.regler(T0);

		assertThat(checkinService.checkin(id(alice), tokenFutur).status()).isEqualTo(ResultatCheckin.invalid_token);
	}

	@Test
	void dejaVoteEnLigneRejete() {
		assertThat(checkinService.checkin(id(bob), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.already_voted);
		assertThat(checkinService.statut(id(bob))).isEqualTo(StatutVotant.voted_app);
	}

	@Test
	void doubleScanDansLeMemeIsoloirIdempotent() {
		String token = qr(isoloir1);

		assertThat(checkinService.checkin(id(alice), token).status()).isEqualTo(ResultatCheckin.success);
		assertThat(checkinService.checkin(id(alice), token).status()).isEqualTo(ResultatCheckin.success);
		assertThat(emargementRepository.count()).isEqualTo(1);
	}

	@Test
	void scanDansUnAutreIsoloirRejete() {
		checkinService.checkin(id(alice), qr(isoloir1));

		assertThat(checkinService.checkin(id(alice), qr(isoloir2)).status()).isEqualTo(ResultatCheckin.already_voted);
		assertThat(emargementRepository.count()).isEqualTo(1);
	}

	@Test
	void votantNonInscritRejete() {
		assertThat(checkinService.statut(id(david))).isEqualTo(StatutVotant.not_registered);
		assertThat(checkinService.checkin(id(david), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.not_registered);
	}

	@Test
	void scansSimultanesUnSeulEmargement() throws Exception {
		String token1 = qr(isoloir1);
		String token2 = qr(isoloir2);
		List<Callable<ResultatCheckin>> scans = new ArrayList<>();
		for (int i = 0; i < 10; i++) {
			String token = i % 2 == 0 ? token1 : token2;
			scans.add(() -> checkinService.checkin(id(chloe), token).status());
		}

		ExecutorService executor = Executors.newFixedThreadPool(10);
		List<ResultatCheckin> resultats = new ArrayList<>();
		for (Future<ResultatCheckin> f : executor.invokeAll(scans)) {
			resultats.add(f.get());
		}
		executor.shutdown();

		assertThat(emargementRepository.count()).isEqualTo(1);
		// Un seul isoloir gagne : ses scans réussissent, ceux de l'autre isoloir sont rejetés
		assertThat(resultats).containsOnly(ResultatCheckin.success, ResultatCheckin.already_voted);
		assertThat(resultats).filteredOn(r -> r == ResultatCheckin.success).hasSize(5);
	}

	@Test
	void posteSansLaBonneCleRefuse() throws Exception {
		String url = "/api/booths/" + isoloir1.getIdIsoloir() + "/current-qr";

		mvc.perform(get(url)).andExpect(status().isUnauthorized());
		mvc.perform(get(url).header("X-Isoloir-Cle", "cle-poste-2")).andExpect(status().isUnauthorized());
		mvc.perform(get(url).header("X-Isoloir-Cle", "cle-poste-1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.qr_payload").isString())
			.andExpect(jsonPath("$.expires_in").value(10_000));
	}

	@Test
	void checkinExigeUnJwt() throws Exception {
		String body = "{\"qr_token\":\"" + qr(isoloir1) + "\"}";

		// L'ancien header du prototype ne sert plus à rien
		mvc.perform(post("/api/checkin").header("X-User-Id", id(alice)).contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isUnauthorized());
		mvc.perform(post("/api/checkin").header("Authorization", "Bearer faux.jeton.signature")
				.contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isUnauthorized());
		mvc.perform(get("/api/voter/me/status")).andExpect(status().isUnauthorized());
		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.not_voted);
	}

	@Test
	void parcoursHttpAvecJwt() throws Exception {
		String body = "{\"qr_token\":\"" + qr(isoloir1) + "\"}";

		mvc.perform(post("/api/checkin").header("Authorization", bearer(alice))
				.contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("success"));
		mvc.perform(get("/api/voter/me/status").header("Authorization", bearer(alice)))
			.andExpect(jsonPath("$.status").value("checked_in_isoloir"));
		// Le JWT de chloe ne donne accès qu'au statut de chloe
		mvc.perform(get("/api/voter/me/status").header("Authorization", bearer(chloe)))
			.andExpect(jsonPath("$.status").value("not_voted"));
	}

	@Test
	void commencerEnLigneBloqueLIsoloir() {
		assertThat(checkinService.commencerVoteEnLigne(id(alice)).status()).isEqualTo(ResultatVoteEnLigne.success);

		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.voted_app);
		assertThat(checkinService.checkin(id(alice), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.already_voted);
		assertThat(emargementRepository.count()).isZero();
	}

	@Test
	void commencerEnLigneDeuxFoisIdempotent() {
		long bulletinsAvant = bulletinRepository.count();

		assertThat(checkinService.commencerVoteEnLigne(id(alice)).status()).isEqualTo(ResultatVoteEnLigne.success);
		assertThat(checkinService.commencerVoteEnLigne(id(alice)).status()).isEqualTo(ResultatVoteEnLigne.success);
		assertThat(bulletinRepository.count()).isEqualTo(bulletinsAvant + 1);
	}

	@Test
	void isoloirBloqueLeVoteEnLigne() {
		long bulletinsAvant = bulletinRepository.count();
		checkinService.checkin(id(alice), qr(isoloir1));

		assertThat(checkinService.commencerVoteEnLigne(id(alice)).status()).isEqualTo(ResultatVoteEnLigne.checked_in_isoloir);
		assertThat(bulletinRepository.count()).isEqualTo(bulletinsAvant);
		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.checked_in_isoloir);
	}

	@Test
	void commencerEnLigneNonInscritRefuse() {
		assertThat(checkinService.commencerVoteEnLigne(id(david)).status()).isEqualTo(ResultatVoteEnLigne.not_registered);
	}

	@Test
	void clicEnLigneEtScanSimultanesUnSeulGagne() throws Exception {
		long bulletinsAvant = bulletinRepository.count();
		String token = qr(isoloir1);
		List<Callable<Object>> actions = new ArrayList<>();
		for (int i = 0; i < 10; i++) {
			actions.add(i % 2 == 0
					? () -> checkinService.checkin(id(chloe), token).status()
					: () -> checkinService.commencerVoteEnLigne(id(chloe)).status());
		}

		ExecutorService executor = Executors.newFixedThreadPool(10);
		for (Future<Object> f : executor.invokeAll(actions)) {
			f.get();
		}
		executor.shutdown();

		// Soit émargée à l'isoloir, soit bulletin en ligne : jamais les deux
		long emargements = emargementRepository.count();
		long bulletinsChloe = bulletinRepository.count() - bulletinsAvant;
		assertThat(emargements + bulletinsChloe).isEqualTo(1);
	}

	@Test
	void commencerEnLigneExigeUnJwt() throws Exception {
		mvc.perform(post("/api/voter/me/online-vote")).andExpect(status().isUnauthorized());
		mvc.perform(post("/api/voter/me/online-vote").header("Authorization", bearer(alice)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("success"));
		mvc.perform(get("/api/voter/me/status").header("Authorization", bearer(alice)))
			.andExpect(jsonPath("$.status").value("voted_app"));
	}

	@Test
	void voteEnLigneRefuseApresCheckin() {
		checkinService.checkin(id(alice), qr(isoloir1));

		// Même en appelant directement l'API de vote, sans passer par « Commencer »
		assertThatThrownBy(() -> voterEnLigne(alice))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
		assertThat(ligneVoteRepository.count()).isZero();
	}

	@Test
	void voteEnLigneSansCheckinAccepteEtBloqueLIsoloir() {
		voterEnLigne(alice);

		assertThat(ligneVoteRepository.count()).isEqualTo(1);
		assertThat(checkinService.checkin(id(alice), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.already_voted);
	}

	@Test
	void voteEnLigneEtScanSimultanesJamaisLesDeux() throws Exception {
		String token = qr(isoloir1);
		List<Callable<Object>> actions = new ArrayList<>();
		for (int i = 0; i < 10; i++) {
			actions.add(i % 2 == 0
					? () -> checkinService.checkin(id(chloe), token).status()
					: () -> {
						try {
							voterEnLigne(chloe);
							return "vote";
						} catch (ResponseStatusException e) {
							return e.getStatusCode();
						}
					});
		}

		ExecutorService executor = Executors.newFixedThreadPool(10);
		for (Future<Object> f : executor.invokeAll(actions)) {
			f.get();
		}
		executor.shutdown();

		// Soit émargée à l'isoloir sans vote en ligne, soit vote en ligne sans émargement
		boolean emargee = emargementRepository.count() == 1;
		boolean voteEnLigne = ligneVoteRepository.count() == 1;
		assertThat(emargee ^ voteEnLigne).isTrue();
	}

	@Test
	void apiDeVoteRefuseApresCheckin() throws Exception {
		checkinService.checkin(id(alice), qr(isoloir1));

		mvc.perform(post("/api/vote/" + duel.getIdAffrontement()).header("Authorization", bearer(alice))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"idCandidatChoisi\":" + candidat1.getIdCandidat() + "}"))
			.andExpect(status().isConflict());
		assertThat(ligneVoteRepository.count()).isZero();
	}

	@Test
	void voteIncompletNeCompteDansLesResultats() {
		// Deuxième duel : un bulletin n'est complet qu'avec les 2
		Candidat candidat3 = candidat(inscrire(utilisateur("cand3"), candidat1.getPeriode()));
		Affrontement duel2 = new Affrontement();
		duel2.setCandidat1(candidat1);
		duel2.setCandidat2(candidat3);
		affrontementRepository.save(duel2);

		voterEnLigne(alice);
		assertThat(victoiresCandidat1()).as("1 duel sur 2 : ne compte pas").isZero();

		electionService.voter(id(alice), duel2.getIdAffrontement(), candidat1.getIdCandidat());
		assertThat(victoiresCandidat1()).as("2 duels sur 2 : compte").isEqualTo(2);
	}

	private int victoiresCandidat1() {
		return transaction.execute(t -> electionService.classement(candidat1.getPeriode()).stream()
			.filter(r -> r.candidat().id().equals(candidat1.getIdCandidat()))
			.mapToInt(ResultatCandidatDto::victoires)
			.sum());
	}

	@Test
	void borneEnLigneOuvreLeVote() {
		brancherBorne(isoloir1, 3);

		assertThat(checkinService.checkin(id(alice), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.success);
		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.checked_in_isoloir);
		assertThat(emargementRepository.existsVoteOuvert(isoloir1.getIdIsoloir())).isTrue();
	}

	@Test
	void borneHorsLigneRefuse() {
		brancherBorne(isoloir1, CheckinService.DELAI_BORNE_EN_LIGNE.toSeconds() + 1);
		assertThat(checkinService.checkin(id(alice), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.booth_offline);

		// Borne qui n'a jamais appelé le serveur
		isoloir1.setDerniereActiviteBorne(null);
		isoloirRepository.save(isoloir1);
		assertThat(checkinService.checkin(id(alice), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.booth_offline);

		assertThat(emargementRepository.count()).isZero();
		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.not_voted);
	}

	@Test
	void borneOccupeeJusquAuBulletin() {
		brancherBorne(isoloir1, 1);
		checkinService.checkin(id(alice), qr(isoloir1));

		assertThat(checkinService.checkin(id(chloe), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.booth_busy);
		assertThat(checkinService.statut(id(chloe))).isEqualTo(StatutVotant.not_voted);

		// La borne a fini le vote d'Alice : elle se libère
		terminerVoteSurBorne(alice);
		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.voted_booth);
		assertThat(checkinService.checkin(id(chloe), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.success);
	}

	@Test
	void apresLeVoteSurLaBorneNouveauScanRefuse() {
		brancherBorne(isoloir1, 1);
		checkinService.checkin(id(alice), qr(isoloir1));
		terminerVoteSurBorne(alice);

		assertThat(checkinService.checkin(id(alice), qr(isoloir1)).status()).isEqualTo(ResultatCheckin.already_voted);
		assertThat(checkinService.checkin(id(alice), qr(isoloir2)).status()).isEqualTo(ResultatCheckin.already_voted);
		assertThat(checkinService.statut(id(alice))).isEqualTo(StatutVotant.voted_booth);
	}

	@Test
	void votantsSimultanesSurLaMemeBorneUnSeulPasse() throws Exception {
		brancherBorne(isoloir1, 1);
		String token = qr(isoloir1);
		List<Callable<ResultatCheckin>> scans = new ArrayList<>();
		for (int i = 0; i < 10; i++) {
			Utilisateur votant = utilisateur("votant" + i);
			inscrire(votant, candidat1.getPeriode());
			scans.add(() -> checkinService.checkin(id(votant), token).status());
		}

		ExecutorService executor = Executors.newFixedThreadPool(10);
		List<ResultatCheckin> resultats = new ArrayList<>();
		for (Future<ResultatCheckin> f : executor.invokeAll(scans)) {
			resultats.add(f.get());
		}
		executor.shutdown();

		assertThat(resultats).filteredOn(r -> r == ResultatCheckin.success).hasSize(1);
		assertThat(resultats).filteredOn(r -> r == ResultatCheckin.booth_busy).hasSize(9);
		assertThat(emargementRepository.count()).isEqualTo(1);
	}

	@Test
	void isoloirCreeParLAdminFonctionneAvecSesCles() throws Exception {
		IsoloirCreeDto cree = isoloirAdminService.creer("  Isoloir 3 ");
		Isoloir isoloir = isoloirRepository.findById(cree.id()).orElseThrow();

		assertThat(isoloir.getLibelle()).isEqualTo("Isoloir 3");
		// Les clés ne sont jamais stockées en clair, et chaque isoloir a les siennes
		assertThat(cree.cleEcran()).hasSize(48).isNotEqualTo(cree.cleBorne());
		assertThat(isoloir.getCleTabletteHash()).isEqualTo(IsoloirService.sha256Hex(cree.cleEcran()));
		assertThat(isoloir.getCleBorneHash()).isEqualTo(IsoloirService.sha256Hex(cree.cleBorne()));
		assertThat(isoloirAdminService.creer("Isoloir 4").cleEcran()).isNotEqualTo(cree.cleEcran());

		mvc.perform(get("/api/booths/" + cree.id() + "/current-qr").header("X-Isoloir-Cle", cree.cleEcran()))
			.andExpect(status().isOk());
		// Nouvelle borne qui n'a encore jamais appelé : hors ligne
		assertThat(isoloirAdminService.lister()).filteredOn(i -> i.id().equals(cree.id()))
			.singleElement().satisfies(i -> {
				assertThat(i.aUneBorne()).isTrue();
				assertThat(i.borneEnLigne()).isFalse();
			});
	}

	@Test
	void listeDesIsoloirsSuitLaBorne() {
		brancherBorne(isoloir1, 2);
		checkinService.checkin(id(alice), qr(isoloir1));

		assertThat(isoloirAdminService.lister()).filteredOn(i -> i.id().equals(isoloir1.getIdIsoloir()))
			.singleElement().satisfies(i -> {
				assertThat(i.borneEnLigne()).isTrue();
				assertThat(i.voteEnCours()).isTrue();
			});
	}

	@Test
	void isoloirDesactiveRefuseLeScan() {
		String token = qr(isoloir1);
		isoloirAdminService.desactiver(isoloir1.getIdIsoloir());

		assertThat(checkinService.checkin(id(alice), token).status()).isEqualTo(ResultatCheckin.invalid_token);
	}

	@Test
	void backOfficeIsoloirsReserveAuxAdmins() throws Exception {
		mvc.perform(get("/api/admin/isoloirs").header("Authorization", bearer(alice)))
			.andExpect(status().isForbidden());
		mvc.perform(post("/api/admin/isoloirs").header("Authorization", "Bearer " + jwtService.generer(chloe, true))
				.contentType(MediaType.APPLICATION_JSON).content("{\"libelle\":\"Isoloir 5\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.cleEcran").isString())
			.andExpect(jsonPath("$.cleBorne").isString());
		mvc.perform(post("/api/admin/isoloirs").header("Authorization", "Bearer " + jwtService.generer(chloe, true))
				.contentType(MediaType.APPLICATION_JSON).content("{\"libelle\":\" \"}"))
			.andExpect(status().isBadRequest());
	}

}
