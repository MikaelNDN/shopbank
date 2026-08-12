package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record BankRequest(
        @NotBlank @Pattern(regexp = "\\d{3}") String code,
        @NotBlank String name,
        Boolean active
) {
}
