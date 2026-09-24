package fr.election.api.admin.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

// Date et heure de clôture prévues, affichée aux électeurs (compte à rebours)
public record OuvrirRequest(@NotNull LocalDateTime closLe) {
}
