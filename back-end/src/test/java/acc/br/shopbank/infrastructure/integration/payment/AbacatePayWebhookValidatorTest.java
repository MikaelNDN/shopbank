package acc.br.shopbank.infrastructure.integration.payment;

import acc.br.shopbank.infrastructure.config.AbacatePayProperties;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class AbacatePayWebhookValidatorTest {

    @Test
    void shouldAcceptValidSecretAndSignature() throws Exception {
        AbacatePayProperties properties = properties();
        AbacatePayWebhookValidator validator = new AbacatePayWebhookValidator(properties);
        String payload = "{\"event\":\"payment.approved\"}";
        String signature = hmac(payload, "signature-key");

        assertTrue(validator.isValid(payload, signature, "webhook-secret"));
    }

    @Test
    void shouldRejectInvalidSecretMissingSignatureAndMismatches() {
        AbacatePayProperties properties = properties();
        AbacatePayWebhookValidator validator = new AbacatePayWebhookValidator(properties);

        assertFalse(validator.isValid("{}", "anything", "wrong-secret"));
        assertFalse(validator.isValid("{}", null, "webhook-secret"));

        properties.setWebhookSignatureKey("");
        assertFalse(validator.isValid("{}", "anything", "webhook-secret"));

        properties.setWebhookSignatureKey("signature-key");
        assertFalse(validator.isValid("{}", "wrong-signature", "webhook-secret"));
    }

    @Test
    void shouldAcceptWithoutSignatureWhenValidationIsDisabled() {
        AbacatePayProperties properties = properties();
        properties.setWebhookSignatureValidationEnabled(false);

        assertTrue(new AbacatePayWebhookValidator(properties)
                .isValid("{}", null, "webhook-secret"));
    }

    @Test
    void shouldAcceptAnySecretWhenWebhookSecretIsNotConfigured() throws Exception {
        AbacatePayProperties properties = properties();
        properties.setWebhookSecret("");
        String signature = hmac("", "signature-key");

        assertTrue(new AbacatePayWebhookValidator(properties)
                .isValid(null, signature, null));
    }

    private AbacatePayProperties properties() {
        AbacatePayProperties properties = new AbacatePayProperties();
        properties.setWebhookSecret("webhook-secret");
        properties.setWebhookSignatureKey("signature-key");
        return properties;
    }

    private String hmac(String payload, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getEncoder()
                .encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }
}
