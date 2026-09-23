package fr.election.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import fr.election.api.model.Affrontement;

public interface AffrontementRepository extends JpaRepository<Affrontement, Integer> {

	// Les deux candidats d'un duel sont forcément de la même période (trigger verifie_meme_periode)
	@Query("""
			select a from Affrontement a join fetch a.candidat1 c1 join fetch a.candidat2
			where c1.periode.idPeriode = :idPeriode order by a.idAffrontement""")
	List<Affrontement> findByPeriode(Integer idPeriode);

}
