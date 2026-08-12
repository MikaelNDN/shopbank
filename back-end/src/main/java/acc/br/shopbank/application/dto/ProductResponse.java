package acc.br.shopbank.application.dto;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        Long categoryId,
        Long storeId,
        String name,
        String description,
        BigDecimal price,
        String imageUrl,
        Boolean active
) {
}
