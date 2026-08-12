package acc.br.shopbank.infrastructure.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AbacatePayPropertiesTest {

    @Test
    void shouldReportConfigurationAndBuildWebhookUrlWithoutSecret() {
        AbacatePayProperties properties = new AbacatePayProperties();
        properties.setPublicUrl("https://shopbank.test/");

        assertFalse(properties.isConfigured());
        assertFalse(properties.hasWebhookSecret());
        assertEquals("https://shopbank.test/api/payments/abacatepay/webhook", properties.webhookUrl());
    }

    @Test
    void shouldEncodeWebhookSecretWhenPresent() {
        AbacatePayProperties properties = new AbacatePayProperties();
        properties.setApiKey("token");
        properties.setPublicUrl("https://shopbank.test/base/");
        properties.setWebhookSecret("segredo com espaco");

        assertTrue(properties.isConfigured());
        assertTrue(properties.hasWebhookSecret());
        assertEquals("https://shopbank.test/base/api/payments/abacatepay/webhook?webhookSecret=segredo%20com%20espaco",
                properties.webhookUrl());
    }
}
