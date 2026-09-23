package fr.election.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import fr.election.api.model.Bulletin;

public interface BulletinRepository extends JpaRepository<Bulletin, Integer> {

	Optional<Bulletin> findByInscriptionIdInscription(Integer idInscription);

	boolean existsByInscriptionUtilisateurIdUtilisateur(Integer idUtilisateur);

	// [id_inscription, nombre de duels votés] pour chaque bulletin de la période
	@Query("""
			select b.inscription.idInscription, count(l) from LigneVote l join l.bulletin b
			where b.inscription.periode.idPeriode = :idPeriode group by b.inscription.idInscription""")
	List<Object[]> compterDuelsParInscription(Integer idPeriode);

	// Bulletins complets (tous les duels de la période votés) = électeurs ayant voté
	@Query("""
			select count(b) from Bulletin b
			where b.inscription.periode.idPeriode = :idPeriode
			and (select count(l) from LigneVote l where l.bulletin = b) >= :nbDuels""")
	long countComplets(Integer idPeriode, long nbDuels);

}
