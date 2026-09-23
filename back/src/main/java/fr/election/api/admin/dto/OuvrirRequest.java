package fr.election.api.admin.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

// Date de clôture prévue, affichée aux électeurs (compte à rebours)
public record OuvrirRequest(@NotNull LocalDate closLe) {
}
