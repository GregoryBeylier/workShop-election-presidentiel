package com.election_digital.demo.Repository;

import com.election_digital.demo.Model.Candidat;
import com.election_digital.demo.Model.PeriodeVote;
import com.election_digital.demo.Model.Statistic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StatisticRepository extends JpaRepository<Statistic, Long> {

    List<Statistic> findByPeriode(PeriodeVote periode);

    Optional<Statistic> findByPeriodeAndCandidat(PeriodeVote periode, Candidat candidat);

    boolean existsByPeriodeAndCandidat(PeriodeVote periode, Candidat candidat);

    List<Statistic> findByPeriodeOrderByTotalPointsDesc(PeriodeVote periode);
}