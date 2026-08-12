package acc.br.shopbank.infrastructure.integration.payment;

import acc.br.shopbank.domain.gateway.PaymentGateway;
import acc.br.shopbank.domain.gateway.PaymentGatewayPayment;
import acc.br.shopbank.domain.gateway.PaymentGatewayPreference;
import acc.br.shopbank.infrastructure.config.AbacatePayProperties;
import acc.br.shopbank.domain.model.Order;
import acc.br.shopbank.domain.model.OrderItem;
import acc.br.shopbank.domain.model.Product;
import acc.br.shopbank.domain.exception.BusinessException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class AbacatePayGateway implements PaymentGateway {

    private static final ParameterizedTypeReference<AbacatePayResponse<AbacatePayCheckout>> CHECKOUT_RESPONSE =
            new ParameterizedTypeReference<>() {
            };

    private static final ParameterizedTypeReference<AbacatePayResponse<AbacatePayProduct>> PRODUCT_RESPONSE =
            new ParameterizedTypeReference<>() {
            };

    private static final ParameterizedTypeReference<AbacatePayResponse<AbacatePayCustomer>> CUSTOMER_RESPONSE =
            new ParameterizedTypeReference<>() {
            };

    private static final ParameterizedTypeReference<AbacatePayProductListResponse> PRODUCT_LIST_RESPONSE =
            new ParameterizedTypeReference<>() {
            };

    private final AbacatePayProperties properties;
    private final RestClient.Builder restClientBuilder;

    @Override
    public PaymentGatewayPreference createPreference(Order order) {
        AbacatePayCheckout checkout = createCheckout(order, checkoutOptions(List.of("PIX", "CARD")));
        return new PaymentGatewayPreference(checkout.id(), checkout.url());
    }

    public AbacatePayCheckout createCheckout(Order order, List<String> methods) {
        return createCheckout(order, checkoutOptions(methods));
    }

    public AbacatePayCheckout createCardCheckout(
            Order order,
            AbacatePayCheckoutCustomer customer,
            Integer installments,
            String returnUrl,
            String completionUrl
    ) {
        String customerId = null;
        if (properties.isConfigured() && customer != null && StringUtils.hasText(customer.email())) {
            customerId = createCustomer(customer, order).id();
        }

        int maxInstallments = installments == null ? properties.getCheckoutMaxInstallments() : installments;
        CheckoutOptions options = new CheckoutOptions(
                List.of("CARD"),
                customerId,
                Math.max(1, Math.min(12, maxInstallments)),
                true,
                returnUrl,
                completionUrl
        );
        return createCheckout(order, options);
    }

    private AbacatePayCheckout createCheckout(Order order, CheckoutOptions options) {
        if (!properties.isConfigured()) {
            String checkoutId = "mock-abacate-checkout-" + order.getId() + "-" + System.currentTimeMillis();
            String checkoutUrl = "https://mock.shopbank/abacatepay/checkout/" + order.getId();
            return new AbacatePayCheckout(checkoutId, order.getId().toString(), checkoutUrl,
                    toCents(order.getTotalAmount()), null, "PENDING", null, null, null);
        }

        try {
            AbacatePayResponse<AbacatePayCheckout> response = client()
                    .post()
                    .uri("/checkouts/create")
                    .body(checkoutPayload(order, options))
                    .retrieve()
                    .body(CHECKOUT_RESPONSE);

            AbacatePayCheckout checkout = response == null ? null : response.data();
            if (checkout == null || !StringUtils.hasText(checkout.id())) {
                throw new BusinessException("AbacatePay checkout was not created");
            }

            AbacatePayCheckout normalized = normalizeCheckoutUrl(checkout);
            log.info("AbacatePay checkout created id={} externalId={} status={} url={}",
                    normalized.id(), normalized.externalId(), normalized.status(), normalized.url());
            return normalized;
        } catch (RestClientResponseException exception) {
            throw new BusinessException("AbacatePay API error: " + exception.getStatusCode().value()
                    + responseBodySuffix(exception));
        } catch (RestClientException exception) {
            throw new BusinessException("AbacatePay integration error");
        }
    }

    private CheckoutOptions checkoutOptions(List<String> methods) {
        return new CheckoutOptions(methods, null, properties.getCheckoutMaxInstallments(), false, null, null);
    }

    @Override
    public PaymentGatewayPayment findPayment(String gatewayPaymentId) {
        AbacatePayCheckout checkout = findCheckout(gatewayPaymentId);
        return new PaymentGatewayPayment(
                checkout.id(),
                checkout.externalId(),
                checkout.status(),
                toReais(checkout.amount()),
                toLocalDateTime(checkout.updatedAt())
        );
    }

    public AbacatePayCheckout findCheckout(String checkoutId) {
        try {
            AbacatePayResponse<AbacatePayCheckout> response = client()
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/checkouts/get")
                            .queryParam("id", checkoutId)
                            .build())
                    .retrieve()
                    .body(CHECKOUT_RESPONSE);

            AbacatePayCheckout checkout = response == null ? null : response.data();
            if (checkout == null || !StringUtils.hasText(checkout.id())) {
                throw new BusinessException("AbacatePay checkout was not found");
            }

            return normalizeCheckoutUrl(checkout);
        } catch (RestClientResponseException exception) {
            throw new BusinessException("AbacatePay API error: " + exception.getStatusCode().value()
                    + responseBodySuffix(exception));
        } catch (RestClientException exception) {
            throw new BusinessException("AbacatePay integration error");
        }
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

    private AbacatePayCustomer createCustomer(AbacatePayCheckoutCustomer customer, Order order) {
        try {
            AbacatePayResponse<AbacatePayCustomer> response = client()
                    .post()
                    .uri("/customers/create")
                    .body(customerPayload(customer, order))
                    .retrieve()
                    .body(CUSTOMER_RESPONSE);

            AbacatePayCustomer created = response == null ? null : response.data();
            if (created == null || !StringUtils.hasText(created.id())) {
                throw new BusinessException("AbacatePay customer was not created");
            }
            return created;
        } catch (RestClientResponseException exception) {
            throw new BusinessException("AbacatePay customer API error: " + exception.getStatusCode().value()
                    + responseBodySuffix(exception));
        } catch (RestClientException exception) {
            throw new BusinessException("AbacatePay customer integration error");
        }
    }

    private Map<String, Object> checkoutPayload(Order order, CheckoutOptions options) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("items", checkoutItems(order));
        payload.put("externalId", checkoutExternalId(order, options));
        payload.put("returnUrl", checkoutReturnUrl(options));
        payload.put("completionUrl", checkoutCompletionUrl(options));
        payload.put("methods", options.methods());
        if (StringUtils.hasText(options.customerId())) {
            payload.put("customerId", options.customerId());
        }
        if (options.methods().contains("CARD")) {
            payload.put("card", Map.of("maxInstallments", options.maxInstallments()));
        }
        payload.put("metadata", Map.of("orderId", order.getId()));
        return payload;
    }

    private String checkoutExternalId(Order order, CheckoutOptions options) {
        if (!options.uniqueAttemptExternalId()) {
            return order.getId().toString();
        }

        return order.getId() + "-card-" + UUID.randomUUID();
    }

    private String checkoutReturnUrl(CheckoutOptions options) {
        return checkoutRedirectUrl(
                StringUtils.hasText(options.returnUrl()) ? options.returnUrl() : properties.getReturnUrl()
        );
    }

    private String checkoutCompletionUrl(CheckoutOptions options) {
        return checkoutRedirectUrl(
                StringUtils.hasText(options.completionUrl()) ? options.completionUrl() : properties.getCompletionUrl()
        );
    }

    private String checkoutRedirectUrl(String redirectUrl) {
        if (!StringUtils.hasText(redirectUrl)
                || redirectUrl.startsWith("http://")
                || redirectUrl.startsWith("https://")) {
            return redirectUrl;
        }

        return UriComponentsBuilder
                .fromUriString(properties.getPublicUrl())
                .path("/api/payments/mobile-return")
                .queryParam("redirect", redirectUrl)
                .build()
                .encode()
                .toUriString();
    }

    private Map<String, Object> customerPayload(AbacatePayCheckoutCustomer customer, Order order) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("email", customer.email());

        String name = fullName(customer.firstName(), customer.lastName());
        if (StringUtils.hasText(name)) {
            payload.put("name", name);
        }

        if (StringUtils.hasText(customer.taxId())) {
            String taxId = BrazilianTaxId.digitsOnly(customer.taxId());
            if (!BrazilianTaxId.isValidCpf(taxId)) {
                throw new BusinessException("CPF do pagador inválido");
            }
            payload.put("taxId", taxId);
        }

        payload.put("cellphone", "+5511999999999");
        payload.put("metadata", Map.of("orderId", order.getId()));
        return payload;
    }

    private List<Map<String, Object>> checkoutItems(Order order) {
        return order.getItems()
                .stream()
                .map(this::checkoutItem)
                .toList();
    }

    private Map<String, Object> checkoutItem(OrderItem item) {
        return Map.of(
                "id", ensureProduct(item.getProduct()),
                "quantity", item.getQuantity()
        );
    }

    private String ensureProduct(Product product) {
        String externalId = "shopbank-product-" + product.getId();
        AbacatePayProduct existing = findProductByExternalId(externalId);
        if (existing != null && StringUtils.hasText(existing.id())) {
            return existing.id();
        }

        AbacatePayResponse<AbacatePayProduct> response = client()
                .post()
                .uri("/products/create")
                .body(productPayload(product, externalId))
                .retrieve()
                .body(PRODUCT_RESPONSE);

        AbacatePayProduct created = response == null ? null : response.data();
        if (created == null || !StringUtils.hasText(created.id())) {
            throw new BusinessException("AbacatePay product was not created");
        }

        return created.id();
    }

    private AbacatePayProduct findProductByExternalId(String externalId) {
        AbacatePayProductListResponse response = client()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/products/list")
                        .queryParam("externalId", externalId)
                        .queryParam("status", "ACTIVE")
                        .queryParam("limit", 1)
                        .build())
                .retrieve()
                .body(PRODUCT_LIST_RESPONSE);

        if (response == null || response.data() == null || response.data().isEmpty()) {
            return null;
        }

        return response.data().getFirst();
    }

    private Map<String, Object> productPayload(Product product, String externalId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("externalId", externalId);
        payload.put("name", product.getName());
        payload.put("price", toCents(product.getPrice()));
        payload.put("currency", "BRL");
        if (StringUtils.hasText(product.getDescription())) {
            payload.put("description", product.getDescription());
        }
        if (StringUtils.hasText(product.getImageUrl())) {
            payload.put("imageUrl", product.getImageUrl());
        }
        return payload;
    }

    private String fullName(String firstName, String lastName) {
        return ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
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

    private LocalDateTime toLocalDateTime(String dateTime) {
        if (!StringUtils.hasText(dateTime)) {
            return null;
        }

        try {
            return OffsetDateTime.parse(dateTime).toLocalDateTime();
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String responseBodySuffix(RestClientResponseException exception) {
        return StringUtils.hasText(exception.getResponseBodyAsString())
                ? " - " + exception.getResponseBodyAsString()
                : "";
    }

    private AbacatePayCheckout normalizeCheckoutUrl(AbacatePayCheckout checkout) {
        if (checkout == null || !StringUtils.hasText(checkout.id())) {
            return checkout;
        }

        String normalizedUrl = checkout.url();
        if (!StringUtils.hasText(normalizedUrl)
                || normalizedUrl.matches("https?://pay\\.abacatepay\\.com/?[^/]+/?")) {
            normalizedUrl = "https://app.abacatepay.com/pay/" + checkout.id();
        }

        if (normalizedUrl.equals(checkout.url())) {
            return checkout;
        }

        return new AbacatePayCheckout(
                checkout.id(),
                checkout.externalId(),
                normalizedUrl,
                checkout.amount(),
                checkout.paidAmount(),
                checkout.status(),
                checkout.receiptUrl(),
                checkout.createdAt(),
                checkout.updatedAt()
        );
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AbacatePayCheckout(
            String id,
            String externalId,
            String url,
            Long amount,
            Long paidAmount,
            String status,
            String receiptUrl,
            String createdAt,
            String updatedAt
    ) {
    }

    public record AbacatePayCheckoutCustomer(
            String email,
            String firstName,
            String lastName,
            String taxId
    ) {
    }

    private record CheckoutOptions(
            List<String> methods,
            String customerId,
            int maxInstallments,
            boolean uniqueAttemptExternalId,
            String returnUrl,
            String completionUrl
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AbacatePayCustomer(
            String id,
            String email,
            String taxId,
            String name
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AbacatePayProduct(
            String id,
            String externalId,
            String name,
            Long price,
            String status
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AbacatePayProductListResponse(
            List<AbacatePayProduct> data,
            Object success,
            Object error
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
