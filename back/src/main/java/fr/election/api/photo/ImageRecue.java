package fr.election.api.photo;

// Image envoyée par l'admin, déjà vérifiée par VerificateurImage
public record ImageRecue(byte[] contenu, String typeMime) {
}
