package acc.br.shopbank.application.dto;

public record AdminInventoryResponse(
        Long inventoryId,
        Long productId,
        String productName,
        Integer availableQuantity,
        Integer reservedQuantity,
        Boolean productActive
) {
}
