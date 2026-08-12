package acc.br.shopbank.application.dto;

public record BankResponse(
        Long id,
        String code,
        String name,
        Boolean active
) {
}
