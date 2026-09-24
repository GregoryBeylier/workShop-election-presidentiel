package fr.election.api.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "utilisateur")
public class Utilisateur {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_utilisateur")
	private Integer idUtilisateur;

	@Column(name = "email", nullable = false, unique = true)
	private String email;

	// Mot de passe haché (BCrypt), jamais en clair
	@Column(name = "mot_de_passe", nullable = false)
	private String motDePasse;

	// Ancien identifiant école, plus utilisé (l'email suffit) : colonne facultative,
	// gardée pour que l'anonymisation RGPD efface les valeurs existantes
	@Column(name = "matricule", unique = true, length = 50)
	private String matricule;

	// true tant que l'utilisateur n'a pas remplacé le mot de passe provisoire fixé par l'admin
	@Column(name = "mdp_provisoire", nullable = false)
	private boolean motDePasseProvisoire = false;

	@Column(name = "cree_le", nullable = false)
	private LocalDate creeLe = LocalDate.now();

	public Integer getIdUtilisateur() { return idUtilisateur; }
	public String getEmail() { return email; }
	public void setEmail(String email) { this.email = email; }
	public String getMotDePasse() { return motDePasse; }
	public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }
	public String getMatricule() { return matricule; }
	public void setMatricule(String matricule) { this.matricule = matricule; }
	public boolean isMotDePasseProvisoire() { return motDePasseProvisoire; }
	public void setMotDePasseProvisoire(boolean motDePasseProvisoire) { this.motDePasseProvisoire = motDePasseProvisoire; }
	public LocalDate getCreeLe() { return creeLe; }

}
