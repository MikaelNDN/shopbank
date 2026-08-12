package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank String name,
        String description,
        Boolean active
) {
}
