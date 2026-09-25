package fr.election.api.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import fr.election.api.model.Isoloir;
import jakarta.persistence.LockModeType;

public interface IsoloirRepository extends JpaRepository<Isoloir, Integer> {

	// Verrou sur l'isoloir : deux votants qui tapent le code du même isoloir en même temps
	// ne peuvent pas ouvrir tous les deux un vote sur sa borne
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select i from Isoloir i where i.idIsoloir = :idIsoloir")
	Optional<Isoloir> findByIdForUpdate(@Param("idIsoloir") Integer idIsoloir);

	// Candidats pour un code court tapé par le votant
	List<Isoloir> findByActifTrue();

	// La borne est reconnue à l'IP d'où vient la requête, jamais à un numéro qu'elle enverrait.
	// Un isoloir désactivé garde son IP : on peut en recréer un pour la même borne
	Optional<Isoloir> findByIpBorneAndActifTrue(String ipBorne);

	boolean existsByIpBorneAndActifTrue(String ipBorne);

	// Battement de cœur de la borne (chaque appel) : requête directe, sans recharger ni réécrire tout l'isoloir
	@Modifying
	@Query("update Isoloir i set i.derniereActiviteBorne = :maintenant where i.idIsoloir = :idIsoloir")
	void noterActiviteBorne(@Param("idIsoloir") Integer idIsoloir, @Param("maintenant") LocalDateTime maintenant);

}
