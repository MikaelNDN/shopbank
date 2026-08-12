package acc.br.shopbank.application.dto;

import java.time.LocalDate;

public record CustomerResponse(
        Long id,
        Long userId,
        String fullName,
        String cpf,
        String phone,
        LocalDate birthDate,
        Boolean marketingOptIn,
        Boolean active
) {
}