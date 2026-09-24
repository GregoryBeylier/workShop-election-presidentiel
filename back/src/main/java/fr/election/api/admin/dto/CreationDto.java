package fr.election.api.admin.dto;

// Résultat d'une création ; compteCree = false si l'email appartenait déjà à un compte
// (le mot de passe provisoire saisi n'a alors pas été utilisé)
public record CreationDto<T>(T element, boolean compteCree) {
}
