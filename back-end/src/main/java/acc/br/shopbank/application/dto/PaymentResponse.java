package acc.br.shopbank.application.dto;

import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long orderId,
        PaymentMethod method,
        PaymentStatus status,
        BigDecimal amount,
        String checkoutUrl,
        LocalDateTime createdAt,
        LocalDateTime confirmedAt
) {
}
