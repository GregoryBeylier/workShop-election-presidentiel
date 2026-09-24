package fr.election.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Candidat;

public interface CandidatRepository extends JpaRepository<Candidat, Integer> {

	List<Candidat> findByPeriodeIdPeriodeOrderByIdCandidat(Integer idPeriode);

	List<Candidat> findByInscriptionUtilisateurIdUtilisateur(Integer idUtilisateur);

	boolean existsByInscriptionIdInscription(Integer idInscription);

}
