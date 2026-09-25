package fr.election.api.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.JournalCheckin;

public interface JournalCheckinRepository extends JpaRepository<JournalCheckin, Integer> {

	List<JournalCheckin> findByIdUtilisateur(Integer idUtilisateur);

	// Échecs récents d'un votant : limite les essais de code court
	long countByIdUtilisateurAndResultatAndScanneLeAfter(Integer idUtilisateur, String resultat, LocalDateTime depuis);

}
