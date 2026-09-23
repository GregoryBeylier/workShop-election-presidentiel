package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Admin;

public interface AdminRepository extends JpaRepository<Admin, Integer> {

}
