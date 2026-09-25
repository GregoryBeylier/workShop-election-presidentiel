package fr.election.api.borne;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.server.ResponseStatusException;

import com.jayway.jsonpath.JsonPath;

import fr.election.api.admin.IsoloirAdminService;
import fr.election.api.admin.dto.IsoloirAdminDto;
import fr.election.api.auth.JwtService;
import fr.election.api.checkin.CheckinService;
import fr.election.api.checkin.CheckinService.ResultatCheckin;
import fr.election.api.checkin.CheckinService.StatutVotant;
import fr.election.api.checkin.HorlogeTest;
import fr.election.api.checkin.IsoloirService;
import fr.election.api.checkin.QrTokenService;
import fr.election.api.model.Affrontement;
import fr.election.api.model.Candidat;
import fr.election.api.model.Inscription;
import fr.election.api.model.Isoloir;
import fr.election.api.model.LigneVote;
import fr.election.api.model.PeriodeVote;
import fr.election.api.model.Utilisateur;
import fr.election.api.repository.AffrontementRepository;
import fr.election.api.repository.BulletinRepository;
import fr.election.api.repository.CandidatRepository;
import fr.election.api.repository.ChoixProvisoireRepository;
import fr.election.api.repository.EmargementIsoloirRepository;
import fr.election.api.repository.InscriptionRepository;
import fr.election.api.repository.IsoloirRepository;
import fr.election.api.repository.JournalCheckinRepository;
import fr.election.api.repository.LigneVoteRepository;
import fr.election.api.repository.PeriodeVoteRepository;
import fr.election.api.repository.UtilisateurRepository;

// Routes de la borne ESP32 (borne/API.md), appelées en HTTP comme le ferait la carte
@SpringBootTest
class BorneTests {

	private static final Instant T0 = Instant.ofEpochMilli(1_800_000_000_000L);
	private static final String CLE_BORNE_1 = "cle-borne-1";
	private static final String CLE_BORNE_2 = "cle-borne-2";

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
	@Autowired UtilisateurRepository utilisateurRepository;
	@Autowired PeriodeVoteRepository periodeRepository;
	@Autowired InscriptionRepository inscriptionRepository;
	@Autowired BulletinRepository bulletinRepository;
	@Autowired IsoloirRepository isoloirRepository;
	@Autowired EmargementIsoloirRepository emargementRepository;
	@Autowired JournalCheckinRepository journalRepository;
	@Autowired CandidatRepository candidatRepository;
	@Autowired AffrontementRepository affrontementRepository;
	@Autowired LigneVoteRepository ligneVoteRepository;
	@Autowired ChoixProvisoireRepository choixRepository;
	@Autowired TransactionTemplate transaction;
	@Autowired WebApplicationContext context;
	@Autowired IsoloirAdminService isoloirAdminService;
	@Autowired JwtService jwtService;

	MockMvc mvc;
	Utilisateur alice, chloe;
	Isoloir isoloir1, isoloir2;
	Candidat c1, c2, c3;
	Affrontement d12, d13, d23;

	@BeforeEach
	void setUp() {
		horloge.regler(T0);
		mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

		PeriodeVote periode = new PeriodeVote();
		periode.setStatut(true);
		periodeRepository.save(periode);

		alice = utilisateur("alice");
		chloe = utilisateur("chloe");
		inscrire(alice, periode);
		inscrire(chloe, periode);

		// 3 candidats (LED 0, 1, 2) et leurs 3 duels, joués dans cet ordre
		c1 = candidat(inscrire(utilisateur("cand1"), periode));
		c2 = candidat(inscrire(utilisateur("cand2"), periode));
		c3 = candidat(inscrire(utilisateur("cand3"), periode));
		d12 = duel(c1, c2);
		d13 = duel(c1, c3);
		d23 = duel(c2, c3);

		isoloir1 = isoloir("Isoloir 1", CLE_BORNE_1);
		isoloir2 = isoloir("Isoloir 2", CLE_BORNE_2);
	}

