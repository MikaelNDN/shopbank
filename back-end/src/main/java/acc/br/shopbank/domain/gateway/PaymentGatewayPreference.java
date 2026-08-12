package acc.br.shopbank.domain.gateway;

public record PaymentGatewayPreference(
        String preferenceId,
        String checkoutUrl
) {
}
