package fr.election.api.admin.dto;

// Isoloir tout juste créé, avec la clé de l'écran en clair : renvoyée UNE SEULE FOIS
// (la base n'en garde que l'empreinte). cleEcran : pour l'URL de l'écran ; ipBorne : IP qui identifie sa borne
public record IsoloirCreeDto(Integer id, String libelle, String cleEcran, String ipBorne) {
}
