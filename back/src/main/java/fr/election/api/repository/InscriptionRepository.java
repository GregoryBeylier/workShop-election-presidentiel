package fr.election.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Inscription;

public interface InscriptionRepository extends JpaRepository<Inscription, Integer> {

	Optional<Inscription> findByUtilisateurIdUtilisateurAndPeriodeIdPeriode(Integer idUtilisateur, Integer idPeriode);

	List<Inscription> findByPeriodeIdPeriode(Integer idPeriode);

	long countByPeriodeIdPeriode(Integer idPeriode);

}
