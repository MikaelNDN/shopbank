package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record StoreRequest(
        @NotBlank String legalName,
        @NotBlank String tradeName,
        @NotBlank @Pattern(regexp = "\\d{14}") String cnpj,
        @Email String email,
        Boolean active
) {
}
