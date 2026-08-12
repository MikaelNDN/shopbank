package acc.br.shopbank.application.dto;

import acc.br.shopbank.domain.enums.AccountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public record CheckingAccountRequest(
        @NotNull Long bankId,
        Long customerId,
        Long storeId,
        @NotBlank @Pattern(regexp = "\\d{4}") String agency,
        @NotBlank @Pattern(regexp = "\\d{3,12}") String number,
        @NotBlank @Pattern(regexp = "\\d{1}") String digit,
        @NotNull @DecimalMin("0.00") BigDecimal balance,
        @NotNull AccountType type,
        Boolean active
) {
}
