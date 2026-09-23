package fr.election.api.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "token")
public class Token {

	// Valeurs autorisées par la contrainte chk_type_token
	public static final String TYPE_REFRESH = "refresh";
	public static final String TYPE_RESET_MDP = "reset_mdp";
	public static final String TYPE_VERIF_EMAIL = "verif_email";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_token")
	private Integer idToken;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_utilisateur", nullable = false)
	private Utilisateur utilisateur;

	@Column(name = "valeur", nullable = false, unique = true)
	private String valeur;

	@Column(name = "type", nullable = false, length = 20)
	private String type;

	@Column(name = "cree_le", nullable = false)
	private LocalDateTime creeLe = LocalDateTime.now();

	@Column(name = "expire_le", nullable = false)
	private LocalDateTime expireLe;

	@Column(name = "utilise_le")
	private LocalDateTime utiliseLe;

	public Integer getIdToken() { return idToken; }
	public Utilisateur getUtilisateur() { return utilisateur; }
	public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }
	public String getValeur() { return valeur; }
	public void setValeur(String valeur) { this.valeur = valeur; }
	public String getType() { return type; }
	public void setType(String type) { this.type = type; }
	public LocalDateTime getCreeLe() { return creeLe; }
	public LocalDateTime getExpireLe() { return expireLe; }
	public void setExpireLe(LocalDateTime expireLe) { this.expireLe = expireLe; }
	public LocalDateTime getUtiliseLe() { return utiliseLe; }
	public void setUtiliseLe(LocalDateTime utiliseLe) { this.utiliseLe = utiliseLe; }

}
