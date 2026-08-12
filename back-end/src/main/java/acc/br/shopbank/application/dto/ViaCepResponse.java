package acc.br.shopbank.application.dto;

public record ViaCepResponse(

        String cep,
        String logradouro,
        String bairro,
        String localidade,
        String uf

) {
}