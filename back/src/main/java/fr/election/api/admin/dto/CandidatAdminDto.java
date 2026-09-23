package fr.election.api.admin.dto;

import fr.election.api.election.dto.CandidatDto;

public record CandidatAdminDto(CandidatDto candidat, String email) {
}
