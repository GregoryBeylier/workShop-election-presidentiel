package fr.election.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

// Un utilisateur présent dans cette table a les droits administrateur
@Entity
@Table(name = "admin")
public class Admin {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_admin")
	private Integer idAdmin;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_utilisateur", nullable = false, unique = true)
	private Utilisateur utilisateur;

	public Integer getIdAdmin() { return idAdmin; }
	public Utilisateur getUtilisateur() { return utilisateur; }
	public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }

}
