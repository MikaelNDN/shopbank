package acc.br.shopbank.application.dto;

import acc.br.shopbank.domain.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountTransactionResponse(
        Long id,
        Long checkingAccountId,
        Long orderId,
        Long paymentId,
        TransactionType type,
        BigDecimal amount,
        String description,
        LocalDateTime createdAt
) {
}
