package acc.br.shopbank.infrastructure.integration.payment;

import acc.br.shopbank.infrastructure.config.AbacatePayProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.web.client.RestClient;

import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;

class AbacatePayWebhookRegistrarTest {

    @Test
    void shouldCreateWebhookWhenPaymentWebhookIsMissing() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AbacatePayProperties properties = properties();
        AbacatePayWebhookRegistrar registrar = new AbacatePayWebhookRegistrar(properties, builder);

        server.expect(requestTo(startsWith("https://api.abacatepay.test/v2/webhooks/list")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer TEST-token"))
                .andExpect(queryParam("search", "https://shopbank.ngrok-free.app/api/payments/abacatepay/webhook"))
                .andExpect(queryParam("limit", "100"))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {
                          "data": [],
                          "success": true,
                          "error": null
                        }
                        """, MediaType.APPLICATION_JSON));

        server.expect(requestTo(endsWith("/webhooks/create")))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer TEST-token"))
                .andExpect(jsonPath("$.name").value("ShopBank Payments"))
                .andExpect(jsonPath("$.endpoint").value(properties.webhookUrl()))
                .andExpect(jsonPath("$.secret").value("webhook-secret"))
                .andExpect(jsonPath("$.events[?(@ == 'transparent.completed')]").exists())
                .andExpect(jsonPath("$.events[?(@ == 'transparent.refunded')]").exists())
                .andExpect(jsonPath("$.events[?(@ == 'checkout.completed')]").exists())
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {
                          "data": {
                            "id": "webh_123",
                            "name": "ShopBank Payments",
                            "endpoint": "https://shopbank.ngrok-free.app/api/payments/abacatepay/webhook?webhookSecret=webhook-secret",
                            "events": ["transparent.completed"]
                          },
                          "success": true,
                          "error": null
                        }
                        """, MediaType.APPLICATION_JSON));

        registrar.ensurePaymentWebhook();

        server.verify();
    }

    @Test
    void shouldNotCreateWebhookWhenCompatibleEndpointAlreadyExists() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AbacatePayProperties properties = properties();
        AbacatePayWebhookRegistrar registrar = new AbacatePayWebhookRegistrar(properties, builder);

        server.expect(requestTo(startsWith("https://api.abacatepay.test/v2/webhooks/list")))
                .andExpect(method(HttpMethod.GET))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {
                          "data": [
                            {
                              "id": "webh_123",
                              "name": "ShopBank Payments",
                              "endpoint": "https://shopbank.ngrok-free.app/api/payments/abacatepay/webhook?webhookSecret=webhook-secret",
                              "events": [
                                "checkout.completed",
                                "checkout.refunded",
                                "checkout.disputed",
                                "checkout.lost",
                                "transparent.completed",
                                "transparent.refunded",
                                "transparent.disputed",
                                "transparent.lost"
                              ]
                            }
                          ],
                          "success": true,
                          "error": null
                        }
                        """, MediaType.APPLICATION_JSON));

        registrar.ensurePaymentWebhook();

        server.verify();
    }

    @Test
    void shouldSkipWebhookRegistrationWhenPublicUrlIsNotHttps() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AbacatePayProperties properties = properties();
        properties.setPublicUrl("http://localhost:8080");
        AbacatePayWebhookRegistrar registrar = new AbacatePayWebhookRegistrar(properties, builder);

        registrar.ensurePaymentWebhook();

        server.verify();
    }

    private AbacatePayProperties properties() {
        AbacatePayProperties properties = new AbacatePayProperties();
        properties.setApiKey("TEST-token");
        properties.setApiBaseUrl("https://api.abacatepay.test/v2");
        properties.setPublicUrl("https://shopbank.ngrok-free.app");
        properties.setWebhookSecret("webhook-secret");
        return properties;
    }
}
