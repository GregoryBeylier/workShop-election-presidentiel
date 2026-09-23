package fr.election.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import fr.election.api.model.Bulletin;

public interface BulletinRepository extends JpaRepository<Bulletin, Integer> {

	Optional<Bulletin> findByInscriptionIdInscription(Integer idInscription);

	// Bulletins complets (tous les duels de la période votés) = électeurs ayant voté
	@Query("""
			select count(b) from Bulletin b
			where b.inscription.periode.idPeriode = :idPeriode
			and (select count(l) from LigneVote l where l.bulletin = b) >= :nbDuels""")
	long countComplets(Integer idPeriode, long nbDuels);

}
