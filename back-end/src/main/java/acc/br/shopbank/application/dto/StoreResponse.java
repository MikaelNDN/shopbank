package acc.br.shopbank.application.dto;

public record StoreResponse(
        Long id,
        String legalName,
        String tradeName,
        String cnpj,
        String email,
        Boolean active
) {
}
