package acc.br.shopbank.infrastructure.integration.payment;

import acc.br.shopbank.infrastructure.config.AbacatePayProperties;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AbacatePayWebhookRegistrar {

    private static final ParameterizedTypeReference<AbacatePayListResponse<AbacatePayWebhook>> WEBHOOK_LIST_RESPONSE =
            new ParameterizedTypeReference<>() {
            };

    private static final ParameterizedTypeReference<AbacatePayResponse<AbacatePayWebhook>> WEBHOOK_RESPONSE =
            new ParameterizedTypeReference<>() {
            };

    private final AbacatePayProperties properties;
    private final RestClient.Builder restClientBuilder;

    @EventListener(ApplicationReadyEvent.class)
    public void ensureWebhookOnStartup() {
        ensurePaymentWebhook();
    }

    public void ensurePaymentWebhook() {
        if (!properties.isWebhookAutoRegistrationEnabled()) {
            log.info("AbacatePay webhook auto-registration is disabled");
            return;
        }

        if (!properties.isConfigured()) {
            log.info("AbacatePay API key is not configured. Skipping webhook auto-registration.");
            return;
        }

        if (!properties.hasWebhookSecret()) {
            log.warn("AbacatePay webhook secret is not configured. Skipping webhook auto-registration.");
            return;
        }

        String endpoint = properties.webhookUrl();
        if (!isPublicHttpsUrl(endpoint)) {
            log.warn("AbacatePay webhook endpoint must be a public HTTPS URL. Skipping registration for {}", endpoint);
            return;
        }

        try {
            if (hasCompatibleWebhook(endpoint)) {
                log.info("AbacatePay webhook already registered for {}", endpoint);
                return;
            }

            AbacatePayWebhook created = createWebhook(endpoint);
            log.info("AbacatePay webhook registered id={} endpoint={}", created.id(), created.endpoint());
        } catch (RestClientResponseException ex) {
            log.warn("Could not register AbacatePay webhook: {}{}", ex.getStatusCode().value(),
                    responseBodySuffix(ex));
        } catch (RestClientException ex) {
            log.warn("Could not register AbacatePay webhook: {}", ex.getMessage());
        }
    }

    private boolean hasCompatibleWebhook(String endpoint) {
        AbacatePayListResponse<AbacatePayWebhook> response = client()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/webhooks/list")
                        .queryParam("search", searchableEndpoint(endpoint))
                        .queryParam("limit", 100)
                        .build())
                .retrieve()
                .body(WEBHOOK_LIST_RESPONSE);

        List<AbacatePayWebhook> webhooks = response == null || response.data() == null
                ? List.of()
                : response.data();

        return webhooks.stream()
                .anyMatch(webhook -> endpoint.equals(webhook.endpoint())
                        && webhook.events() != null
                        && webhook.events().containsAll(properties.getWebhookEvents()));
    }

    private AbacatePayWebhook createWebhook(String endpoint) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("name", properties.getWebhookName());
        payload.put("endpoint", endpoint);
        payload.put("secret", properties.getWebhookSecret());
        payload.put("events", properties.getWebhookEvents());

        AbacatePayResponse<AbacatePayWebhook> response = client()
                .post()
                .uri("/webhooks/create")
                .body(payload)
                .retrieve()
                .body(WEBHOOK_RESPONSE);

        AbacatePayWebhook webhook = response == null ? null : response.data();
        if (webhook == null || !StringUtils.hasText(webhook.id())) {
            throw new RestClientException("AbacatePay webhook creation returned no webhook id");
        }
        return webhook;
    }

    private RestClient client() {
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

    private boolean isPublicHttpsUrl(String endpoint) {
        try {
            URI uri = URI.create(endpoint);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            return "https".equalsIgnoreCase(scheme)
                    && StringUtils.hasText(host)
                    && !isLocalOrPrivateHost(host);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private String searchableEndpoint(String endpoint) {
        int queryStart = endpoint.indexOf('?');
        return queryStart < 0 ? endpoint : endpoint.substring(0, queryStart);
    }

    private boolean isLocalOrPrivateHost(String host) {
        String normalized = host.toLowerCase(Locale.ROOT);
        if ("localhost".equals(normalized)
                || normalized.endsWith(".local")
                || normalized.startsWith("127.")
                || normalized.startsWith("10.")
                || normalized.startsWith("192.168.")) {
            return true;
        }

        if (normalized.startsWith("172.")) {
            String[] parts = normalized.split("\\.");
            if (parts.length > 1) {
                try {
                    int second = Integer.parseInt(parts[1]);
                    return second >= 16 && second <= 31;
                } catch (NumberFormatException ignored) {
                    return false;
                }
            }
        }

        return false;
    }

    private String responseBodySuffix(RestClientResponseException exception) {
        return StringUtils.hasText(exception.getResponseBodyAsString())
                ? " - " + exception.getResponseBodyAsString()
                : "";
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AbacatePayWebhook(
            String id,
            String name,
            String endpoint,
            List<String> events
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AbacatePayResponse<T>(
            T data,
            Object success,
            Object error
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AbacatePayListResponse<T>(
            List<T> data,
            Object success,
            Object error,
            Object pagination
    ) {
    }
}
