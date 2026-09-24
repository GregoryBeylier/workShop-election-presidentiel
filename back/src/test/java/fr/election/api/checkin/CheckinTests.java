package fr.election.api.checkin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
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

import fr.election.api.auth.JwtService;
import fr.election.api.checkin.CheckinService.ResultatCheckin;
import fr.election.api.checkin.CheckinService.ResultatVoteEnLigne;
import fr.election.api.checkin.CheckinService.StatutVotant;
import fr.election.api.model.Bulletin;
import fr.election.api.model.Inscription;
import fr.election.api.model.Isoloir;
import fr.election.api.model.PeriodeVote;
import fr.election.api.model.Utilisateur;
import fr.election.api.repository.BulletinRepository;
import fr.election.api.repository.EmargementIsoloirRepository;
import fr.election.api.repository.InscriptionRepository;
import fr.election.api.repository.IsoloirRepository;
import fr.election.api.repository.JournalCheckinRepository;
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

	MockMvc mvc;
	Utilisateur alice, bob, chloe, david;
	Isoloir isoloir1, isoloir2;

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
	}

	@AfterEach
	void nettoyer() {
		journalRepository.deleteAll();
		emargementRepository.deleteAll();
		bulletinRepository.deleteAll();
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

	private Isoloir isoloir(String libelle, String cleTablette) {
		Isoloir iso = new Isoloir();
		iso.setLibelle(libelle);
		iso.setCleHmac("5c7b55f6a0ce90fe05a08974ae4b2c20aeecbb75c8325bbde2436958483f5d6a");
		iso.setCleTabletteHash(IsoloirService.sha256Hex(cleTablette));
		return isoloirRepository.save(iso);
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

}
