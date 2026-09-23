package fr.election.checkin.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Version réduite de l'entité de l'appli principale (seulement ce dont le check-in a besoin)
@Entity
@Table(name = "utilisateur")
public class Utilisateur {

	@Id
	@Column(name = "id_utilisateur")
	private Integer idUtilisateur;

	@Column(name = "email", nullable = false, unique = true)
	private String email;

	public Integer getIdUtilisateur() { return idUtilisateur; }
	public String getEmail() { return email; }

}
