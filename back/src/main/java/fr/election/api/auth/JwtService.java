package fr.election.api.auth;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import fr.election.api.model.Utilisateur;

@Service
public class JwtService {

	private final JwtEncoder encoder;
	private final Duration duree;

	public JwtService(JwtEncoder encoder, @Value("${app.jwt.duree}") Duration duree) {
		this.encoder = encoder;
		this.duree = duree;
	}

	// Tant que le mot de passe est provisoire, seul le changement de mot de passe est autorisé
	public static final String SCOPE_CHANGEMENT_MDP = "CHANGEMENT_MDP";

	// sub = id de l'utilisateur ; scope = ADMIN, ELECTEUR ou CHANGEMENT_MDP (devient l'autorité SCOPE_xxx côté Spring)
	public String generer(Utilisateur utilisateur, boolean admin) {
		Instant maintenant = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer("election-api")
			.subject(String.valueOf(utilisateur.getIdUtilisateur()))
			.claim("email", utilisateur.getEmail())
			.claim("scope", utilisateur.isMotDePasseProvisoire() ? SCOPE_CHANGEMENT_MDP : admin ? "ADMIN" : "ELECTEUR")
			.issuedAt(maintenant)
			.expiresAt(maintenant.plus(duree))
			.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}

}
