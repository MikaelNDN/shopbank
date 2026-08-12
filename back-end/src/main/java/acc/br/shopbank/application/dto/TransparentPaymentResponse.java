package acc.br.shopbank.application.dto;

import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransparentPaymentResponse(
        Long id,
        Long orderId,
        PaymentMethod method,
        PaymentStatus status,
        String statusDetail,
        BigDecimal amount,
        String gatewayPaymentId,
        String qrCode,
        String qrCodeBase64,
        String boletoUrl,
        String checkoutUrl,
        LocalDateTime createdAt,
        LocalDateTime confirmedAt
) {
}
