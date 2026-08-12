package acc.br.shopbank.application.dto;

public record PaymentConfigResponse(
        String publicKey,
        boolean sandbox
) {
}
