package com.election_digital.demo.Repository;

import com.election_digital.demo.Model.Borne;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BorneRepository extends JpaRepository<Borne, Long> {
    Optional<Borne> findByCleBorne(String cleBorne);
}
