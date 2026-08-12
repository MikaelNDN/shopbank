package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record BoletoPaymentRequest(
        @NotBlank String payerEmail,
        @NotBlank @Pattern(regexp = "\\d{11}") String payerCpf,
        @NotBlank String payerFirstName,
        @NotBlank String payerLastName
) {
}
