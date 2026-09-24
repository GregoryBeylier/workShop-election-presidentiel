package fr.election.api.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// libelle : nom affiché, par exemple "Isoloir 1"
public record IsoloirRequest(@NotBlank @Size(max = 50) String libelle) {
}
