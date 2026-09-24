package fr.election.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import fr.election.api.model.EmargementIsoloir;

public interface EmargementIsoloirRepository extends JpaRepository<EmargementIsoloir, Integer> {

	Optional<EmargementIsoloir> findByInscription_IdInscription(Integer idInscription);

	// Vote ouvert sur la borne de l'isoloir : un votant émargé à la période ouverte, sans bulletin
	@Query("""
			select count(e) > 0 from EmargementIsoloir e
			where e.isoloir.idIsoloir = :idIsoloir and e.inscription.periode.statut = true
			and not exists (select b from Bulletin b where b.inscription = e.inscription)""")
	boolean existsVoteOuvert(@Param("idIsoloir") Integer idIsoloir);

}
