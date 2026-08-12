package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record CustomerRequest(
        @NotNull Long userId,
        @NotBlank String fullName,
        @NotBlank @Pattern(regexp = "\\d{11}") String cpf,
        @Pattern(regexp = "\\d{10,11}") String phone,
        LocalDate birthDate,
        Boolean marketingOptIn
) {
}
