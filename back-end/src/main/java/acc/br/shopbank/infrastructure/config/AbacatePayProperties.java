package acc.br.shopbank.infrastructure.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "abacatepay")
public class AbacatePayProperties {

    public static final String DEFAULT_WEBHOOK_SIGNATURE_KEY =
            "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

    private String apiKey;

    private String webhookSecret;

    private String webhookSignatureKey = DEFAULT_WEBHOOK_SIGNATURE_KEY;

    private boolean webhookSignatureValidationEnabled = true;

    private boolean webhookAutoRegistrationEnabled = true;

    private String webhookName = "ShopBank Payments";

    private List<String> webhookEvents = List.of(
            "checkout.completed",
            "checkout.refunded",
            "checkout.disputed",
            "checkout.lost",
            "transparent.completed",
            "transparent.refunded",
            "transparent.disputed",
            "transparent.lost"
    );

    private boolean sandbox = true;

    private String apiBaseUrl = "https://api.abacatepay.com/v2";

    private String publicUrl = "http://localhost:8080";

    private String returnUrl = "http://localhost:4200/payment/pending";

    private String completionUrl = "http://localhost:4200/payment/success";

    private String failureUrl = "http://localhost:4200/payment/failure";

    private int pixExpiresIn = 3600;

    private int checkoutMaxInstallments = 12;

    public boolean hasWebhookSecret() {
        return StringUtils.hasText(webhookSecret);
    }

    public boolean isConfigured() {
        return StringUtils.hasText(apiKey);
    }

    public String webhookUrl() {
        String url = normalize(publicUrl) + "/api/payments/abacatepay/webhook";
        if (!hasWebhookSecret()) {
            return url;
        }

        return url + "?webhookSecret="
                + UriUtils.encode(webhookSecret, StandardCharsets.UTF_8);
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
