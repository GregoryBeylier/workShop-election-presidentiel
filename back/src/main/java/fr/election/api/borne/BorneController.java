package fr.election.api.borne;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import fr.election.api.borne.BorneService.Choix;
import fr.election.api.borne.BorneService.Etat;
import fr.election.api.borne.BorneService.ReponseChoix;
import jakarta.servlet.http.HttpServletRequest;

// Routes appelées par la borne ESP32 (borne/API.md). Pas de JWT : la borne est reconnue à l'IP d'où vient
// la requête (IP fixe enregistrée à la création de l'isoloir). Elle n'envoie jamais de numéro de borne.
// L'IP est celle de la connexion TCP (getRemoteAddr), jamais un en-tête X-Forwarded-For qu'on pourrait inventer :
// la borne doit donc appeler le back directement (port 8080), pas à travers nginx.
@RestController
@RequestMapping("/api/borne")
public class BorneController {

	private final BorneService borneService;

	public BorneController(BorneService borneService) {
		this.borneService = borneService;
	}

	@GetMapping("/etat")
	public Etat etat(HttpServletRequest request) {
		return borneService.etat(borneService.identifier(ipBorne(request)));
	}

	@PostMapping("/choix")
	public ReponseChoix choix(HttpServletRequest request, @RequestBody(required = false) Choix requete) {
		return borneService.choisir(borneService.identifier(ipBorne(request)), requete);
	}

	// Une IPv4 peut arriver au format IPv6 (::ffff:192.168.50.21) selon la pile réseau
	private static String ipBorne(HttpServletRequest request) {
		String ip = request.getRemoteAddr();
		return ip.startsWith("::ffff:") ? ip.substring(7) : ip;
	}

}
