package acc.br.shopbank.application.dto;

public record CustomerAddressResponse(
        Long id,
        Long customerId,
        String label,
        String recipientName,
        String postalCode,
        String street,
        String number,
        String complement,
        String district,
        String city,
        String state,
        String reference,
        Boolean favorite,
        Boolean active
) {
}