package acc.br.shopbank.application.dto;

import acc.br.shopbank.domain.enums.AccountType;

import java.math.BigDecimal;

public record CheckingAccountResponse(
        Long id,
        Long bankId,
        Long customerId,
        Long storeId,
        String agency,
        String number,
        String digit,
        BigDecimal balance,
        AccountType type,
        Boolean active
) {
}
