package acc.br.shopbank.infrastructure.integration.payment;

import acc.br.shopbank.domain.gateway.PaymentGatewayPayment;
import acc.br.shopbank.infrastructure.config.AbacatePayProperties;
import acc.br.shopbank.domain.model.Order;
import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.infrastructure.integration.payment.AbacatePayGateway.AbacatePayCheckout;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class AbacatePayPaymentsGateway {

    private static final ParameterizedTypeReference<AbacatePayResponse<AbacatePayTransparentCharge>> TRANSPARENT_RESPONSE =
            new ParameterizedTypeReference<>() {
            };

    private static final ParameterizedTypeReference<AbacatePayResponse<AbacatePayTransparentStatus>> TRANSPARENT_STATUS_RESPONSE =
            new ParameterizedTypeReference<>() {
            };

    private final AbacatePayProperties properties;
    private final RestClient.Builder restClientBuilder;
    private final AbacatePayGateway checkoutGateway;

    public AbacatePayPaymentResult createCardPayment(Order order, CardPaymentInput input) {
        AbacatePayCheckout checkout = checkoutGateway.createCardCheckout(
                order,
                new AbacatePayGateway.AbacatePayCheckoutCustomer(
                        input.payer().email(),
                        input.payer().firstName(),
                        input.payer().lastName(),
                        input.payer().cpf()
                ),
                input.installments(),
                input.returnUrl(),
                input.completionUrl()
        );
        return new AbacatePayPaymentResult(
                checkout.id(),
                "PENDING",
                "checkout.created",
                toReais(checkout.amount()),
                "Pedido " + order.getId(),
                "CARD",
                order.getId().toString(),
                checkout.updatedAt(),
                null,
                null,
                null,
                checkout.url()
        );
    }

    public AbacatePayPaymentResult createPixPayment(Order order, PaymentPayerInput payer, BigDecimal applicationFee) {
        return createTransparentPayment(order, payer, "PIX");
    }

    public AbacatePayPaymentResult createBoletoPayment(Order order, PaymentPayerInput payer, BigDecimal applicationFee) {
        return createTransparentPayment(order, payer, "BOLETO");
    }

    public AbacatePayPaymentResult getPayment(String gatewayPaymentId, PaymentMethod method) {
        if (method == PaymentMethod.CREDIT_CARD || method == PaymentMethod.ABACATEPAY) {
            PaymentGatewayPayment checkout = checkoutGateway.findPayment(gatewayPaymentId);
            return new AbacatePayPaymentResult(
                    checkout.paymentId(),
                    checkout.status(),
                    checkout.status(),
                    checkout.amount(),
                    "Pedido " + checkout.externalReference(),
                    "CHECKOUT",
                    checkout.externalReference(),
                    null,
                    null,
                    null,
                    null,
                    null
            );
        }

        try {
            AbacatePayResponse<AbacatePayTransparentStatus> response = client().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/transparents/check")
                            .queryParam("id", gatewayPaymentId)
                            .build())
                    .retrieve()
                    .body(TRANSPARENT_STATUS_RESPONSE);

            AbacatePayTransparentStatus data = response == null ? null : response.data();
            if (data == null || !StringUtils.hasText(data.id())) {
                throw new BusinessException("AbacatePay payment was not found");
            }

            return new AbacatePayPaymentResult(
                    data.id(),
                    data.status(),
                    data.status(),
                    null,
                    null,
                    method.name(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
            );
        } catch (RestClientResponseException ex) {
            throw new BusinessException("AbacatePay payment fetch error: " + ex.getStatusCode().value()
                    + responseBodySuffix(ex));
        } catch (RestClientException ex) {
            log.warn("AbacatePay payment fetch integration error: {}", ex.getMessage());
            throw new BusinessException("AbacatePay payment fetch integration error");
        }
    }

    public AbacatePayPaymentResult getPayment(String gatewayPaymentId) {
        return getPayment(gatewayPaymentId, PaymentMethod.PIX);
    }

    public AbacatePayPaymentResult simulateTransparentPayment(String gatewayPaymentId) {
        if (!StringUtils.hasText(gatewayPaymentId)) {
            throw new BusinessException("AbacatePay payment id is required");
        }

        if (!properties.isConfigured()) {
            if (properties.isSandbox()) {
                return new AbacatePayPaymentResult(
                        gatewayPaymentId,
                        "PAID",
                        "PAID",
                        null,
                        null,
                        "PIX",
                        null,
                        Instant.now().toString(),
                        null,
                        null,
                        null,
                        null
                );
            }
            throw new BusinessException("AbacatePay API key is not configured");
        }

        try {
            AbacatePayResponse<AbacatePayTransparentCharge> response = client()
                    .post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/transparents/simulate-payment")
                            .queryParam("id", gatewayPaymentId)
                            .build())
                    .body(Map.of("metadata", Map.of()))
                    .retrieve()
                    .body(TRANSPARENT_RESPONSE);

            AbacatePayTransparentCharge charge = response == null ? null : response.data();
            if (charge == null || !StringUtils.hasText(charge.id())) {
                throw new BusinessException("AbacatePay payment simulation did not return payment data");
            }

            return transparentResult(charge, null, null);
        } catch (RestClientResponseException ex) {
            log.error("AbacatePay payment simulation error {} body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BusinessException("AbacatePay simulation error: " + ex.getStatusCode().value()
                    + responseBodySuffix(ex));
        } catch (RestClientException ex) {
            log.warn("AbacatePay payment simulation integration error: {}", ex.getMessage());
            throw new BusinessException("AbacatePay simulation integration error");
        }
    }

    private AbacatePayPaymentResult createTransparentPayment(
            Order order,
            PaymentPayerInput payer,
            String method
    ) {
        if (!properties.isConfigured()) {
            if (properties.isSandbox()) {
                return mockTransparentPayment(order, method);
            }
            throw new BusinessException("AbacatePay API key is not configured");
        }

        try {
            AbacatePayResponse<AbacatePayTransparentCharge> response = client()
                    .post()
                    .uri("/transparents/create")
                    .body(transparentPayload(order, payer, method))
                    .retrieve()
                    .body(TRANSPARENT_RESPONSE);

            AbacatePayTransparentCharge charge = response == null ? null : response.data();
            if (charge == null || !StringUtils.hasText(charge.id())) {
                throw new BusinessException("AbacatePay transparent payment was not created");
            }

            return transparentResult(charge, method, order.getId().toString());
        } catch (RestClientResponseException ex) {
            log.error("AbacatePay payment error {} body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BusinessException("AbacatePay error: " + ex.getStatusCode().value()
                    + responseBodySuffix(ex));
        } catch (RestClientException ex) {
            log.warn("AbacatePay transparent integration error: {}", ex.getMessage());
            throw new BusinessException("AbacatePay integration error");
        }
    }

    private AbacatePayPaymentResult transparentResult(
            AbacatePayTransparentCharge charge,
            String method,
            String externalReference
    ) {
        return new AbacatePayPaymentResult(
                charge.id(),
                charge.status(),
                charge.status(),
                toReais(charge.amount()),
                externalReference == null ? null : "Pedido " + externalReference,
                method,
                externalReference,
                charge.updatedAt(),
                charge.brCode(),
                charge.brCodeBase64(),
                charge.url(),
                charge.url()
        );
    }

    private AbacatePayPaymentResult mockTransparentPayment(Order order, String method) {
        String idPrefix = "BOLETO".equals(method) ? "mock-boleto-" : "mock-pix-";
        String id = idPrefix + order.getId() + "-" + UUID.randomUUID();
        String qrCode = "SHOPBANK-" + method + "-ORDER-" + order.getId() + "-DEV-MODE";
        String boletoUrl = "BOLETO".equals(method)
                ? "https://mock.shopbank/abacatepay/boleto/" + order.getId()
                : null;

        return new AbacatePayPaymentResult(
                id,
                "PENDING",
                "DEV_MODE_MOCK",
                order.getTotalAmount(),
                "Pedido " + order.getId(),
                method,
                order.getId().toString(),
                Instant.now().toString(),
                qrCode,
                null,
                boletoUrl,
                boletoUrl
        );
    }

    private Map<String, Object> transparentPayload(Order order, PaymentPayerInput payer, String method) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("method", method);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("amount", toCents(order.getTotalAmount()));
        data.put("description", "Pedido " + order.getId());
        data.put("externalId", order.getId().toString());
        data.put("expiresIn", properties.getPixExpiresIn());
        data.put("metadata", Map.of("orderId", order.getId()));

        Map<String, Object> customer = customerPayload(payer);
        if (!customer.isEmpty()) {
            data.put("customer", customer);
        }

        body.put("data", data);
        return body;
    }

    private Map<String, Object> customerPayload(PaymentPayerInput payer) {
        Map<String, Object> customer = new LinkedHashMap<>();
        String name = fullName(payer.firstName(), payer.lastName());
        if (StringUtils.hasText(name)) {
            customer.put("name", name);
        }
        if (StringUtils.hasText(payer.email())) {
            customer.put("email", payer.email());
        }
        if (StringUtils.hasText(payer.cpf())) {
            String cpf = BrazilianTaxId.digitsOnly(payer.cpf());
            if (!BrazilianTaxId.isValidCpf(cpf)) {
                throw new BusinessException("CPF do pagador inválido");
            }
            customer.put("taxId", cpf);
        }
        customer.put("cellphone", "+5511999999999");
        return customer;
    }

    private String fullName(String firstName, String lastName) {
        return ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
    }

    private RestClient client() {
        if (!properties.isConfigured()) {
            throw new BusinessException("AbacatePay API key is not configured");
        }

        configureWindowsTrustStore();

        return restClientBuilder
                .baseUrl(properties.getApiBaseUrl())
                .defaultHeader("Authorization", "Bearer " + properties.getApiKey())
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    private void configureWindowsTrustStore() {
        String osName = System.getProperty("os.name", "").toLowerCase();

        if (!osName.contains("win")) {
            return;
        }

        if (StringUtils.hasText(System.getProperty("javax.net.ssl.trustStore"))
                || StringUtils.hasText(System.getProperty("javax.net.ssl.trustStoreType"))) {
            return;
        }

        System.setProperty("javax.net.ssl.trustStoreType", "Windows-ROOT");
    }

    private Long toCents(BigDecimal value) {
        if (value == null) {
            return 0L;
        }

        return value.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }

    private BigDecimal toReais(Long cents) {
        if (cents == null) {
            return null;
        }

        return BigDecimal.valueOf(cents, 2);
    }

    private String responseBodySuffix(RestClientResponseException exception) {
        return StringUtils.hasText(exception.getResponseBodyAsString())
                ? " - " + exception.getResponseBodyAsString()
                : "";
    }

    public record CardPaymentInput(
            String token,
            String paymentMethodId,
            String issuerId,
            Integer installments,
            PaymentPayerInput payer,
            BigDecimal applicationFee,
            String returnUrl,
            String completionUrl
    ) {
    }

    public record PaymentPayerInput(
            String email,
            String firstName,
            String lastName,
            String cpf
    ) {
    }

    public record AbacatePayPaymentResult(
            String id,
            String status,
            String statusDetail,
            BigDecimal amount,
            String description,
            String paymentMethod,
            String externalReference,
            String updatedAt,
            String qrCode,
            String qrCodeBase64,
            String boletoUrl,
            String checkoutUrl
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AbacatePayTransparentCharge(
            String id,
            Long amount,
            String status,
            String brCode,
            String brCodeBase64,
            String barCode,
            String url,
            Long platformFee,
            String expiresAt,
            String createdAt,
            String updatedAt
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AbacatePayTransparentStatus(
            String id,
            String status,
            String expiresAt
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AbacatePayResponse<T>(
            T data,
            Object success,
            Object error
    ) {
    }
}
