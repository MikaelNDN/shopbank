package acc.br.shopbank.application.dto;

import java.time.LocalDateTime;

public record InventoryResponse(
        Long id,
        Long productId,
        Integer availableQuantity,
        Integer reservedQuantity,
        LocalDateTime updatedAt
) {
}
