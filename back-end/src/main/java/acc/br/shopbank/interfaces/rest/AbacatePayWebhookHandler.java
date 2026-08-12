package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.WebhookLogResponse;
import acc.br.shopbank.infrastructure.integration.payment.AbacatePayWebhookValidator;
import acc.br.shopbank.application.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class AbacatePayWebhookHandler {

    private final AbacatePayWebhookValidator webhookValidator;
    private final PaymentService paymentService;

    public ResponseEntity<WebhookLogResponse> handle(
            String rawPayload,
            String signature,
            String abacateSignature,
            String webhookSecret,
            String webhookSecretHeader
    ) {
        String safePayload = rawPayload != null ? rawPayload : "{}";
        String signatureHeader = StringUtils.hasText(signature)
                ? signature
                : abacateSignature;
        String secret = StringUtils.hasText(webhookSecret)
                ? webhookSecret
                : webhookSecretHeader;

        if (!webhookValidator.isValid(safePayload, signatureHeader, secret)) {
            log.warn("Rejected webhook: invalid signature or secret (logged for audit)");
            WebhookLogResponse logged = paymentService.logRawWebhook(safePayload, "rejected.invalid-signature");
            return ResponseEntity.status(401).body(logged);
        }

        return ResponseEntity.ok(paymentService.registerAbacatePayWebhook(safePayload));
    }
}