	@AfterEach
	void nettoyer() {
		choixRepository.deleteAll();
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

	private Affrontement duel(Candidat gauche, Candidat droite) {
		Affrontement a = new Affrontement();
		a.setCandidat1(gauche);
		a.setCandidat2(droite);
		return affrontementRepository.save(a);
	}

	private Isoloir isoloir(String libelle, String cleBorne) {
		Isoloir iso = new Isoloir();
		iso.setLibelle(libelle);
		iso.setCleHmac("5c7b55f6a0ce90fe05a08974ae4b2c20aeecbb75c8325bbde2436958483f5d6a");
		iso.setCleTabletteHash(IsoloirService.sha256Hex("cle-ecran-" + libelle));
		iso.setCleBorneHash(IsoloirService.sha256Hex(cleBorne));
		return isoloirRepository.save(iso);
	}

	// Le votant scanne le QR de l'isoloir (la borne vient d'appeler : elle est en ligne)
	private void scanner(Utilisateur u, Isoloir isoloir, String cleBorne) throws Exception {
		etat(cleBorne).andExpect(status().isOk());
		String qr = qrTokenService.generer(isoloir, horloge.instant()).payload();
		assertThat(checkinService.checkin(u.getIdUtilisateur(), qr).status()).isEqualTo(ResultatCheckin.success);
	}

	private ResultActions etat(String cleBorne) throws Exception {
		return mvc.perform(get("/api/borne/etat").header("X-Borne-Cle", cleBorne));
	}

	private ResultActions choix(String cleBorne, String jeton, Affrontement duel, String choix) throws Exception {
		return mvc.perform(post("/api/borne/choix").header("X-Borne-Cle", cleBorne)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"jeton\":\"" + jeton + "\",\"idAffrontement\":" + duel.getIdAffrontement()
					+ ",\"choix\":\"" + choix + "\"}"));
	}

	private String jeton(String cleBorne) throws Exception {
		String json = etat(cleBorne).andReturn().getResponse().getContentAsString();
		return JsonPath.read(json, "$.jeton");
	}

	// Candidat choisi (id, ou null pour un blanc) par duel, sur les lignes de vote écrites
	private Map<Integer, Integer> lignesDeVote() {
		return transaction.execute(t -> ligneVoteRepository.findAll().stream()
			.collect(Collectors.toMap(l -> l.getAffrontement().getIdAffrontement(),
					(LigneVote l) -> l.getCandidatChoisi() == null ? -1 : l.getCandidatChoisi().getIdCandidat())));
	}

	@Test
	void parcoursCompletDEmma() throws Exception {
		etat(CLE_BORNE_1).andExpect(status().isOk())
			.andExpect(jsonPath("$.etat").value("LIBRE"))
			.andExpect(jsonPath("$.jeton").doesNotExist());

		scanner(alice, isoloir1, CLE_BORNE_1);

		etat(CLE_BORNE_1).andExpect(status().isOk())
			.andExpect(jsonPath("$.etat").value("DEVERROUILLEE"))
			.andExpect(jsonPath("$.nbCandidats").value(3))
			.andExpect(jsonPath("$.duel.numero").value(1))
			.andExpect(jsonPath("$.duel.total").value(3))
			.andExpect(jsonPath("$.duel.idAffrontement").value(d12.getIdAffrontement()))
			.andExpect(jsonPath("$.duel.gauche").value(0))
			.andExpect(jsonPath("$.duel.droite").value(1));
		String jeton = jeton(CLE_BORNE_1);

		choix(CLE_BORNE_1, jeton, d12, "DROITE").andExpect(status().isOk())
			.andExpect(jsonPath("$.statut").value("SUIVANT"))
			.andExpect(jsonPath("$.duel.numero").value(2))
			.andExpect(jsonPath("$.duel.idAffrontement").value(d13.getIdAffrontement()))
			.andExpect(jsonPath("$.duel.gauche").value(0))
			.andExpect(jsonPath("$.duel.droite").value(2));
		choix(CLE_BORNE_1, jeton, d13, "GAUCHE").andExpect(status().isOk())
			.andExpect(jsonPath("$.duel.idAffrontement").value(d23.getIdAffrontement()))
			.andExpect(jsonPath("$.duel.gauche").value(1))
			.andExpect(jsonPath("$.duel.droite").value(2));

		// Tant que le dernier duel n'est pas joué : rien dans l'urne
		assertThat(bulletinRepository.count()).isZero();
		assertThat(ligneVoteRepository.count()).isZero();
		assertThat(checkinService.statut(alice.getIdUtilisateur())).isEqualTo(StatutVotant.checked_in_isoloir);

		choix(CLE_BORNE_1, jeton, d23, "BLANC").andExpect(status().isOk())
			.andExpect(jsonPath("$.statut").value("TERMINE"))
			.andExpect(jsonPath("$.duel").doesNotExist());

		assertThat(bulletinRepository.count()).isEqualTo(1);
		assertThat(lignesDeVote()).containsExactlyInAnyOrderEntriesOf(Map.of(
				d12.getIdAffrontement(), c2.getIdCandidat(),
				d13.getIdAffrontement(), c1.getIdCandidat(),
				d23.getIdAffrontement(), -1));
		assertThat(choixRepository.count()).isZero();
		assertThat(checkinService.statut(alice.getIdUtilisateur())).isEqualTo(StatutVotant.voted_booth);
		etat(CLE_BORNE_1).andExpect(jsonPath("$.etat").value("LIBRE"));
	}

	@Test
	void choixRenvoyeDeuxFoisNestPasCompteDeuxFois() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		String jeton = jeton(CLE_BORNE_1);

