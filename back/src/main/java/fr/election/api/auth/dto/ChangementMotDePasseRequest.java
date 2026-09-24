package fr.election.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangementMotDePasseRequest(@NotBlank String motDePasse) {
}
