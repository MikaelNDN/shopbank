package acc.br.shopbank.infrastructure.integration.payment;

import acc.br.shopbank.infrastructure.config.AbacatePayProperties;
import acc.br.shopbank.domain.model.Order;
import acc.br.shopbank.domain.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;

class AbacatePayPaymentsGatewayTest {

    @Test
    void shouldCreatePixTransparentPayment() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

        AbacatePayProperties properties = new AbacatePayProperties();
        properties.setApiKey("TEST-token");
        properties.setApiBaseUrl("https://api.abacatepay.test/v2");

        AbacatePayPaymentsGateway gateway = new AbacatePayPaymentsGateway(
                properties,
                builder,
                Mockito.mock(AbacatePayGateway.class)
        );

        Order order = Order.builder()
                .id(10L)
                .totalAmount(new BigDecimal("99.90"))
                .build();

        server.expect(requestTo("https://api.abacatepay.test/v2/transparents/create"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer TEST-token"))
                .andExpect(jsonPath("$.method").value("PIX"))
                .andExpect(jsonPath("$.data.amount").value(9990))
                .andExpect(jsonPath("$.data.externalId").value("10"))
                .andExpect(jsonPath("$.data.customer.email").value("cliente@shopbank.com"))
                .andExpect(jsonPath("$.data.customer.taxId").value("52998224725"))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {
                          "data": {
                            "id": "pix_char_123",
                            "amount": 9990,
                            "status": "PENDING",
                            "brCode": "000201",
                            "brCodeBase64": "base64",
                            "url": "https://pay.abacatepay.com/pix_char_123"
                          },
                          "error": null
                        }
                        """, MediaType.APPLICATION_JSON));

        var response = gateway.createPixPayment(order, new AbacatePayPaymentsGateway.PaymentPayerInput(
                "cliente@shopbank.com",
                "Maria",
                "Silva",
                "52998224725"
        ), BigDecimal.ZERO);

        assertEquals("pix_char_123", response.id());
        assertEquals("000201", response.qrCode());
        assertEquals("https://pay.abacatepay.com/pix_char_123", response.checkoutUrl());
        server.verify();
    }

    @Test
    void shouldCreatePixTransparentPaymentInSandboxWithoutApiKey() {
        AbacatePayProperties properties = new AbacatePayProperties();
        AbacatePayPaymentsGateway gateway = new AbacatePayPaymentsGateway(
                properties,
                RestClient.builder(),
                Mockito.mock(AbacatePayGateway.class)
        );
        Order order = Order.builder()
                .id(10L)
                .totalAmount(new BigDecimal("99.90"))
                .build();

        var response = gateway.createPixPayment(order, new AbacatePayPaymentsGateway.PaymentPayerInput(
                "cliente@shopbank.com",
                "Maria",
                "Silva",
                "52998224725"
        ), BigDecimal.ZERO);

        assertEquals("PENDING", response.status());
        assertEquals("PIX", response.paymentMethod());
        assertEquals(order.getTotalAmount(), response.amount());
    }

    @Test
    void shouldCreateCardPaymentWithHostedCheckout() {
        AbacatePayGateway checkoutGateway = Mockito.mock(AbacatePayGateway.class);
        AbacatePayProperties properties = new AbacatePayProperties();
        AbacatePayPaymentsGateway gateway = new AbacatePayPaymentsGateway(
                properties,
                RestClient.builder(),
                checkoutGateway
        );
        Order order = Order.builder()
                .id(10L)
                .totalAmount(new BigDecimal("99.90"))
                .build();

        Mockito.when(checkoutGateway.createCardCheckout(
                        Mockito.eq(order),
                        Mockito.any(AbacatePayGateway.AbacatePayCheckoutCustomer.class),
                        Mockito.eq(3),
                        Mockito.eq("shopbank://payment/10"),
                        Mockito.eq("shopbank://payment/10")
                ))
                .thenReturn(new AbacatePayGateway.AbacatePayCheckout(
                        "bill_card123",
                        "10",
                        "https://app.abacatepay.com/pay/bill_card123",
                        9990L,
                        null,
                        "PAID",
                        null,
                        "2026-05-11T16:00:00Z",
                        "2026-05-11T16:00:00Z"
                ));

        var response = gateway.createCardPayment(order, new AbacatePayPaymentsGateway.CardPaymentInput(
                null,
                null,
                null,
                3,
                new AbacatePayPaymentsGateway.PaymentPayerInput(
                        "cliente@shopbank.com",
                        "Maria",
                        "Silva",
                        "52998224725"
                ),
                BigDecimal.ZERO,
                "shopbank://payment/10",
                "shopbank://payment/10"
        ));

        assertEquals("bill_card123", response.id());
        assertEquals("PENDING", response.status());
        assertEquals("checkout.created", response.statusDetail());
        assertEquals("CARD", response.paymentMethod());
        assertEquals("https://app.abacatepay.com/pay/bill_card123", response.checkoutUrl());
        Mockito.verify(checkoutGateway).createCardCheckout(
                Mockito.eq(order),
                Mockito.argThat(customer -> "cliente@shopbank.com".equals(customer.email())
                        && "Maria".equals(customer.firstName())
                        && "Silva".equals(customer.lastName())
                        && "52998224725".equals(customer.taxId())),
                Mockito.eq(3),
                Mockito.eq("shopbank://payment/10"),
                Mockito.eq("shopbank://payment/10")
        );
    }

    @Test
    void shouldSimulateTransparentPaymentInAbacatePayDevMode() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

        AbacatePayProperties properties = new AbacatePayProperties();
        properties.setApiKey("TEST-token");
        properties.setApiBaseUrl("https://api.abacatepay.test/v2");

        AbacatePayPaymentsGateway gateway = new AbacatePayPaymentsGateway(
                properties,
                builder,
                Mockito.mock(AbacatePayGateway.class)
        );

        server.expect(requestTo("https://api.abacatepay.test/v2/transparents/simulate-payment?id=pix_char_123"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer TEST-token"))
                .andExpect(jsonPath("$.metadata").exists())
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {
                          "data": {
                            "id": "pix_char_123",
                            "amount": 9990,
                            "status": "PAID",
                            "brCode": "000201",
                            "brCodeBase64": "data:image/png;base64,base64"
                          },
                          "error": null,
                          "success": true
                        }
                        """, MediaType.APPLICATION_JSON));

        var response = gateway.simulateTransparentPayment("pix_char_123");

        assertEquals("pix_char_123", response.id());
        assertEquals("PAID", response.status());
        assertEquals("data:image/png;base64,base64", response.qrCodeBase64());
        server.verify();
    }

    @Test
    void shouldFailWhenAbacatePayApiKeyIsMissingOutsideSandbox() {
        AbacatePayProperties properties = new AbacatePayProperties();
        properties.setSandbox(false);
        AbacatePayPaymentsGateway gateway = new AbacatePayPaymentsGateway(
                properties,
                RestClient.builder(),
                Mockito.mock(AbacatePayGateway.class)
        );
        Order order = Order.builder()
                .id(10L)
                .totalAmount(new BigDecimal("99.90"))
                .build();

        assertThrows(BusinessException.class, () ->
                gateway.createPixPayment(order, new AbacatePayPaymentsGateway.PaymentPayerInput(
                        "cliente@shopbank.com",
                        "Maria",
                        "Silva",
                        "11122233344"
                ), BigDecimal.ZERO)
        );
    }
}
