package com.election_digital.demo.Repository;

import com.election_digital.demo.Model.Affrontement;
import com.election_digital.demo.Model.Bulletin;
import com.election_digital.demo.Model.LigneVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LigneVoteRepository extends JpaRepository<LigneVote, Long> {

    List<LigneVote> findByBulletin(Bulletin bulletin);

    List<LigneVote> findByAffrontement(Affrontement affrontement);

    Optional<LigneVote> findByBulletinAndAffrontement(Bulletin bulletin, Affrontement affrontement);

    boolean existsByBulletinAndAffrontement(Bulletin bulletin, Affrontement affrontement);

    long countByAffrontementAndCandidatChoisiId(Affrontement affrontement, Long idCandidat);
}