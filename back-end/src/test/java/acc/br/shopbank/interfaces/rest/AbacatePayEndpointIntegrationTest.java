package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.Order;
import acc.br.shopbank.domain.model.OrderItem;
import acc.br.shopbank.domain.model.Payment;
import acc.br.shopbank.domain.model.Product;
import acc.br.shopbank.infrastructure.config.AbacatePayProperties;
import acc.br.shopbank.domain.enums.OrderStatus;
import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;
import acc.br.shopbank.infrastructure.integration.payment.AbacatePayGateway;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.OrderRepository;
import acc.br.shopbank.domain.repository.PaymentRepository;
import acc.br.shopbank.domain.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "abacatepay.api-key=TEST-token",
        "abacatepay.api-base-url=https://api.abacatepay.test/v2",
        "abacatepay.public-url=http://localhost:8080",
        "abacatepay.webhook-secret=",
        "abacatepay.webhook-signature-validation-enabled=false",
        "shopbank.messaging.enabled=false"
})
public class AbacatePayEndpointIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AbacatePayGateway abacatePayGateway;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AbacatePayProperties abacatePayProperties;

    private MockRestServiceServer abacatePayServer;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private org.springframework.jms.core.JmsTemplate jmsTemplate;

    @BeforeEach
    void setup() {
        abacatePayProperties.setWebhookSecret(null);

        RestClient.Builder gatewayRestClientBuilder = (RestClient.Builder) ReflectionTestUtils
                .getField(abacatePayGateway, "restClientBuilder");

        abacatePayServer = MockRestServiceServer.bindTo(gatewayRestClientBuilder).build();
    }

    @Test
    @WithMockUser(username = "cliente@shopbank.com", roles = "CLIENT")
    void shouldCreateAbacatePayCheckoutThroughEndpoint() throws Exception {
        Order order = reservedOrder();
        OrderItem item = order.getItems().getFirst();

        abacatePayServer.expect(requestTo("https://api.abacatepay.test/v2/products/list?externalId=shopbank-product-1&status=ACTIVE&limit=1"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer TEST-token"))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {
                          "data": [
                            {
                              "id": "prod_abc123",
                              "externalId": "shopbank-product-1",
                              "name": "Smartphone Galaxy",
                              "price": 9990,
                              "status": "ACTIVE"
                            }
                          ],
                          "error": null
                        }
                        """, MediaType.APPLICATION_JSON));

        abacatePayServer.expect(requestTo("https://api.abacatepay.test/v2/checkouts/create"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer TEST-token"))
                .andExpect(jsonPath("$.externalId").value(order.getId().toString()))
                .andExpect(jsonPath("$.items[0].id").value("prod_abc123"))
                .andExpect(jsonPath("$.items[0].quantity").value(item.getQuantity()))
                .andExpect(jsonPath("$.methods[0]").value("PIX"))
                .andExpect(jsonPath("$.methods[1]").value("CARD"))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {
                          "data": {
                            "id": "bill_abc123",
                            "url": "https://pay.abacatepay.com/bill_abc123",
                            "amount": 9990,
                            "status": "PENDING",
                            "externalId": "1000"
                          },
                          "error": null
                        }
                        """, MediaType.APPLICATION_JSON));

        mockMvc.perform(post("/api/payments/abacatepay/checkout/{orderId}", order.getId()))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.orderId")
                        .value(order.getId()))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.method")
                        .value("ABACATEPAY"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.status")
                        .value("PENDING"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.checkoutUrl")
                        .value("https://app.abacatepay.com/pay/bill_abc123"));

        abacatePayServer.verify();

        Payment payment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertEquals(PaymentMethod.ABACATEPAY, payment.getMethod());
        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        assertEquals("bill_abc123", payment.getGatewayPreferenceId());
        assertEquals("https://app.abacatepay.com/pay/bill_abc123", payment.getCheckoutUrl());
    }

    @Test
    @WithMockUser(username = "cliente@shopbank.com", roles = "CLIENT")
    void shouldCreateCreditCardCheckoutThroughEndpoint() throws Exception {
        Order order = reservedOrder();
        OrderItem item = order.getItems().getFirst();

        abacatePayServer.expect(requestTo("https://api.abacatepay.test/v2/customers/create"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer TEST-token"))
                .andExpect(jsonPath("$.email").value("test@testuser.com"))
                .andExpect(jsonPath("$.name").value("Cliente Sandbox"))
                .andExpect(jsonPath("$.taxId").value("52998224725"))
                .andExpect(jsonPath("$.cellphone").value("+5511999999999"))
                .andExpect(jsonPath("$.metadata.orderId").value(order.getId()))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {
                          "data": {
                            "id": "cust_card123",
                            "email": "test@testuser.com",
                            "name": "Cliente Sandbox",
                            "taxId": "52998224725"
                          },
                          "error": null
                        }
                        """, MediaType.APPLICATION_JSON));

        abacatePayServer.expect(requestTo("https://api.abacatepay.test/v2/products/list?externalId=shopbank-product-1&status=ACTIVE&limit=1"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer TEST-token"))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {
                          "data": [
                            {
                              "id": "prod_abc123",
                              "externalId": "shopbank-product-1",
                              "name": "Smartphone Galaxy",
                              "price": 9990,
                              "status": "ACTIVE"
                            }
                          ],
                          "error": null
                        }
                        """, MediaType.APPLICATION_JSON));

        abacatePayServer.expect(requestTo("https://api.abacatepay.test/v2/checkouts/create"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer TEST-token"))
                .andExpect(jsonPath("$.externalId").value(startsWith(order.getId() + "-card-")))
                .andExpect(jsonPath("$.customerId").value("cust_card123"))
                .andExpect(jsonPath("$.items[0].id").value("prod_abc123"))
                .andExpect(jsonPath("$.items[0].quantity").value(item.getQuantity()))
                .andExpect(jsonPath("$.methods[0]").value("CARD"))
                .andExpect(jsonPath("$.methods.length()").value(1))
                .andExpect(jsonPath("$.card.maxInstallments").value(1))
                .andExpect(jsonPath("$.metadata.orderId").value(order.getId()))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {
                          "data": {
                            "id": "bill_card123",
                            "url": "https://app.abacatepay.com/pay/bill_card123",
                            "amount": 9990,
                            "status": "PENDING",
                            "externalId": "1000"
                          },
                          "error": null
                        }
                        """, MediaType.APPLICATION_JSON));

        mockMvc.perform(post("/api/payments/orders/{orderId}/card", order.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "installments": 1,
                                  "payerEmail": "test@testuser.com",
                                  "payerCpf": "52998224725",
                                  "payerFirstName": "Cliente",
                                  "payerLastName": "Sandbox"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.orderId")
                        .value(order.getId()))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.method")
                        .value("CREDIT_CARD"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.status")
                        .value("PENDING"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.gatewayPaymentId")
                        .value("bill_card123"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.checkoutUrl")
                        .value("https://app.abacatepay.com/pay/bill_card123"));

        abacatePayServer.verify();

        Payment payment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertEquals(PaymentMethod.CREDIT_CARD, payment.getMethod());
        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        assertEquals("bill_card123", payment.getGatewayPaymentId());
        assertEquals("https://app.abacatepay.com/pay/bill_card123", payment.getCheckoutUrl());
    }

    @Test
    void shouldAcceptAbacatePayWebhookWithoutAuthentication() throws Exception {
        mockMvc.perform(post("/api/payments/abacatepay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "evt-webhook-open",
                                  "event": "checkout.completed",
                                  "data": {}
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAcceptAbacatePayWebhookWithTrailingSlash() throws Exception {
        mockMvc.perform(post("/api/payments/abacatepay/webhook/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "evt-webhook-slash",
                                  "event": "checkout.completed",
                                  "data": {}
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAcceptAbacatePayWebhookAtRootFallback() throws Exception {
        mockMvc.perform(post("/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "evt-webhook-root",
                                  "event": "checkout.completed",
                                  "data": {}
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAcceptAbacatePayWebhookSecretHeader() throws Exception {
        abacatePayProperties.setWebhookSecret("panel-secret");

        mockMvc.perform(post("/api/payments/abacatepay/webhook")
                        .header("X-Webhook-Secret", "panel-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "evt-webhook-secret-header",
                                  "event": "checkout.completed",
                                  "data": {}
                                }
                                """))
                .andExpect(status().isOk());
    }

    private Order reservedOrder() {
        Customer customer = customerRepository.findById(1L).orElseThrow();
        Product product = productRepository.findById(1L).orElseThrow();

        Order order = Order.builder()
                .customer(customer)
                .status(OrderStatus.RESERVED)
                .totalAmount(new BigDecimal("99.90"))
                .build();

        OrderItem item = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(1)
                .unitPrice(new BigDecimal("99.90"))
                .subtotal(new BigDecimal("99.90"))
                .build();

        order.getItems().add(item);
        return orderRepository.save(order);
    }
}
