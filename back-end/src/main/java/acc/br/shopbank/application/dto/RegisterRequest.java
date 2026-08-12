package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        @NotBlank @Size(min = 3, max = 120) String fullName,
        @NotBlank @Pattern(regexp = "\\d{11}", message = "CPF must contain 11 digits") String cpf
) {
}
