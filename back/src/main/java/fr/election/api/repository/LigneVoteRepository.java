package fr.election.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import fr.election.api.model.LigneVote;

public interface LigneVoteRepository extends JpaRepository<LigneVote, Integer> {

	List<LigneVote> findByBulletinIdBulletin(Integer idBulletin);

	boolean existsByBulletinIdBulletinAndAffrontementIdAffrontement(Integer idBulletin, Integer idAffrontement);

	@Query("""
			select l from LigneVote l join fetch l.affrontement a
			where l.bulletin.inscription.periode.idPeriode = :idPeriode""")
	List<LigneVote> findByPeriode(Integer idPeriode);

}
