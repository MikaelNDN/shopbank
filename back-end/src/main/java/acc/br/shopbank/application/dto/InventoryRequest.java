package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record InventoryRequest(
        @NotNull Long productId,
        @NotNull @Positive Integer quantity
) {
}
