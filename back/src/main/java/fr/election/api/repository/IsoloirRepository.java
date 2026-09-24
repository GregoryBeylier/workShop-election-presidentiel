package fr.election.api.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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

	// La borne s'identifie par sa clé : on la retrouve par l'empreinte, jamais par un numéro qu'elle enverrait
	Optional<Isoloir> findByCleBorneHash(String cleBorneHash);

	// Battement de cœur de la borne (chaque appel) : requête directe, sans recharger ni réécrire tout l'isoloir
	@Modifying
	@Query("update Isoloir i set i.derniereActiviteBorne = :maintenant where i.idIsoloir = :idIsoloir")
	void noterActiviteBorne(@Param("idIsoloir") Integer idIsoloir, @Param("maintenant") LocalDateTime maintenant);

}
