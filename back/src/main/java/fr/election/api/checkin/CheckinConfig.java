package fr.election.api.checkin;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CheckinConfig {

	// Seule source d'heure du check-in : le poste isoloir ne calcule jamais rien lui-même
	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
