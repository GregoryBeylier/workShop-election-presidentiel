package fr.election.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import fr.election.api.model.Inscription;
import jakarta.persistence.LockModeType;

public interface InscriptionRepository extends JpaRepository<Inscription, Integer> {

	String INSCRIPTION_PERIODE_OUVERTE = "select i from Inscription i where i.utilisateur.idUtilisateur = :idUtilisateur and i.periode.statut = true";

	@Query(INSCRIPTION_PERIODE_OUVERTE)
	Optional<Inscription> findPeriodeOuverte(@Param("idUtilisateur") Integer idUtilisateur);

	// Verrouille la ligne (SELECT ... FOR UPDATE) : deux check-in, ou un check-in et un vote en ligne,
	// sur la même inscription passent l'un après l'autre. Le vote en ligne doit prendre ce même verrou.
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query(INSCRIPTION_PERIODE_OUVERTE)
	Optional<Inscription> findPeriodeOuverteForUpdate(@Param("idUtilisateur") Integer idUtilisateur);

}
