package acc.br.shopbank.infrastructure.integration.cep;

import acc.br.shopbank.application.dto.ViaCepResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ViaCepClient {

    private final RestClient client;

    public ViaCepClient(RestClient.Builder builder) {

        this.client = builder
                .baseUrl("https://viacep.com.br/ws")
                .build();

    }

    public ViaCepResponse findAddress(String cep) {

        return client.get()
                .uri("/{cep}/json", cep)
                .retrieve()
                .body(ViaCepResponse.class);

    }
}
