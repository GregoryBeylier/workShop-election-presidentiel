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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

// Émargement dans un isoloir : révoque définitivement le vote via l'appli pour cette inscription.
// Aucun lien avec le contenu du bulletin papier.
@Entity
@Table(name = "emargement_isoloir")
public class EmargementIsoloir {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_emargement")
	private Integer idEmargement;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_inscription", nullable = false, unique = true)
	private Inscription inscription;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_isoloir", nullable = false)
	private Isoloir isoloir;

	@Column(name = "emarge_le", nullable = false)
	private LocalDateTime emargeLe;

	public Integer getIdEmargement() { return idEmargement; }
	public Inscription getInscription() { return inscription; }
	public void setInscription(Inscription inscription) { this.inscription = inscription; }
	public Isoloir getIsoloir() { return isoloir; }
	public void setIsoloir(Isoloir isoloir) { this.isoloir = isoloir; }
	public LocalDateTime getEmargeLe() { return emargeLe; }
	public void setEmargeLe(LocalDateTime emargeLe) { this.emargeLe = emargeLe; }

}
