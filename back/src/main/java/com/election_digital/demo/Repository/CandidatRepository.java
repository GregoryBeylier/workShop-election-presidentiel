package com.election_digital.demo.Repository;

import com.election_digital.demo.Model.Candidat;
import com.election_digital.demo.Model.Inscription;
import com.election_digital.demo.Model.PeriodeVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatRepository extends JpaRepository<Candidat, Long> {

    List<Candidat> findByPeriode(PeriodeVote periode);

    Optional<Candidat> findByInscription(Inscription inscription);

    boolean existsByInscription(Inscription inscription);

    List<Candidat> findByNomIgnoreCaseOrPrenomIgnoreCase(String nom, String prenom);
}
