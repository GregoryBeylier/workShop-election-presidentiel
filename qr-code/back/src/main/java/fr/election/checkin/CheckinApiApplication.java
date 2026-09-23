package fr.election.checkin;

import java.time.Clock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class CheckinApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(CheckinApiApplication.class, args);
	}

	// Seule source d'heure du check-in : la tablette ne calcule jamais rien elle-même
	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
