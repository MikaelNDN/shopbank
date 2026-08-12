package acc.br.shopbank.application.dto;

public record OrderShippingAddressResponse(
        Long customerAddressIdOrigin,
        String recipientName,
        String postalCode,
        String street,
        String number,
        String complement,
        String district,
        String city,
        String state,
        String reference
) {
}
