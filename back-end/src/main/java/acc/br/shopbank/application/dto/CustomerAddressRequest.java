package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CustomerAddressRequest(
        Long customerId,
        String label,
        @NotBlank String recipientName,
        @NotBlank @Pattern(regexp = "\\d{8}") String postalCode,
        @NotBlank String street,
        @NotBlank String number,
        String complement,
        @NotBlank String district,
        @NotBlank String city,
        @NotBlank @Pattern(regexp = "[A-Z]{2}") String state,
        String reference,
        Boolean favorite
) {
}
