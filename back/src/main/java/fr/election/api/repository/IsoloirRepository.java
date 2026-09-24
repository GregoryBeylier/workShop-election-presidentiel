package fr.election.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import fr.election.api.model.Isoloir;
import jakarta.persistence.LockModeType;

public interface IsoloirRepository extends JpaRepository<Isoloir, Integer> {

	// Verrou sur l'isoloir : deux votants qui scannent le même isoloir en même temps
	// ne peuvent pas ouvrir tous les deux un vote sur sa borne
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select i from Isoloir i where i.idIsoloir = :idIsoloir")
	Optional<Isoloir> findByIdForUpdate(@Param("idIsoloir") Integer idIsoloir);

}
