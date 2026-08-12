package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record ProductRequest(
        @NotNull Long categoryId,
        @NotNull Long storeId,
        @NotBlank String name,
        String description,
        @NotNull @Positive BigDecimal price,
        String imageUrl,
        Boolean active
) {
}
