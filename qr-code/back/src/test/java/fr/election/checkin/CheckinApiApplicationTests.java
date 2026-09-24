package fr.election.checkin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import fr.election.checkin.model.Isoloir;
import fr.election.checkin.repository.EmargementIsoloirRepository;
import fr.election.checkin.repository.IsoloirRepository;
import fr.election.checkin.repository.JournalCheckinRepository;
import fr.election.checkin.service.CheckinService;
import fr.election.checkin.service.CheckinService.ResultatCheckin;
import fr.election.checkin.service.CheckinService.StatutVotant;
import fr.election.checkin.service.QrTokenService;

// Utilisateurs de démo (data.sql) : 1 et 3 n'ont pas voté, 2 a voté dans l'appli, 4 n'est pas inscrit
@SpringBootTest
class CheckinApiApplicationTests {

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
	@Autowired IsoloirRepository isoloirRepository;
	@Autowired EmargementIsoloirRepository emargementRepository;
	@Autowired JournalCheckinRepository journalRepository;
	@Autowired WebApplicationContext context;

	MockMvc mvc;
	Isoloir isoloir1;
	Isoloir isoloir2;

	@BeforeEach
	void setUp() {
		horloge.regler(T0);
		mvc = MockMvcBuilders.webAppContextSetup(context).build();
		isoloir1 = isoloirRepository.findById(1).orElseThrow();
		isoloir2 = isoloirRepository.findById(2).orElseThrow();
	}

	@AfterEach
	void nettoyer() {
		emargementRepository.deleteAll();
		journalRepository.deleteAll();
	}

	private String qr(Isoloir isoloir) {
		return qrTokenService.generer(isoloir, horloge.instant()).payload();
	}

	@Test
	void checkinValideRevoqueLeVoteAppli() {
		assertThat(checkinService.statut(1)).isEqualTo(StatutVotant.not_voted);

		var reponse = checkinService.checkin(1, qr(isoloir1));

		assertThat(reponse.status()).isEqualTo(ResultatCheckin.success);
		assertThat(checkinService.statut(1)).isEqualTo(StatutVotant.checked_in_isoloir);
		assertThat(journalRepository.findByIdUtilisateur(1)).extracting("resultat").containsExactly("success");
	}

	@Test
	void qrDeLaFenetrePrecedenteAccepte() {
		String token = qr(isoloir1);
		horloge.avancer(QrTokenService.FENETRE_MS + 2_000);

		assertThat(checkinService.checkin(1, token).status()).isEqualTo(ResultatCheckin.success);
	}

	@Test
	void qrPlusVieuxQueDeuxFenetresExpire() {
		String token = qr(isoloir1);
		horloge.avancer(2 * QrTokenService.FENETRE_MS);

		assertThat(checkinService.checkin(1, token).status()).isEqualTo(ResultatCheckin.expired_token);
		assertThat(checkinService.statut(1)).isEqualTo(StatutVotant.not_voted);
	}

	@Test
	void qrFalsifieOuIllisibleRejete() {
		String token = qr(isoloir1);
		String autreIsoloir = token.replaceFirst("^CHK1\\.1\\.", "CHK1.2.");
		String signatureAlteree = token.substring(0, token.length() - 1) + (token.endsWith("A") ? "B" : "A");

		assertThat(checkinService.checkin(1, autreIsoloir).status()).isEqualTo(ResultatCheckin.invalid_token);
		assertThat(checkinService.checkin(1, signatureAlteree).status()).isEqualTo(ResultatCheckin.invalid_token);
		assertThat(checkinService.checkin(1, "https://example.com").status()).isEqualTo(ResultatCheckin.invalid_token);
		assertThat(checkinService.statut(1)).isEqualTo(StatutVotant.not_voted);
	}

	@Test
	void qrDuFuturRejete() {
		horloge.avancer(2 * QrTokenService.FENETRE_MS);
		String tokenFutur = qr(isoloir1);
		horloge.regler(T0);

		assertThat(checkinService.checkin(1, tokenFutur).status()).isEqualTo(ResultatCheckin.invalid_token);
	}

	@Test
	void dejaVoteDansLAppliRejete() {
		var reponse = checkinService.checkin(2, qr(isoloir1));

		assertThat(reponse.status()).isEqualTo(ResultatCheckin.already_voted);
		assertThat(checkinService.statut(2)).isEqualTo(StatutVotant.voted_app);
	}

	@Test
	void doubleScanDansLeMemeIsoloirIdempotent() {
		String token = qr(isoloir1);

		assertThat(checkinService.checkin(1, token).status()).isEqualTo(ResultatCheckin.success);
		assertThat(checkinService.checkin(1, token).status()).isEqualTo(ResultatCheckin.success);
		assertThat(emargementRepository.count()).isEqualTo(1);
	}

	@Test
	void scanDansUnAutreIsoloirRejete() {
		checkinService.checkin(1, qr(isoloir1));

		assertThat(checkinService.checkin(1, qr(isoloir2)).status()).isEqualTo(ResultatCheckin.already_voted);
		assertThat(emargementRepository.count()).isEqualTo(1);
	}

	@Test
	void votantNonInscritRejete() {
		assertThat(checkinService.statut(4)).isEqualTo(StatutVotant.not_registered);
		assertThat(checkinService.checkin(4, qr(isoloir1)).status()).isEqualTo(ResultatCheckin.not_registered);
	}

	@Test
	void scansSimultanesUnSeulEmargement() throws Exception {
		String token1 = qr(isoloir1);
		String token2 = qr(isoloir2);
		List<Callable<ResultatCheckin>> scans = new ArrayList<>();
		for (int i = 0; i < 10; i++) {
			String token = i % 2 == 0 ? token1 : token2;
			scans.add(() -> checkinService.checkin(3, token).status());
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
	void tabletteSansLaBonneCleRefusee() throws Exception {
		mvc.perform(get("/api/booths/1/current-qr")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/booths/1/current-qr").header("X-Isoloir-Cle", "tablette-isoloir-2-demo"))
			.andExpect(status().isUnauthorized());
		mvc.perform(get("/api/booths/1/current-qr").header("X-Isoloir-Cle", "tablette-isoloir-1-demo"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.qr_payload").isString())
			.andExpect(jsonPath("$.expires_in").value(10_000));
	}

	@Test
	void parcoursHttpComplet() throws Exception {
		String body = "{\"qr_token\":\"" + qr(isoloir1) + "\"}";

		mvc.perform(post("/api/checkin").contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isUnauthorized());
		mvc.perform(post("/api/checkin").header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("success"));
		mvc.perform(get("/api/voter/me/status").header("X-User-Id", "1"))
			.andExpect(jsonPath("$.status").value("checked_in_isoloir"));
	}

}
