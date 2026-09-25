package fr.election.api.borne;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import fr.election.api.borne.BorneService.Choix;
import fr.election.api.borne.BorneService.Etat;
import fr.election.api.borne.BorneService.ReponseChoix;

// Routes appelées par la borne ESP32 (borne/API.md). Pas de JWT : la borne présente sa clé (X-Borne-Cle),
// qui désigne aussi son isoloir. Elle n'envoie jamais de numéro de borne.
@RestController
@RequestMapping("/api/borne")
public class BorneController {

	private final BorneService borneService;

	public BorneController(BorneService borneService) {
		this.borneService = borneService;
	}

	@GetMapping("/etat")
	public Etat etat(@RequestHeader(value = "X-Borne-Cle", required = false) String cleBorne) {
		return borneService.etat(borneService.identifier(cleBorne));
	}

	@PostMapping("/choix")
	public ReponseChoix choix(@RequestHeader(value = "X-Borne-Cle", required = false) String cleBorne,
			@RequestBody(required = false) Choix requete) {
		return borneService.choisir(borneService.identifier(cleBorne), requete);
	}

}
