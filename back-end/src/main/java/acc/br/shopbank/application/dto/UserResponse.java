package acc.br.shopbank.application.dto;

import acc.br.shopbank.domain.enums.UserRole;

public record UserResponse(
        Long id,
        String email,
        UserRole role,
        Boolean active,
        Long customerId,
        String fullName,
        String cpf
) {
}
