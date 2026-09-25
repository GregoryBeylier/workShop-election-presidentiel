package com.election_digital.demo.Repository;

import com.election_digital.demo.Model.PeriodeVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PeriodeVoteRepository extends JpaRepository<PeriodeVote, Long> {

    List<PeriodeVote> findByStatutTrue();

    Optional<PeriodeVote> findByOuvertLeLessThanEqualAndClosLeGreaterThanEqual(LocalDate ouvertLe, LocalDate closLe);

    List<PeriodeVote> findByClosLeIsNull();
}