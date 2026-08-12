package acc.br.shopbank.domain.gateway;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentGatewayPayment(
        String paymentId,
        String externalReference,
        String status,
        BigDecimal amount,
        LocalDateTime approvedAt
) {
}
