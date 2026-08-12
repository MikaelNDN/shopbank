package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PixPaymentRequest(
        @NotBlank String payerEmail,
        @Pattern(regexp = "\\d{11}") String payerCpf,
        String payerFirstName,
        String payerLastName
) {
}
