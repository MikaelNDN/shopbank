package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record CardPaymentRequest(
        String token,
        String paymentMethodId,
        String issuerId,
        @NotNull @Positive Integer installments,
        @NotBlank String payerEmail,
        @Pattern(regexp = "\\d{11}") String payerCpf,
        String payerFirstName,
        String payerLastName,
        String returnUrl,
        String completionUrl
) {
}
