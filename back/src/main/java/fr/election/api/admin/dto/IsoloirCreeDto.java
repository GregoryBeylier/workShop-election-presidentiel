package fr.election.api.admin.dto;

// Isoloir tout juste créé, avec ses deux clés en clair : renvoyées UNE SEULE FOIS
// (la base n'en garde que l'empreinte). cleEcran : pour l'URL de l'écran, cleBorne : pour config.h de l'ESP32
public record IsoloirCreeDto(Integer id, String libelle, String cleEcran, String cleBorne) {
}
