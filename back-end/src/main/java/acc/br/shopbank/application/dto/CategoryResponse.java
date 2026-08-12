package acc.br.shopbank.application.dto;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        Boolean active
) {
}
