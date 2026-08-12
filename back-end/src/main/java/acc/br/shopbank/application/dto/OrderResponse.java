package acc.br.shopbank.application.dto;

import acc.br.shopbank.domain.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        Long customerId,
        OrderStatus status,
        BigDecimal totalAmount,
        List<OrderItemResponse> items,
        OrderShippingAddressResponse shippingAddress,
        LocalDateTime createdAt
) {
}