		choix(CLE_BORNE_1, jeton, d12, "GAUCHE").andExpect(jsonPath("$.duel.numero").value(2));
		// Coupure Wi-Fi : la borne renvoie la même requête, elle reçoit la même réponse
		choix(CLE_BORNE_1, jeton, d12, "GAUCHE").andExpect(status().isOk())
			.andExpect(jsonPath("$.statut").value("SUIVANT"))
			.andExpect(jsonPath("$.duel.numero").value(2));
		assertThat(choixRepository.count()).isEqualTo(1);

		choix(CLE_BORNE_1, jeton, d13, "GAUCHE");
		choix(CLE_BORNE_1, jeton, d23, "GAUCHE").andExpect(jsonPath("$.statut").value("TERMINE"));
		// Rejeu du dernier duel après le bulletin : TERMINE, rien de plus
		choix(CLE_BORNE_1, jeton, d23, "GAUCHE").andExpect(status().isOk())
			.andExpect(jsonPath("$.statut").value("TERMINE"));
		assertThat(bulletinRepository.count()).isEqualTo(1);
		assertThat(ligneVoteRepository.count()).isEqualTo(3);
	}

	@Test
	void pasLeDuelAttenduRefuse() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		String jeton = jeton(CLE_BORNE_1);

		choix(CLE_BORNE_1, jeton, d13, "GAUCHE").andExpect(status().isConflict());
		assertThat(choixRepository.count()).isZero();
	}

	@Test
	void borneQuiRedemarreReprendAuBonDuel() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		choix(CLE_BORNE_1, jeton(CLE_BORNE_1), d12, "DROITE");

		etat(CLE_BORNE_1).andExpect(jsonPath("$.etat").value("DEVERROUILLEE"))
			.andExpect(jsonPath("$.duel.numero").value(2))
			.andExpect(jsonPath("$.duel.idAffrontement").value(d13.getIdAffrontement()));
	}

	@Test
	void cleAbsenteFausseOuIsoloirDesactiveRefusee() throws Exception {
		mvc.perform(get("/api/borne/etat")).andExpect(status().isUnauthorized());
		etat("pas-la-bonne-cle").andExpect(status().isUnauthorized());

		isoloir1.setActif(false);
		isoloirRepository.save(isoloir1);
		etat(CLE_BORNE_1).andExpect(status().isUnauthorized());
	}

	@Test
	void chaqueAppelSignaleLaBorneEnLigne() throws Exception {
		assertThat(isoloirRepository.findById(isoloir1.getIdIsoloir()).orElseThrow().getDerniereActiviteBorne()).isNull();

		etat(CLE_BORNE_1).andExpect(status().isOk());

		assertThat(isoloirRepository.findById(isoloir1.getIdIsoloir()).orElseThrow().getDerniereActiviteBorne())
			.isNotNull();
		assertThat(isoloirRepository.findById(isoloir2.getIdIsoloir()).orElseThrow().getDerniereActiviteBorne())
			.isNull();
	}

	@Test
	void uneBorneNePeutPasVoterPourUneAutre() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		String jetonBorne1 = jeton(CLE_BORNE_1);

		// La borne 2 ne voit pas le vote de la borne 1, et ne peut pas l'utiliser
		etat(CLE_BORNE_2).andExpect(jsonPath("$.etat").value("LIBRE"));
		choix(CLE_BORNE_2, jetonBorne1, d12, "GAUCHE").andExpect(status().isNotFound());
		assertThat(choixRepository.count()).isZero();
	}

	@Test
	void requeteMalFormeeRefusee() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		String jeton = jeton(CLE_BORNE_1);

		choix(CLE_BORNE_1, jeton, d12, "HAUT").andExpect(status().isBadRequest());
		choix(CLE_BORNE_1, "abc", d12, "GAUCHE").andExpect(status().isBadRequest());
		mvc.perform(post("/api/borne/choix").header("X-Borne-Cle", CLE_BORNE_1)
				.contentType(MediaType.APPLICATION_JSON).content("{}"))
			.andExpect(status().isBadRequest());
		mvc.perform(post("/api/borne/choix").header("X-Borne-Cle", CLE_BORNE_1)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"jeton\":\"" + jeton + "\",\"idAffrontement\":999999,\"choix\":\"GAUCHE\"}"))
			.andExpect(status().isBadRequest());
		choix(CLE_BORNE_1, "999999", d12, "GAUCHE").andExpect(status().isNotFound());
	}

	@Test
	void apresLeVoteLaBorneAccueilleLeVotantSuivant() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		String jetonAlice = jeton(CLE_BORNE_1);
		for (Affrontement d : List.of(d12, d13, d23)) {
			choix(CLE_BORNE_1, jetonAlice, d, "GAUCHE");
		}

		scanner(chloe, isoloir1, CLE_BORNE_1);
		String jetonChloe = jeton(CLE_BORNE_1);
		assertThat(jetonChloe).isNotEqualTo(jetonAlice);
		etat(CLE_BORNE_1).andExpect(jsonPath("$.duel.numero").value(1));
	}

	// ---------- Back office : reprendre en main un vote bloqué ----------

	private IsoloirAdminDto isoloirDansLAdmin(Isoloir isoloir) {
		return isoloirAdminService.lister().stream().filter(i -> i.id().equals(isoloir.getIdIsoloir())).findFirst()
			.orElseThrow();
	}

	@Test
	void adminVoitQuiVoteEtOuIlEnEst() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		choix(CLE_BORNE_1, jeton(CLE_BORNE_1), d12, "GAUCHE");

		IsoloirAdminDto.VoteEnCours vote = isoloirDansLAdmin(isoloir1).vote();
		assertThat(vote.votant()).isEqualTo("alice@mydigitalschool.fr");
		assertThat(vote.duel()).isEqualTo(2);
		assertThat(vote.total()).isEqualTo(3);
		assertThat(isoloirDansLAdmin(isoloir2).vote()).isNull();
	}

	@Test
	void recommencerRenvoieLaBorneAuPremierDuel() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		String jeton = jeton(CLE_BORNE_1);
		choix(CLE_BORNE_1, jeton, d12, "GAUCHE");

		isoloirAdminService.recommencerVote(isoloir1.getIdIsoloir(), 1);

		assertThat(choixRepository.count()).isZero();
		// La borne affichait le duel 2 : son prochain bouton est refusé, puis /etat la remet au duel 1
		choix(CLE_BORNE_1, jeton, d13, "GAUCHE").andExpect(status().isConflict());
		etat(CLE_BORNE_1).andExpect(jsonPath("$.etat").value("DEVERROUILLEE"))
			.andExpect(jsonPath("$.jeton").value(jeton))
			.andExpect(jsonPath("$.duel.numero").value(1));
		assertThat(checkinService.statut(alice.getIdUtilisateur())).isEqualTo(StatutVotant.checked_in_isoloir);
	}

	@Test
	void annulerLibereLaBorneEtLeVotant() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		String jeton = jeton(CLE_BORNE_1);
		choix(CLE_BORNE_1, jeton, d12, "GAUCHE");

		isoloirAdminService.annulerVote(isoloir1.getIdIsoloir(), 1);

		assertThat(choixRepository.count()).isZero();
		assertThat(emargementRepository.count()).isZero();
		assertThat(checkinService.statut(alice.getIdUtilisateur())).isEqualTo(StatutVotant.not_voted);
		// La borne affichait un duel : son prochain bouton est refusé (vote inconnu), puis elle est LIBRE
		choix(CLE_BORNE_1, jeton, d13, "GAUCHE").andExpect(status().isNotFound());
		etat(CLE_BORNE_1).andExpect(jsonPath("$.etat").value("LIBRE"));
		// Alice peut recommencer depuis le scan
		scanner(alice, isoloir1, CLE_BORNE_1);
		etat(CLE_BORNE_1).andExpect(jsonPath("$.duel.numero").value(1));
	}

	@Test
	void unVoteTermineNestJamaisTouche() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		String jeton = jeton(CLE_BORNE_1);
		for (Affrontement d : List.of(d12, d13, d23)) {
			choix(CLE_BORNE_1, jeton, d, "GAUCHE");
		}

		for (Runnable action : List.<Runnable>of(
				() -> isoloirAdminService.annulerVote(isoloir1.getIdIsoloir(), 1),
				() -> isoloirAdminService.recommencerVote(isoloir1.getIdIsoloir(), 1))) {
			try {
				action.run();
				throw new AssertionError("Un vote terminé ne doit pas pouvoir être modifié");
			} catch (ResponseStatusException e) {
				assertThat(e.getStatusCode().value()).isEqualTo(409);
			}
		}
		assertThat(bulletinRepository.count()).isEqualTo(1);
		assertThat(ligneVoteRepository.count()).isEqualTo(3);
		assertThat(emargementRepository.count()).isEqualTo(1);
	}

	@Test
	void seulUnAdminPeutAnnulerUnVote() throws Exception {
		scanner(alice, isoloir1, CLE_BORNE_1);
		String url = "/api/admin/isoloirs/" + isoloir1.getIdIsoloir() + "/vote/annuler";

		mvc.perform(post(url).header("Authorization", "Bearer " + jwtService.generer(chloe, false)))
			.andExpect(status().isForbidden());
		assertThat(emargementRepository.count()).isEqualTo(1);

		mvc.perform(post(url).header("Authorization", "Bearer " + jwtService.generer(chloe, true)))
			.andExpect(status().isNoContent());
		assertThat(emargementRepository.count()).isZero();
	}

}
