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
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import com.jayway.jsonpath.JsonPath;

import fr.election.api.checkin.CheckinService;
import fr.election.api.checkin.CheckinService.ResultatCheckin;
import fr.election.api.checkin.CheckinService.StatutVotant;
import fr.election.api.checkin.HorlogeTest;
import fr.election.api.checkin.IsoloirService;
import fr.election.api.checkin.CodeIsoloirService;
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
	// IP fixes des bornes sur le Wi-Fi : c'est ce qui les identifie
	private static final String IP_BORNE_1 = "192.168.50.21";
	private static final String IP_BORNE_2 = "192.168.50.22";

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
	@Autowired CodeIsoloirService codeIsoloirService;
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

		isoloir1 = isoloir("Isoloir 1", IP_BORNE_1);
		isoloir2 = isoloir("Isoloir 2", IP_BORNE_2);
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

	private Isoloir isoloir(String libelle, String ipBorne) {
		Isoloir iso = new Isoloir();
		iso.setLibelle(libelle);
		iso.setCleHmac("5c7b55f6a0ce90fe05a08974ae4b2c20aeecbb75c8325bbde2436958483f5d6a");
		iso.setCleTabletteHash(IsoloirService.sha256Hex("cle-ecran-" + libelle));
		iso.setIpBorne(ipBorne);
		return isoloirRepository.save(iso);
	}

	// Le votant tape le code de l'isoloir (la borne vient d'appeler : elle est en ligne)
	private void scanner(Utilisateur u, Isoloir isoloir, String ipBorne) throws Exception {
		etat(ipBorne).andExpect(status().isOk());
		String code = codeIsoloirService.generer(isoloir, horloge.instant()).code();
		assertThat(checkinService.checkin(u.getIdUtilisateur(), code).status()).isEqualTo(ResultatCheckin.success);
	}

	// Requête qui vient de l'IP de la borne
	private static RequestPostProcessor depuis(String ip) {
		return requete -> {
			requete.setRemoteAddr(ip);
			return requete;
		};
	}

	private ResultActions etat(String ipBorne) throws Exception {
		return mvc.perform(get("/api/borne/etat").with(depuis(ipBorne)));
	}

	private ResultActions choix(String ipBorne, String jeton, Affrontement duel, String choix) throws Exception {
		return mvc.perform(post("/api/borne/choix").with(depuis(ipBorne))
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"jeton\":\"" + jeton + "\",\"idAffrontement\":" + duel.getIdAffrontement()
					+ ",\"choix\":\"" + choix + "\"}"));
	}

	private String jeton(String ipBorne) throws Exception {
		String json = etat(ipBorne).andReturn().getResponse().getContentAsString();
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
		etat(IP_BORNE_1).andExpect(status().isOk())
			.andExpect(jsonPath("$.etat").value("LIBRE"))
			.andExpect(jsonPath("$.jeton").doesNotExist());

		scanner(alice, isoloir1, IP_BORNE_1);

		etat(IP_BORNE_1).andExpect(status().isOk())
			.andExpect(jsonPath("$.etat").value("DEVERROUILLEE"))
			.andExpect(jsonPath("$.nbCandidats").value(3))
			.andExpect(jsonPath("$.duel.numero").value(1))
			.andExpect(jsonPath("$.duel.total").value(3))
			.andExpect(jsonPath("$.duel.idAffrontement").value(d12.getIdAffrontement()))
			.andExpect(jsonPath("$.duel.gauche").value(0))
			.andExpect(jsonPath("$.duel.droite").value(1));
		String jeton = jeton(IP_BORNE_1);

		choix(IP_BORNE_1, jeton, d12, "DROITE").andExpect(status().isOk())
			.andExpect(jsonPath("$.statut").value("SUIVANT"))
			.andExpect(jsonPath("$.duel.numero").value(2))
			.andExpect(jsonPath("$.duel.idAffrontement").value(d13.getIdAffrontement()))
			.andExpect(jsonPath("$.duel.gauche").value(0))
			.andExpect(jsonPath("$.duel.droite").value(2));
		choix(IP_BORNE_1, jeton, d13, "GAUCHE").andExpect(status().isOk())
			.andExpect(jsonPath("$.duel.idAffrontement").value(d23.getIdAffrontement()))
			.andExpect(jsonPath("$.duel.gauche").value(1))
			.andExpect(jsonPath("$.duel.droite").value(2));

		// Tant que le dernier duel n'est pas joué : rien dans l'urne
		assertThat(bulletinRepository.count()).isZero();
		assertThat(ligneVoteRepository.count()).isZero();
		assertThat(checkinService.statut(alice.getIdUtilisateur())).isEqualTo(StatutVotant.checked_in_isoloir);

		choix(IP_BORNE_1, jeton, d23, "BLANC").andExpect(status().isOk())
			.andExpect(jsonPath("$.statut").value("TERMINE"))
			.andExpect(jsonPath("$.duel").doesNotExist());

		assertThat(bulletinRepository.count()).isEqualTo(1);
		assertThat(lignesDeVote()).containsExactlyInAnyOrderEntriesOf(Map.of(
				d12.getIdAffrontement(), c2.getIdCandidat(),
				d13.getIdAffrontement(), c1.getIdCandidat(),
				d23.getIdAffrontement(), -1));
		assertThat(choixRepository.count()).isZero();
		assertThat(checkinService.statut(alice.getIdUtilisateur())).isEqualTo(StatutVotant.voted_booth);
		etat(IP_BORNE_1).andExpect(jsonPath("$.etat").value("LIBRE"));
	}

	@Test
	void choixRenvoyeDeuxFoisNestPasCompteDeuxFois() throws Exception {
		scanner(alice, isoloir1, IP_BORNE_1);
		String jeton = jeton(IP_BORNE_1);

		choix(IP_BORNE_1, jeton, d12, "GAUCHE").andExpect(jsonPath("$.duel.numero").value(2));
		// Coupure Wi-Fi : la borne renvoie la même requête, elle reçoit la même réponse
		choix(IP_BORNE_1, jeton, d12, "GAUCHE").andExpect(status().isOk())
			.andExpect(jsonPath("$.statut").value("SUIVANT"))
			.andExpect(jsonPath("$.duel.numero").value(2));
		assertThat(choixRepository.count()).isEqualTo(1);

		choix(IP_BORNE_1, jeton, d13, "GAUCHE");
		choix(IP_BORNE_1, jeton, d23, "GAUCHE").andExpect(jsonPath("$.statut").value("TERMINE"));
		// Rejeu du dernier duel après le bulletin : TERMINE, rien de plus
		choix(IP_BORNE_1, jeton, d23, "GAUCHE").andExpect(status().isOk())
			.andExpect(jsonPath("$.statut").value("TERMINE"));
		assertThat(bulletinRepository.count()).isEqualTo(1);
		assertThat(ligneVoteRepository.count()).isEqualTo(3);
	}

	@Test
	void pasLeDuelAttenduRefuse() throws Exception {
		scanner(alice, isoloir1, IP_BORNE_1);
		String jeton = jeton(IP_BORNE_1);

		choix(IP_BORNE_1, jeton, d13, "GAUCHE").andExpect(status().isConflict());
		assertThat(choixRepository.count()).isZero();
	}

	@Test
	void borneQuiRedemarreReprendAuBonDuel() throws Exception {
		scanner(alice, isoloir1, IP_BORNE_1);
		choix(IP_BORNE_1, jeton(IP_BORNE_1), d12, "DROITE");

		etat(IP_BORNE_1).andExpect(jsonPath("$.etat").value("DEVERROUILLEE"))
			.andExpect(jsonPath("$.duel.numero").value(2))
			.andExpect(jsonPath("$.duel.idAffrontement").value(d13.getIdAffrontement()));
	}

	@Test
	void ipInconnueOuIsoloirDesactiveRefusee() throws Exception {
		// Par défaut MockMvc vient de 127.0.0.1, qui n'est la borne d'aucun isoloir
		mvc.perform(get("/api/borne/etat")).andExpect(status().isUnauthorized());
		etat("192.168.50.99").andExpect(status().isUnauthorized());
		// L'ancienne clé ne sert plus à rien
		mvc.perform(get("/api/borne/etat").header("X-Borne-Cle", "cle-borne-1")).andExpect(status().isUnauthorized());

		isoloir1.setActif(false);
		isoloirRepository.save(isoloir1);
		etat(IP_BORNE_1).andExpect(status().isUnauthorized());
	}

	@Test
	void ipv4AuFormatIpv6Reconnue() throws Exception {
		etat("::ffff:" + IP_BORNE_1).andExpect(status().isOk());
	}

	@Test
	void chaqueAppelSignaleLaBorneEnLigne() throws Exception {
		assertThat(isoloirRepository.findById(isoloir1.getIdIsoloir()).orElseThrow().getDerniereActiviteBorne()).isNull();

		etat(IP_BORNE_1).andExpect(status().isOk());

		assertThat(isoloirRepository.findById(isoloir1.getIdIsoloir()).orElseThrow().getDerniereActiviteBorne())
			.isNotNull();
		assertThat(isoloirRepository.findById(isoloir2.getIdIsoloir()).orElseThrow().getDerniereActiviteBorne())
			.isNull();
	}

	@Test
	void uneBorneNePeutPasVoterPourUneAutre() throws Exception {
		scanner(alice, isoloir1, IP_BORNE_1);
		String jetonBorne1 = jeton(IP_BORNE_1);

		// La borne 2 ne voit pas le vote de la borne 1, et ne peut pas l'utiliser
		etat(IP_BORNE_2).andExpect(jsonPath("$.etat").value("LIBRE"));
		choix(IP_BORNE_2, jetonBorne1, d12, "GAUCHE").andExpect(status().isNotFound());
		assertThat(choixRepository.count()).isZero();
	}

	@Test
	void requeteMalFormeeRefusee() throws Exception {
		scanner(alice, isoloir1, IP_BORNE_1);
		String jeton = jeton(IP_BORNE_1);

		choix(IP_BORNE_1, jeton, d12, "HAUT").andExpect(status().isBadRequest());
		choix(IP_BORNE_1, "abc", d12, "GAUCHE").andExpect(status().isBadRequest());
		mvc.perform(post("/api/borne/choix").with(depuis(IP_BORNE_1))
				.contentType(MediaType.APPLICATION_JSON).content("{}"))
			.andExpect(status().isBadRequest());
		mvc.perform(post("/api/borne/choix").with(depuis(IP_BORNE_1))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"jeton\":\"" + jeton + "\",\"idAffrontement\":999999,\"choix\":\"GAUCHE\"}"))
			.andExpect(status().isBadRequest());
		choix(IP_BORNE_1, "999999", d12, "GAUCHE").andExpect(status().isNotFound());
	}

	@Test
	void apresLeVoteLaBorneAccueilleLeVotantSuivant() throws Exception {
		scanner(alice, isoloir1, IP_BORNE_1);
		String jetonAlice = jeton(IP_BORNE_1);
		for (Affrontement d : List.of(d12, d13, d23)) {
			choix(IP_BORNE_1, jetonAlice, d, "GAUCHE");
		}

		scanner(chloe, isoloir1, IP_BORNE_1);
		String jetonChloe = jeton(IP_BORNE_1);
		assertThat(jetonChloe).isNotEqualTo(jetonAlice);
		etat(IP_BORNE_1).andExpect(jsonPath("$.duel.numero").value(1));
	}

}
