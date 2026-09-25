package com.election_digital.demo.Repository;

import com.election_digital.demo.Model.Affrontement;
import com.election_digital.demo.Model.Candidat;
import com.election_digital.demo.Model.PeriodeVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AffrontementRepository extends JpaRepository<Affrontement, Long> {

    List<Affrontement> findByCandidat1OrCandidat2(Candidat candidat1, Candidat candidat2);

    List<Affrontement> findByChoix(Integer choix);

    List<Affrontement> findByCandidat1_PeriodeOrderByChoixAsc(PeriodeVote periode);
}