package fr.election.api.config;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

@Configuration
public class SecurityConfig {

	// Origines du front autorisées à appeler l'API (voir application.properties)
	@Value("${app.cors.allowed-origins}")
	private List<String> allowedOrigins;

	// Clé de signature des JWT (HS256), au moins 32 caractères, stockée dans .env
	@Value("${app.jwt.secret}")
	private String jwtSecret;

	// Seules la santé, la connexion et les photos et logos des candidats (balises <img>, sans JWT) sont publiques. Avec un mot de passe provisoire (SCOPE_CHANGEMENT_MDP),
	// on ne peut que le changer ; /api/admin/** exige le rôle ADMIN (claim scope du JWT => autorité SCOPE_ADMIN) ;
	// tout le reste exige un électeur ou un admin
	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.cors(Customizer.withDefaults())
			.csrf(csrf -> csrf.disable())
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				.requestMatchers("/api/health", "/api/auth/login", "/error").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/candidats/*/photo", "/api/candidats/*/logo").permitAll()
				// Poste isoloir : pas de JWT, il présente sa clé (X-Isoloir-Cle), vérifiée par IsoloirService
				.requestMatchers(HttpMethod.GET, "/api/booths/*/current-qr").permitAll()
				// Borne ESP32 : pas de JWT, elle présente sa clé X-Borne-Cle (vérifiée par BorneService)
				.requestMatchers(HttpMethod.GET, "/api/borne/etat").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/borne/choix").permitAll()
				.requestMatchers("/api/auth/changer-mot-de-passe").authenticated()
				.requestMatchers("/api/admin/**").hasAuthority("SCOPE_ADMIN")
				.anyRequest().hasAnyAuthority("SCOPE_ADMIN", "SCOPE_ELECTEUR"))
			.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
		return http.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	JwtEncoder jwtEncoder() {
		return NimbusJwtEncoder.withSecretKey(cleJwt()).build();
	}

	@Bean
	JwtDecoder jwtDecoder() {
		return NimbusJwtDecoder.withSecretKey(cleJwt()).macAlgorithm(MacAlgorithm.HS256).build();
	}

	private SecretKey cleJwt() {
		byte[] octets = jwtSecret.getBytes(StandardCharsets.UTF_8);
		if (octets.length < 32) {
			throw new IllegalStateException("JWT_SECRET doit faire au moins 32 caractères");
		}
		return new SecretKeySpec(octets, "HmacSHA256");
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(allowedOrigins);
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Isoloir-Cle"));

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", config);
		return source;
	}

}
