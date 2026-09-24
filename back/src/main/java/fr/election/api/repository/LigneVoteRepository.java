package fr.election.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import fr.election.api.model.LigneVote;

public interface LigneVoteRepository extends JpaRepository<LigneVote, Integer> {

	List<LigneVote> findByBulletinIdBulletin(Integer idBulletin);

	boolean existsByBulletinIdBulletinAndAffrontementIdAffrontement(Integer idBulletin, Integer idAffrontement);

	// Lignes des bulletins complets uniquement (tous les duels de la période votés) :
	// un vote commencé mais pas terminé ne compte jamais dans les résultats
	@Query("""
			select l from LigneVote l join fetch l.affrontement a
			where l.bulletin.inscription.periode.idPeriode = :idPeriode
			and (select count(l2) from LigneVote l2 where l2.bulletin = l.bulletin) >= :nbDuels""")
	List<LigneVote> findCompletesByPeriode(Integer idPeriode, long nbDuels);

}
