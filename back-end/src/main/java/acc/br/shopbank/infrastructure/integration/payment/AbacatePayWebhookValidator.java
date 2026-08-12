package acc.br.shopbank.infrastructure.integration.payment;

import acc.br.shopbank.infrastructure.config.AbacatePayProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Slf4j
@Component
@RequiredArgsConstructor
public class AbacatePayWebhookValidator {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final AbacatePayProperties properties;

    public boolean isValid(String rawPayload, String signatureHeader, String webhookSecret) {
        if (!isValidSecret(webhookSecret)) {
            log.warn("Rejected AbacatePay webhook: invalid webhook secret");
            return false;
        }

        if (!properties.isWebhookSignatureValidationEnabled()) {
            log.warn("AbacatePay webhook signature validation is disabled");
            return true;
        }

        if (!StringUtils.hasText(signatureHeader)) {
            log.warn("Rejected AbacatePay webhook: missing signature");
            return false;
        }

        if (!StringUtils.hasText(properties.getWebhookSignatureKey())) {
            log.warn("Rejected AbacatePay webhook: missing signature key");
            return false;
        }

        try {
            String expected = hmacSha256Base64(rawPayload == null ? "" : rawPayload,
                    properties.getWebhookSignatureKey());
            boolean ok = constantTimeEquals(expected, signatureHeader.trim());
            if (!ok) {
                log.warn("Rejected AbacatePay webhook: signature mismatch");
            }
            return ok;
        } catch (Exception ex) {
            log.error("AbacatePay webhook validation error", ex);
            return false;
        }
    }

    private boolean isValidSecret(String webhookSecret) {
        if (!properties.hasWebhookSecret()) {
            return true;
        }

        return StringUtils.hasText(webhookSecret)
                && constantTimeEquals(properties.getWebhookSecret(), webhookSecret);
    }

    private String hmacSha256Base64(String rawPayload, String key) throws Exception {
        Mac mac = Mac.getInstance(HMAC_ALGORITHM);
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
        byte[] raw = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(raw);
    }

    private boolean constantTimeEquals(String expected, String actual) {
        if (expected == null || actual == null) {
            return false;
        }

        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }
}
